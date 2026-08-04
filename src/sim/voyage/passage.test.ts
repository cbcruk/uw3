import { describe, expect, it } from "vite-plus/test";
import { findPort } from "../../content/ports";
import { haversineNm } from "../geo/geo.utils";
import { DEFAULT_CONFIG, applyAction, createGame, replay } from "../world/world";
import type { GameAction } from "../world/world.types";

const OPEN_SEA = { lat: 33, lon: -13 };

function sailTo(target: { lat: number; lon: number }, legs = 8) {
  const game = createGame();
  applyAction(game, { type: "depart" });
  applyAction(game, { type: "set-destination", target });

  let days = 0;
  let commands = 1;
  for (let leg = 0; leg < legs; leg += 1) {
    const { passage } = applyAction(game, { type: "sail" });
    commands += 1;
    if (passage === null) {
      break;
    }
    days += passage.days;
    if (["arrived", "docked", "ended", "stuck"].includes(passage.stop)) {
      break;
    }
  }
  return { game, days, commands, rangeNm: haversineNm(game.voyage.position, target) };
}

describe("자동 조타", () => {
  /** 이미 아는 바다를 되짚을 때의 선택지. 기본은 수동이다. */
  it("명령 몇 번으로 외해까지 간다", () => {
    const { commands, rangeNm } = sailTo(OPEN_SEA);
    expect(rangeNm).toBeLessThan(40);
    expect(commands).toBeLessThanOrEqual(4);
  });

  /** 곶과 만은 탐욕적 조타로 빠져나올 수 없다. 항해사가 우회로를 잡아야 한다. */
  it("곶을 돌아 카디스까지 간다", () => {
    const cadiz = findPort("cadiz");
    expect(cadiz).toBeDefined();
    const { game } = sailTo(cadiz!.anchorage);
    expect(game.voyage.atPortId).toBe("cadiz");
  });

  it("해협을 통과해 세우타까지 간다", () => {
    const ceuta = findPort("ceuta");
    expect(ceuta).toBeDefined();
    const { rangeNm } = sailTo(ceuta!.anchorage);
    expect(rangeNm).toBeLessThan(40);
  });

  it("자동인데 목적지가 없으면 아무 일도 하지 않는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-steering", mode: "auto" });
    const before = { ...game.voyage.position };
    const { passage } = applyAction(game, { type: "sail" });

    expect(passage).toBeNull();
    expect(game.voyage.position).toEqual(before);
  });

  /** 키를 잡으면 수동이다. 항해사와 매일 침로를 다투게 두지 않는다. */
  it("직접 조타하면 수동으로 돌아가고 목적지가 해제된다", () => {
    const game = createGame();
    applyAction(game, { type: "set-destination", target: OPEN_SEA });
    expect(game.voyage.steering).toBe("auto");
    expect(game.voyage.destination).not.toBeNull();

    applyAction(game, { type: "set-heading", headingDeg: 90 });
    expect(game.voyage.steering).toBe("manual");
    expect(game.voyage.destination).toBeNull();
  });

  it("멈춘 이유를 항해일지에 남긴다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-destination", target: OPEN_SEA });
    const { passage } = applyAction(game, { type: "sail" });

    expect(passage).not.toBeNull();
    expect(game.journal.some((entry) => entry.text === passage?.summary)).toBe(true);
  });

  /** SPEC 8.1: 항해사가 끼어들어도 시드 + 액션 로그는 그대로 재현되어야 한다. */
  it("구간 항해도 결정론적으로 재현된다", () => {
    const script: readonly GameAction[] = [
      { type: "depart" },
      { type: "set-destination", target: OPEN_SEA },
      { type: "sail" },
      { type: "sail" },
    ];
    const first = replay(DEFAULT_CONFIG, script);
    const second = replay(DEFAULT_CONFIG, script);

    expect(second.voyage).toEqual(first.voyage);
    expect(second.journal).toEqual(first.journal);
    expect(second.rng.voyage.getState()).toEqual(first.rng.voyage.getState());
  });
});

describe("수동 조타", () => {
  /**
   * 3편의 조작은 침로 지정이다. 배는 그 방향으로 계속 간다.
   * 줄여야 했던 것은 입력의 빈도지 종류가 아니다 — 침로는 플레이어가 잡는다.
   */
  it("기본 조타는 수동이다", () => {
    const game = createGame();
    expect(game.voyage.steering).toBe("manual");
    expect(game.voyage.destination).toBeNull();
  });

  it("목적지 없이도 지정한 침로로 계속 나아간다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 210 });
    const before = { ...game.voyage.position };

    const { passage } = applyAction(game, { type: "sail" });

    expect(passage).not.toBeNull();
    expect(passage!.days).toBeGreaterThan(1);
    expect(haversineNm(game.voyage.position, before)).toBeGreaterThan(0);
  });

  it("항해 내내 지정한 침로를 유지한다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 210 });
    applyAction(game, { type: "sail" });

    expect(Math.round(game.voyage.headingDeg)).toBe(210);
  });

  /** 해안 우회 판단은 플레이어 몫이다 (SPEC 2 — 알아도 도달하기 어렵다). */
  it("전방에 육지가 오면 멈추고 침로를 다시 묻는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 180 });

    const { passage } = applyAction(game, { type: "sail" });

    expect(passage?.stop).toBe("blocked");
    expect(passage?.summary).toContain("육지");
  });

  it("자동에서 수동으로 되돌리면 목적지가 풀린다", () => {
    const game = createGame();
    applyAction(game, { type: "set-destination", target: OPEN_SEA });
    applyAction(game, { type: "set-steering", mode: "manual" });

    expect(game.voyage.steering).toBe("manual");
    expect(game.voyage.destination).toBeNull();
  });

  /** SPEC 8.1: 조타 모드가 섞여도 시드 + 액션 로그는 그대로 재현되어야 한다. */
  it("두 모드를 섞어도 결정론적으로 재현된다", () => {
    const script: readonly GameAction[] = [
      { type: "depart" },
      { type: "set-heading", headingDeg: 210 },
      { type: "sail" },
      { type: "set-destination", target: OPEN_SEA },
      { type: "sail" },
      { type: "set-heading", headingDeg: 270 },
      { type: "sail" },
    ];
    const first = replay(DEFAULT_CONFIG, script);
    const second = replay(DEFAULT_CONFIG, script);

    expect(second.voyage).toEqual(first.voyage);
    expect(second.journal).toEqual(first.journal);
    expect(second.rng.voyage.getState()).toEqual(first.rng.voyage.getState());
  });
});

describe("정지 사유", () => {
  /** 첫 걸음부터 육지에 막히면 항정도 0이다. 둘 중 구체적인 쪽을 보고해야 한다. */
  it("육지에 코를 박은 채로는 정풍이 아니라 육지를 보고한다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 180 });
    applyAction(game, { type: "sail" });

    const { passage } = applyAction(game, { type: "sail" });

    expect(passage?.days).toBe(1);
    expect(passage?.stop).toBe("blocked");
    expect(passage?.summary).toContain("육지");
  });
});
