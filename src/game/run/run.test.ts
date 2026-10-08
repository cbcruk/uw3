import { describe, expect, it } from "vite-plus/test";
import { MOUNT } from "../../content/game/mounts.tuning";
import { findShipClass } from "../../content/ships";
import { toDayNumber } from "../../sim/calendar/calendar";
import type { ShipClass } from "../../sim/ship/ship.types";
import { regionKey } from "../region/region";
import { DIRECTIONS } from "../grid/direction";
import { dailyRangeNm, passageToward } from "../travel/travel";
import { applyCommand, createRun, createWorld, currentDay, rangeTowardNm, replayRun } from "./run";
import type { Command, RunConfig, RunEvent } from "./run.types";

const grid = createWorld();

const CONFIG: RunConfig = {
  seed: 7,
  startDate: { year: 1502, month: 3, day: 14 },
  startPortId: "lisboa",
  shipClassId: "caravela-redonda",
};

function eventsOf<T extends RunEvent["type"]>(
  events: readonly RunEvent[],
  type: T,
): Extract<RunEvent, { type: T }>[] {
  return events.filter((e): e is Extract<RunEvent, { type: T }> => e.type === type);
}

describe("배의 하루 행정 — 시뮬의 바람과 돛을 그대로 쓴다", () => {
  const shipClass = findShipClass(CONFIG.shipClassId) as ShipClass;
  const dayNumber = toDayNumber(CONFIG.startDate);

  it("편서풍대에서 서쪽은 태킹이라 동쪽보다 훨씬 느리다", () => {
    const position = { lat: 40, lon: -30 };
    const passage = (dir: "w" | "e") =>
      passageToward({ conveyance: "ship", terrain: "sea", position, dayNumber, dir, shipClass });
    expect(passage("w").tacking).toBe(true);
    expect(passage("e").tacking).toBe(false);
    expect(passage("w").rangeNm).toBeGreaterThan(0);
    expect(passage("w").rangeNm).toBeLessThan(passage("e").rangeNm / 2);
  });

  it("바람이 있으면 바다에서 막힌 방향이 없다 — 폭 1칸 수로에서도 갇히지 않는다", () => {
    const position = { lat: 38.7, lon: -9.4 };
    for (const dir of DIRECTIONS) {
      const range = dailyRangeNm({
        conveyance: "ship",
        terrain: "sea",
        position,
        dayNumber,
        dir,
        shipClass,
      });
      expect(range).toBeGreaterThan(0);
    }
  });

  it("라틴돛이 사각돛보다 역풍에 강하다", () => {
    const latina = findShipClass("caravela-latina") as ShipClass;
    const base = {
      conveyance: "ship" as const,
      terrain: "sea" as const,
      position: { lat: 40, lon: -30 },
      dayNumber,
      dir: "w" as const,
    };
    expect(dailyRangeNm({ ...base, shipClass: latina })).toBeGreaterThan(
      dailyRangeNm({ ...base, shipClass }),
    );
  });

  it("무역풍대에서는 서쪽이 빠르다", () => {
    const position = { lat: 18, lon: -35 };
    const west = dailyRangeNm({
      conveyance: "ship",
      terrain: "sea",
      position,
      dayNumber,
      dir: "w",
      shipClass,
    });
    expect(west).toBeGreaterThan(MOUNT.horseGrassland);
  });

  it("배는 뭍으로, 말은 바다로 못 간다", () => {
    const base = { position: { lat: 40, lon: -4 }, dayNumber, dir: "e" as const, shipClass };
    expect(dailyRangeNm({ ...base, conveyance: "ship", terrain: "grassland" })).toBe(0);
    expect(dailyRangeNm({ ...base, conveyance: "horse", terrain: "sea" })).toBe(0);
  });
});

describe("런 — 방향키 한 번이 한 칸", () => {
  it("리스본에 정박한 배로 시작한다", () => {
    const run = createRun(CONFIG, grid);
    expect(run.player.conveyance).toBe("ship");
    expect(grid.portAt(run.player.cell)).toBe("lisboa");
  });

  it("한 번에 정확히 한 칸 가고, 그 칸을 지나는 시간만큼 흐른다", () => {
    const run = createRun(CONFIG, grid);
    const start = run.player.cell;
    const events = applyCommand(run, { type: "move", dir: "s" });
    const moves = eventsOf(events, "move");
    expect(moves).toHaveLength(1);
    expect(run.player.cell).toEqual({ x: start.x, y: start.y + 1 });
    const expected = (grid.stepNm(start, "s") / rangeTowardNm(createRun(CONFIG, grid), "s")) * 24;
    expect(run.elapsedHours).toBeCloseTo(expected, 9);
    expect(moves[0]?.hours).toBeCloseTo(expected, 9);
  });

  it("뱃머리는 움직인 방향을 향하고, 막히거나 기다려도 그대로다", () => {
    const run = createRun(CONFIG, grid);
    expect(eventsOf(applyCommand(run, { type: "move", dir: "ne" }), "blocked")).toHaveLength(1);
    expect(run.player.facing).toBe("w");
    applyCommand(run, { type: "move", dir: "s" });
    expect(run.player.facing).toBe("s");
    applyCommand(run, { type: "wait" });
    expect(run.player.facing).toBe("s");
    applyCommand(run, { type: "move", dir: "sw" });
    expect(run.player.facing).toBe("sw");
  });

  it("배로 뭍을 향하면 막히고 시간이 흐르지 않는다", () => {
    const run = createRun(CONFIG, grid);
    const start = run.player.cell;
    const events = applyCommand(run, { type: "move", dir: "ne" });
    expect(eventsOf(events, "blocked")[0]?.reason).toBe("terrain");
    expect(run.player.cell).toEqual(start);
    expect(run.elapsedHours).toBe(0);
    expect(run.commands).toHaveLength(0);
  });

  it("3월 리스본에서 서쪽은 막히지 않지만 남쪽보다 두 배 가까이 걸린다", () => {
    const west = eventsOf(
      applyCommand(createRun(CONFIG, grid), { type: "move", dir: "w" }),
      "move",
    );
    const south = eventsOf(
      applyCommand(createRun(CONFIG, grid), { type: "move", dir: "s" }),
      "move",
    );
    expect(west).toHaveLength(1);
    expect(west[0]?.hours).toBeGreaterThan((south[0]?.hours ?? 0) * 1.5);
  });

  it("기다리면 다음 날로 넘어간다", () => {
    const run = createRun(CONFIG, grid);
    applyCommand(run, { type: "move", dir: "s" });
    const events = applyCommand(run, { type: "wait" });
    expect(currentDay(run)).toBe(1);
    expect(run.elapsedHours).toBe(24);
    expect(eventsOf(events, "day-start")[0]?.day).toBe(1);
  });

  it("배는 한 칸에 몇 시간, 말은 반나절 가까이 걸린다", () => {
    const run = createRun(CONFIG, grid);
    const sailHours = eventsOf(applyCommand(run, { type: "move", dir: "s" }), "move")[0]?.hours;
    applyCommand(run, { type: "move", dir: "n" });
    applyCommand(run, { type: "disembark", mount: "horse" });
    const rideHours = eventsOf(applyCommand(run, { type: "move", dir: "e" }), "move")[0]?.hours;
    expect(sailHours).toBeLessThan(4);
    expect(rideHours).toBeGreaterThan(8);
  });

  it("바다에서는 내릴 수 없다", () => {
    const run = createRun(CONFIG, grid);
    applyCommand(run, { type: "move", dir: "s" });
    const events = applyCommand(run, { type: "disembark", mount: "horse" });
    expect(eventsOf(events, "rejected")).toHaveLength(1);
    expect(run.commands).toHaveLength(1);
  });

  it("항구에서 말로 내려 뭍을 가고, 배를 둔 항구로 돌아와 다시 오른다", () => {
    const run = createRun(CONFIG, grid);
    const port = run.player.cell;
    applyCommand(run, { type: "disembark", mount: "horse" });
    expect(run.player.conveyance).toBe("horse");
    expect(grid.terrainAt(run.player.cell)).toBe("grassland");
    expect(run.berth?.portId).toBe("lisboa");

    const ashore = run.player.cell;
    applyCommand(run, { type: "move", dir: "e" });
    applyCommand(run, { type: "move", dir: "e" });
    expect(eventsOf(applyCommand(run, { type: "embark" }), "rejected")).toHaveLength(1);

    applyCommand(run, { type: "move", dir: "w" });
    applyCommand(run, { type: "move", dir: "w" });
    expect(run.player.cell).toEqual(ashore);
    expect(eventsOf(applyCommand(run, { type: "embark" }), "embark")[0]?.portId).toBe("lisboa");
    expect(run.player.cell).toEqual(port);
    expect(run.berth).toBeNull();
  });

  it("말은 바다로 못 간다", () => {
    const run = createRun(CONFIG, grid);
    applyCommand(run, { type: "disembark", mount: "horse" });
    const ashore = run.player.cell;
    const toSea = (["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const).find((dir) => {
      const next = grid.neighbor(ashore, dir);
      return next !== null && grid.terrainAt(next) === "sea";
    });
    expect(toSea).toBeDefined();
    const events = applyCommand(run, { type: "move", dir: toSea ?? "w" });
    expect(eventsOf(events, "blocked")[0]?.reason).toBe("terrain");
  });

  it("영역 경계를 넘으면 새 층에 들어선다", () => {
    const run = createRun(CONFIG, grid);
    const start = regionKey(run.region);
    const entered: RunEvent[] = [];
    for (let step = 0; step < 60 && entered.length === 0; step += 1) {
      entered.push(...eventsOf(applyCommand(run, { type: "move", dir: "s" }), "region"));
    }
    expect(entered).toHaveLength(1);
    expect(regionKey(run.region)).not.toBe(start);
    expect(run.visitedRegions.size).toBe(2);
  });

  it("seed와 명령 로그로 같은 런이 다시 나온다", () => {
    const commands: Command[] = [
      { type: "move", dir: "s" },
      { type: "move", dir: "s" },
      { type: "wait" },
      { type: "move", dir: "w" },
      { type: "move", dir: "sw" },
      { type: "move", dir: "s" },
    ];
    const run = createRun(CONFIG, grid);
    for (const command of commands) {
      applyCommand(run, command);
    }
    const again = replayRun(CONFIG, run.commands, grid);
    expect(again.player).toEqual(run.player);
    expect(again.elapsedHours).toBe(run.elapsedHours);
    expect(again.visitedRegions).toEqual(run.visitedRegions);
  });
});
