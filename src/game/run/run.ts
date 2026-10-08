import { findPort, PORTS, PORT_ANCHORAGES } from "../../content/ports";
import { findShipClass } from "../../content/ships";
import { TERRAIN_ZONES } from "../../content/game/terrain-zones";
import { LAND_POLYGONS } from "../../content/world-land";
import { HOURS_PER_DAY, toDayNumber } from "../../sim/calendar/calendar";
import { WORLD_LAND_CELLS_PER_DEGREE } from "../../sim/map/land-mask.const";
import { createTileMap } from "../../sim/map/tile-map";
import { cellsInSight, createExploredMap, sightRadiusNm } from "../fog/fog";
import { DIRECTIONS } from "../grid/direction";
import { createWorldGrid } from "../grid/world-grid";
import type { Cell, WorldGrid } from "../grid/world-grid.types";
import { regionKey, regionOf, sameRegion } from "../region/region";
import { canEnter, passageToward } from "../travel/travel";
import {
  NO_DRIFT,
  addDrift,
  crossDriftNm,
  currentKnots,
  idleDriftNm,
  resolveDrift,
} from "../travel/drift";
import type { EastNorth } from "../travel/drift.types";
import type { Mount, Passage } from "../travel/travel.types";
import type { Direction } from "../grid/direction.types";
import type { Command, RunConfig, RunEvent, RunState } from "./run.types";

const PLAYER_ID = "player";

/** 출발할 때의 뱃머리. 리스본 정박지는 대서양을 향해 열려 있다. */
const INITIAL_FACING: Direction = "w";

/** 시뮬 해안선에서 게임 격자를 만든다. 무겁지 않지만 런마다 새로 만들 이유도 없다. */
export function createWorld(): WorldGrid {
  const landMap = createTileMap({
    polygons: LAND_POLYGONS,
    cellsPerDegree: WORLD_LAND_CELLS_PER_DEGREE,
    navigableAnchorages: PORT_ANCHORAGES,
  });
  return createWorldGrid({
    landMap,
    zones: TERRAIN_ZONES,
    anchorages: PORTS.map((port) => ({ id: port.id, anchorage: port.anchorage })),
  });
}

export function createRun(config: RunConfig, grid: WorldGrid = createWorld()): RunState {
  const shipClass = findShipClass(config.shipClassId);
  if (shipClass === undefined) {
    throw new Error(`unknown ship class: ${config.shipClassId}`);
  }
  const cell = grid.cellOfPort(config.startPortId);
  if (findPort(config.startPortId) === undefined || cell === null) {
    throw new Error(`unknown port: ${config.startPortId}`);
  }
  const region = regionOf(cell);
  const run: RunState = {
    config,
    grid,
    shipClass,
    elapsedHours: 0,
    player: {
      id: PLAYER_ID,
      cell,
      conveyance: "ship",
      facing: INITIAL_FACING,
      driftNm: NO_DRIFT,
    },
    berth: null,
    region,
    explored: createExploredMap(grid),
    visitedRegions: new Set([regionKey(region)]),
    commands: [],
  };
  lookAround(run);
  return run;
}

/**
 * 명령 하나를 처리한다. 상태를 제자리에서 바꾸고 이벤트를 돌려준다.
 *
 * 거절되거나 막힌 명령은 시간을 쓰지 않고 로그에도 남지 않는다 — 원본에서 벽에
 * 부딪힌 걸음이 턴을 쓰지 않는 것과 같다. 입력 실수로 날을 잃게 하지 않는다.
 */
export function applyCommand(run: RunState, command: Command): RunEvent[] {
  const events: RunEvent[] = [];
  const dayBefore = currentDay(run);
  const accepted = resolveCommand(run, command, events);
  if (!accepted) {
    return events;
  }
  run.commands.push(command);
  lookAround(run);
  const dayAfter = currentDay(run);
  if (dayAfter > dayBefore) {
    events.push({ type: "day-start", day: dayAfter });
  }
  return events;
}

/** `seed + 명령 로그`에서 런을 다시 만든다 (R8). */
export function replayRun(
  config: RunConfig,
  commands: readonly Command[],
  grid?: WorldGrid,
): RunState {
  const run = createRun(config, grid);
  for (const command of commands) {
    applyCommand(run, command);
  }
  return run;
}

/** 출발 후 며칠째인가. 0부터 센다. */
export function currentDay(run: RunState): number {
  return Math.floor(run.elapsedHours / HOURS_PER_DAY);
}

export function dayNumberOf(run: RunState): number {
  return toDayNumber(run.config.startDate) + currentDay(run);
}

/** 지금 자리에서 그 방향으로 하루에 얼마나 나아가는가. 화면의 나침반도 이것을 쓴다. */
export function passageFrom(run: RunState, dir: Direction): Passage {
  const terrain = run.grid.terrainAt(run.player.cell);
  if (terrain === null) {
    return { rangeNm: 0, sailRangeNm: 0, tacking: false };
  }
  return passageToward({
    conveyance: run.player.conveyance,
    terrain,
    position: run.grid.cellCenter(run.player.cell),
    dayNumber: dayNumberOf(run),
    dir,
    shipClass: run.shipClass,
  });
}

export function rangeTowardNm(run: RunState, dir: Direction): number {
  return passageFrom(run, dir).rangeNm;
}

/** 지금 자리에서 보이는 칸을 탐사 기록에 더한다. 하선하면 시야가 좁아진다. */
function lookAround(run: RunState): void {
  const { grid, player } = run;
  run.explored.reveal(cellsInSight(grid, player.cell, sightRadiusNm(player.conveyance)));
}

function resolveCommand(run: RunState, command: Command, events: RunEvent[]): boolean {
  switch (command.type) {
    case "move":
      return move(run, command.dir, events);
    case "wait": {
      // 다음 날 첫 시각까지 쉰다. 바람은 날마다 바뀌므로 하루를 넘겨야 기다린 의미가 있다.
      const hours = (currentDay(run) + 1) * HOURS_PER_DAY - run.elapsedHours;
      run.elapsedHours += hours;
      if (isAdrift(run)) {
        const current = currentKnots(run.grid.cellCenter(run.player.cell));
        drift(run, idleDriftNm(current, hours), events);
      }
      return true;
    }
    case "disembark":
      return disembark(run, command.mount, events);
    case "embark":
      return embark(run, events);
  }
}

function move(run: RunState, dir: Direction, events: RunEvent[]): boolean {
  const { grid, player } = run;
  const next = grid.neighbor(player.cell, dir);
  const terrain = next === null ? null : grid.terrainAt(next);
  if (next === null || terrain === null) {
    events.push({ type: "blocked", actorId: player.id, at: player.cell, reason: "edge" });
    return false;
  }
  if (!canEnter(player.conveyance, terrain)) {
    events.push({ type: "blocked", actorId: player.id, at: player.cell, reason: "terrain" });
    return false;
  }
  const passage = passageFrom(run, dir);
  if (passage.rangeNm <= 0) {
    const reason = passage.sailRangeNm <= 0 ? "wind" : "current";
    events.push({ type: "blocked", actorId: player.id, at: player.cell, reason });
    return false;
  }

  const hours = (grid.stepNm(player.cell, dir) / passage.rangeNm) * HOURS_PER_DAY;
  const current = player.conveyance === "ship" ? currentKnots(grid.cellCenter(player.cell)) : null;
  const from = player.cell;
  run.elapsedHours += hours;
  player.facing = dir;
  events.push({ type: "move", actorId: player.id, from, to: next, hours });
  enterCell(run, next, events);
  if (current !== null && isAdrift(run)) {
    drift(run, crossDriftNm(current, dir, hours), events);
  }
  return true;
}

/**
 * 배가 해류에 밀리는 상태인가. 정박 중에는 밀리지 않는다 — 시뮬과 같은 규칙이다 (SPEC 6.2).
 */
function isAdrift(run: RunState): boolean {
  return run.player.conveyance === "ship" && run.grid.portAt(run.player.cell) === null;
}

/** 칸 안 위치에 편류를 더하고, 경계를 넘으면 옆 칸으로 민다 (R15). */
function drift(run: RunState, offsetNm: EastNorth, events: RunEvent[]): void {
  const { player, grid } = run;
  const result = resolveDrift(grid, player.cell, addDrift(player.driftNm, offsetNm));
  player.driftNm = result.offsetNm;
  for (const cell of result.pushedThrough) {
    events.push({ type: "drift", actorId: player.id, from: player.cell, to: cell });
    enterCell(run, cell, events);
    if (!isAdrift(run)) {
      break;
    }
  }
}

/** 칸에 들어선다. 영역이 바뀌면 새 층이고, 배가 항구 칸에 닿으면 정박한다. */
function enterCell(run: RunState, next: Cell, events: RunEvent[]): void {
  const { grid, player } = run;
  player.cell = next;
  const region = regionOf(next);
  if (!sameRegion(region, run.region)) {
    run.region = region;
    run.visitedRegions.add(regionKey(region));
    events.push({ type: "region", region });
  }
  const portId = player.conveyance === "ship" ? grid.portAt(next) : null;
  if (portId !== null) {
    player.driftNm = NO_DRIFT;
    events.push({ type: "dock", portId });
  }
}

function disembark(run: RunState, mount: Mount, events: RunEvent[]): boolean {
  const { grid, player } = run;
  const portId = grid.portAt(player.cell);
  if (player.conveyance !== "ship" || portId === null) {
    events.push({
      type: "rejected",
      command: "disembark",
      reason: "항구에 정박한 배에서만 내릴 수 있다",
    });
    return false;
  }
  const landing = landNeighbor(grid, player.cell);
  if (landing === null) {
    events.push({
      type: "rejected",
      command: "disembark",
      reason: "이 항구에는 내릴 뭍이 붙어 있지 않다",
    });
    return false;
  }
  run.berth = { portId, cell: player.cell };
  player.driftNm = NO_DRIFT;
  player.cell = landing;
  player.conveyance = mount;
  events.push({ type: "disembark", mount, portId });
  return true;
}

function embark(run: RunState, events: RunEvent[]): boolean {
  const { grid, player, berth } = run;
  if (player.conveyance === "ship" || berth === null) {
    events.push({
      type: "rejected",
      command: "embark",
      reason: "뭍에 있을 때만 배에 오를 수 있다",
    });
    return false;
  }
  if (!DIRECTIONS.some((dir) => sameCell(grid.neighbor(player.cell, dir), berth.cell))) {
    events.push({
      type: "rejected",
      command: "embark",
      reason: "배를 둔 항구 바로 옆에서만 오를 수 있다",
    });
    return false;
  }
  player.cell = berth.cell;
  player.conveyance = "ship";
  player.driftNm = NO_DRIFT;
  run.berth = null;
  events.push({ type: "embark", portId: berth.portId });
  return true;
}

/** 하선할 뭍 칸. 방향 순서가 고정이라 같은 항구에서는 늘 같은 칸에 내린다 (R8). */
function landNeighbor(grid: WorldGrid, cell: Cell): Cell | null {
  for (const dir of DIRECTIONS) {
    const next = grid.neighbor(cell, dir);
    const terrain = next === null ? null : grid.terrainAt(next);
    if (next !== null && terrain !== null && terrain !== "sea") {
      return next;
    }
  }
  return null;
}

function sameCell(a: Cell | null, b: Cell): boolean {
  return a !== null && a.x === b.x && a.y === b.y;
}
