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

describe("구간 항해", () => {
  /**
   * 하루 단위 조타는 40일 항해에 40번의 입력을 요구했다. 결정 단위는 하루가 아니라
   * 구간이다 (SPEC 5 — 헤매기는 UX 문제).
   */
  it("명령 몇 번으로 외해까지 간다", () => {
    const { commands, rangeNm } = sailTo(OPEN_SEA);
    expect(rangeNm).toBeLessThan(40);
    expect(commands).toBeLessThanOrEqual(4);
  });

  /** 곶과 만은 탐욕적 조타로 빠져나올 수 없다. 항해사가 우회로를 잡아야 한다. */
  it("곶을 돌아 카디스까지 간다", () => {
    const cadiz = findPort("cadiz");
    expect(cadiz).toBeDefined();
    const { game } = sailTo({ lat: cadiz!.lat, lon: cadiz!.lon });
    expect(game.voyage.atPortId).toBe("cadiz");
  });

  it("해협을 통과해 세우타까지 간다", () => {
    const ceuta = findPort("ceuta");
    expect(ceuta).toBeDefined();
    const { rangeNm } = sailTo({ lat: ceuta!.lat, lon: ceuta!.lon });
    expect(rangeNm).toBeLessThan(40);
  });

  it("목적지가 없으면 항해 명령이 아무 일도 하지 않는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    const before = { ...game.voyage.position };
    const { passage } = applyAction(game, { type: "sail" });

    expect(passage).toBeNull();
    expect(game.voyage.position).toEqual(before);
  });

  /** 손으로 침로를 잡으면 항해사와 매일 다투게 된다. 목적지를 놓는 쪽이 맞다. */
  it("직접 조타하면 목적지가 해제된다", () => {
    const game = createGame();
    applyAction(game, { type: "set-destination", target: OPEN_SEA });
    expect(game.voyage.destination).not.toBeNull();

    applyAction(game, { type: "set-heading", headingDeg: 90 });
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
