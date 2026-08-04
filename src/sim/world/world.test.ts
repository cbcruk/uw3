import { describe, expect, it } from "vite-plus/test";
import { currentAt } from "../current/current";
import { bearingDeg, haversineNm, normalizeHeading } from "../geo/geo.utils";
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

  /**
   * SPEC 6: 돛은 정풍 방향으로 추진력을 내지 못한다.
   * 해류가 배를 떠밀 수는 있으므로 판정은 항정이 아니라 돛 속력으로 한다.
   */
  it("맞바람 침로에서는 돛이 추진력을 내지 못한다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });

    let stalledDays = 0;
    for (let i = 0; i < 20; i += 1) {
      const wind = windAt(game.voyage.position, game.voyage.day);
      applyAction(game, { type: "set-heading", headingDeg: wind.fromDeg });
      const { report } = applyAction(game, { type: "advance-day" });
      stalledDays += (report?.speedKnots ?? 0) === 0 ? 1 : 0;
    }

    expect(stalledDays).toBe(20);
  });

  /** 첫 출항이 제자리면 플레이어는 시뮬레이션이 죽은 것으로 읽는다. */
  it("출항 직후 기본 침로로 전진한다", () => {
    const game = createGame();
    const startLon = game.voyage.position.lon;
    applyAction(game, { type: "depart" });
    const { report } = applyAction(game, { type: "advance-day" });

    expect(report?.distanceNm ?? 0).toBeGreaterThan(0);
    expect(game.voyage.position.lon).toBeLessThan(startLon);
  });

  /**
   * 정박지 한 칸만 항해 가능하면 리스본은 사방이 육지인 구멍이 된다.
   * 태킹 각도가 전부 육지에 막혀 출항이 불가능해진다.
   */
  it("항구 앞바다가 열려 있어 양쪽 태킹으로 외해에 나갈 수 있다", () => {
    for (const headingDeg of [210, 300]) {
      const game = createGame();
      const start = { ...game.voyage.position };
      applyAction(game, { type: "depart" });
      applyAction(game, { type: "set-heading", headingDeg });
      for (let day = 0; day < 5; day += 1) {
        applyAction(game, { type: "advance-day" });
      }

      expect(haversineNm(game.voyage.position, start)).toBeGreaterThan(50);
      expect(game.voyage.position.lon).toBeLessThan(start.lon);
    }
  });

  /** 정풍으로 멈춘 날은 이유가 항해일지에 남아야 한다. 침묵은 고장으로 읽힌다. */
  it("전진하지 못한 날은 이유를 기록한다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    const wind = windAt(game.voyage.position, game.voyage.day);
    applyAction(game, { type: "set-heading", headingDeg: wind.fromDeg });
    const { report } = applyAction(game, { type: "advance-day" });

    expect(report?.speedKnots).toBe(0);
    expect(report?.logs.some((text) => text.includes("정풍"))).toBe(true);
  });

  it("돛을 모두 접으면 그 이유가 기록된다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    game.voyage.sailsSet.forEach((_, mast) => {
      applyAction(game, { type: "set-sail", mast, set: false });
    });
    const { report } = applyAction(game, { type: "advance-day" });

    expect(report?.speedKnots).toBe(0);
    expect(report?.logs.some((text) => text.includes("돛을 모두 접은"))).toBe(true);
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

/**
 * SPEC 3.2: 충실도 주장은 실행되는 테스트여야 한다.
 * 해류를 넣는 이유는 "배가 침로대로 가지 않는다"는 감각 하나다.
 */
describe("해류가 항적에 미치는 영향", () => {
  /** 카나리아 해류는 아프리카 서안을 남으로 흐른다. 남하하는 배를 밀어준다. */
  function sailOneDay(position: { lat: number; lon: number }, headingDeg: number) {
    const game = createGame();
    applyAction(game, { type: "depart" });
    game.voyage.position = { ...position };
    applyAction(game, { type: "set-heading", headingDeg });
    const { report } = applyAction(game, { type: "advance-day" });
    return report;
  }

  const CANARY = { lat: 27, lon: -18 };

  it("순류로 남하하면 돛 속력만으로 갈 거리보다 멀리 간다", () => {
    const report = sailOneDay(CANARY, 180);

    expect(report).not.toBeNull();
    expect(report!.current.speedKnots).toBeGreaterThan(0.3);
    expect(report!.distanceNm).toBeGreaterThan(report!.speedKnots * 24);
  });

  /**
   * 바람에서 같은 각도로 벌린 두 침로는 돛 속력이 같다. 그런데 하나는 해류를 타고
   * 하나는 거스르므로 실제 항정이 달라진다 — 이 차이가 온전히 해류의 몫이다.
   */
  it("돛 속력이 같아도 해류를 거스르면 덜 간다", () => {
    // 바람에서 좌우로 꼭 같은 각을 벌리면 돛 속력이 같다. 남은 차이는 해류뿐이다.
    const probe = createGame();
    applyAction(probe, { type: "depart" });
    probe.voyage.position = { ...CANARY };
    const wind = windAt(CANARY, probe.voyage.day);
    const current = currentAt(CANARY);

    const starboard = normalizeHeading(wind.fromDeg + 90);
    const port = normalizeHeading(wind.fromDeg - 90);
    const alignment = (heading: number): number =>
      Math.abs(((heading - current.toDeg + 540) % 360) - 180);
    const [withCurrent, againstCurrent] =
      alignment(starboard) < alignment(port) ? [starboard, port] : [port, starboard];

    const carried = sailOneDay(CANARY, withCurrent);
    const opposed = sailOneDay(CANARY, againstCurrent);

    expect(carried!.speedKnots).toBeCloseTo(opposed!.speedKnots, 6);
    expect(carried!.speedKnots).toBeGreaterThan(0);
    expect(carried!.distanceNm).toBeGreaterThan(opposed!.distanceNm);
  });

  /** 침로와 실제 진행 방위가 어긋나는 것이 해류의 본질이다. */
  it("가로지르면 항적이 침로에서 벗어난다", () => {
    const report = sailOneDay(CANARY, 270);

    expect(report).not.toBeNull();
    const drift = Math.abs(((report!.trackDeg - 270 + 540) % 360) - 180);
    expect(drift).toBeGreaterThan(1);
  });

  it("해류가 없는 바다에서는 항적이 침로와 같다", () => {
    const report = sailOneDay({ lat: 0, lon: -30 }, 270);

    expect(report).not.toBeNull();
    const drift = Math.abs(((report!.trackDeg - 270 + 540) % 360) - 180);
    expect(drift).toBeLessThan(12);
  });
});
