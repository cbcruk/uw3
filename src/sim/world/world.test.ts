import { describe, expect, it } from "vite-plus/test";
import { bearingDeg, haversineNm } from "../geo/geo.utils";
import { windAt } from "../wind/wind";
import type { Game, GameAction } from "./world.types";
import { DEFAULT_CONFIG, applyAction, createGame, replay } from "./world";

function fingerprint(game: Game): string {
  return JSON.stringify({
    voyage: game.voyage,
    gold: game.gold,
    ended: game.ended,
    journal: game.journal,
    revealed: Array.from(game.exploration.revealed),
    rngVoyage: game.rng.voyage.getState(),
  });
}

const SCRIPT: readonly GameAction[] = [
  { type: "depart" },
  { type: "set-heading", headingDeg: 200 },
  ...Array.from({ length: 30 }, (): GameAction => ({ type: "advance-day" })),
  { type: "set-heading", headingDeg: 90 },
  ...Array.from({ length: 25 }, (): GameAction => ({ type: "advance-day" })),
];

describe("createGame", () => {
  it("수도 항구에 입항한 상태로 시작한다", () => {
    const game = createGame();
    expect(game.voyage.atPortId).toBe("lisboa");
    expect(game.voyage.anchored).toBe(true);
    expect(game.voyage.food).toBeGreaterThan(0);
    expect(game.exploration.revealedCount()).toBeGreaterThan(0);
  });

  it("입항 중에는 안개가 걷히기만 하고 배는 움직이지 않는다", () => {
    const game = createGame();
    const before = { ...game.voyage.position };
    applyAction(game, { type: "advance-day" });
    expect(game.voyage.position).toEqual(before);
    expect(game.voyage.daysAtSea).toBe(0);
  });
});

describe("항해 진행", () => {
  /**
   * SPEC 8.2: 리스본은 편서풍을 정면으로 받는다. 서쪽 외해로 나가려면 태킹해야 한다.
   * "알아도 거기 도달하기가 어렵다"가 난이도의 출처다 (SPEC 2).
   */
  it("태킹하면 맞바람 방향으로도 전진한다", () => {
    const game = createGame();
    const revealedBefore = game.exploration.revealedCount();
    const startLon = game.voyage.position.lon;
    applyAction(game, { type: "depart" });

    let tack = 1;
    let moved = 0;
    for (let day = 0; day < 40; day += 1) {
      const wind = windAt(game.voyage.position, game.voyage.day);
      applyAction(game, { type: "set-heading", headingDeg: wind.fromDeg + tack * 55 });
      const { report } = applyAction(game, { type: "advance-day" });
      moved += report?.distanceNm ?? 0;
      if (report?.blockedByLand === true || day % 5 === 4) {
        tack = -tack;
      }
    }

    expect(moved).toBeGreaterThan(0);
    expect(game.voyage.position.lon).toBeLessThan(startLon);
    expect(game.exploration.revealedCount()).toBeGreaterThan(revealedBefore);
  });

  /** SPEC 8.2: 돛은 정풍 방향으로 전진하지 못한다. 리스본은 편서풍을 정면으로 받는다. */
  it("맞바람 침로로는 전진하지 못한다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });

    let stalledDays = 0;
    for (let i = 0; i < 20; i += 1) {
      const wind = windAt(game.voyage.position, game.voyage.day);
      applyAction(game, { type: "set-heading", headingDeg: wind.fromDeg });
      const { report } = applyAction(game, { type: "advance-day" });
      stalledDays += (report?.distanceNm ?? 0) === 0 ? 1 : 0;
    }

    expect(stalledDays).toBe(20);
  });

  it("배는 육지를 통과하지 못한다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 90 });
    for (let i = 0; i < 20; i += 1) {
      applyAction(game, { type: "advance-day" });
      expect(game.tileMap.isNavigable(game.voyage.position)).toBe(true);
    }
  });

  it("보급은 소모되고 바다에서는 회복되지 않는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    const foodBefore = game.voyage.food;
    for (let i = 0; i < 15; i += 1) {
      applyAction(game, { type: "advance-day" });
    }
    expect(game.voyage.food).toBeLessThan(foodBefore);
  });

  /** SPEC 4.2: 트러블은 즉사시키지 않는다. 자원을 깎아 계획 재조정을 강제한다. */
  it("긴 항해에서도 트러블 하나로 즉사하지 않는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 250 });

    let previousCrew = game.voyage.crew;
    for (let i = 0; i < 120; i += 1) {
      applyAction(game, { type: "advance-day" });
      expect(game.voyage.crew).toBeGreaterThanOrEqual(previousCrew - 4);
      previousCrew = game.voyage.crew;
    }
  });

  /** 하루 항정이 입항 반경보다 길므로 종점이 아니라 항로 위에서 판정해야 한다. */
  it("항구 근처를 지나는 항로면 자동 입항한다", () => {
    const game = createGame();
    const lisboa = { lat: 38.71, lon: -9.14 };
    applyAction(game, { type: "depart" });

    let tack = 1;
    for (let day = 0; day < 12; day += 1) {
      const wind = windAt(game.voyage.position, game.voyage.day);
      applyAction(game, { type: "set-heading", headingDeg: wind.fromDeg + tack * 55 });
      const { report } = applyAction(game, { type: "advance-day" });
      if (report?.blockedByLand === true || day % 4 === 3) {
        tack = -tack;
      }
    }

    expect(game.voyage.atPortId).toBeNull();
    expect(haversineNm(game.voyage.position, lisboa)).toBeGreaterThan(12);

    let docked = false;
    let detour = 0;
    for (let day = 0; day < 40 && !docked; day += 1) {
      const homeward = bearingDeg(game.voyage.position, lisboa);
      applyAction(game, { type: "set-heading", headingDeg: homeward + detour });
      const { report } = applyAction(game, { type: "advance-day" });
      detour = report?.blockedByLand === true ? (detour === 0 ? 45 : -detour) : 0;
      docked = game.voyage.atPortId !== null;
    }

    expect(docked).toBe(true);
    expect(game.voyage.atPortId).toBe("lisboa");
  });
});

describe("결정론", () => {
  /** SPEC 8.1: seed + 액션 로그 = 완전 재현. */
  it("같은 시드와 액션 로그는 같은 상태를 낸다", () => {
    const first = replay(DEFAULT_CONFIG, SCRIPT);
    const second = replay(DEFAULT_CONFIG, SCRIPT);
    expect(fingerprint(second)).toBe(fingerprint(first));
  });

  it("시드가 다르면 항해 결과가 갈린다", () => {
    const a = replay(DEFAULT_CONFIG, SCRIPT);
    const b = replay({ ...DEFAULT_CONFIG, seed: 0xc0ffee }, SCRIPT);
    expect(fingerprint(b)).not.toBe(fingerprint(a));
  });

  it("기록된 액션 로그를 그대로 되돌리면 같은 상태가 된다", () => {
    const played = createGame();
    for (const action of SCRIPT) {
      applyAction(played, action);
    }
    const restored = replay(DEFAULT_CONFIG, played.actions);
    expect(fingerprint(restored)).toBe(fingerprint(played));
  });
});

describe("풍계", () => {
  it("같은 위치와 날짜는 항상 같은 바람을 낸다", () => {
    const position = { lat: 36.2, lon: -7.5 };
    expect(windAt(position, 1000)).toEqual(windAt(position, 1000));
  });

  it("지브롤터 해협은 동풍과 서풍이 교대한다", () => {
    const strait = { lat: 35.94, lon: -5.5 };
    const regimes = new Set(
      Array.from({ length: 200 }, (_, day) => windAt(strait, day * 2).regime),
    );
    expect(regimes.has("levanter")).toBe(true);
    expect(regimes.has("poniente")).toBe(true);
  });

  it("북대서양 중위도는 편서풍대다", () => {
    expect(windAt({ lat: 45, lon: -12 }, 200).regime).toBe("westerlies");
  });

  it("풍속은 항상 유한한 양수 범위다", () => {
    for (let day = 0; day < 400; day += 7) {
      for (let lat = 29; lat < 46; lat += 2) {
        const wind = windAt({ lat, lon: -8 }, day);
        expect(wind.speedKnots).toBeGreaterThanOrEqual(0);
        expect(wind.speedKnots).toBeLessThanOrEqual(45);
        expect(Number.isFinite(wind.fromDeg)).toBe(true);
      }
    }
  });
});
