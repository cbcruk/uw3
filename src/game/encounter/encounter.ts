import { ENCOUNTER_KINDS } from "../../content/game/encounter-kinds";
import { ENCOUNTER_DENSITY } from "../../content/game/encounters.tuning";
import type { EncounterKind } from "../../content/game/game-content.types";
import { GRID } from "../../content/game/grid.tuning";
import { createRng, hashString, mixSeed } from "../../sim/rng/rng";
import type { Rng } from "../../sim/rng/rng.types";
import { DIRECTIONS } from "../grid/direction";
import type { Cell, Terrain, WorldGrid } from "../grid/world-grid.types";
import { regionKey } from "../region/region";
import type { RegionId } from "../region/region.types";
import type { Encounter } from "./encounter.types";

const CELLS_PER_DENSITY_UNIT = 1000;

/**
 * 영역 하나의 조우를 만든다. 영역에 처음 들어갈 때 한 번 부른다 (R4).
 *
 * 난수는 `시드 × 영역`에서만 나온다. 어느 길로 들어왔든, 몇 번째로 들어왔든 같은 영역에는
 * 같은 조우가 놓인다 — 데일리 시드에서 모두가 같은 바다를 만나야 하기 때문이다 (R23).
 * 항구 칸과 그 이웃에는 놓지 않는다.
 */
export function spawnEncounters(grid: WorldGrid, seed: number, region: RegionId): Encounter[] {
  const key = regionKey(region);
  const rng = createRng(mixSeed(seed, hashString(key)));
  const cells = regionCells(grid, region).filter((cell) => !nearPort(grid, cell));
  const taken = new Set<number>();
  const encounters: Encounter[] = [];
  for (const kind of ENCOUNTER_KINDS) {
    const candidates = cells.filter((cell) => fits(kind, grid.terrainAt(cell)));
    const count = stochasticRound(
      (candidates.length * ENCOUNTER_DENSITY[kind.id]) / CELLS_PER_DENSITY_UNIT,
      rng,
    );
    for (const cell of pickDistinct(candidates, count, rng, grid, taken)) {
      encounters.push({
        id: `${kind.id}@${key}#${encounters.length}`,
        kind: kind.id,
        cell,
        crew: rollCrew(kind, rng),
        conveyance: kind.conveyances[0] ?? "horse",
        nextActHours: 0,
        rounds: 0,
        chasing: false,
      });
    }
  }
  return encounters;
}

function regionCells(grid: WorldGrid, region: RegionId): Cell[] {
  const cells: Cell[] = [];
  const x0 = region.rx * GRID.regionCols;
  const y0 = region.ry * GRID.regionRows;
  const rows = Math.min(GRID.regionRows, grid.height - y0);
  for (let y = y0; y < y0 + rows; y += 1) {
    for (let x = x0; x < x0 + GRID.regionCols; x += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

/** 이 종류가 이 지형에 설 수 있는가. 늑대는 사막에 들어가지 않는다. */
export function fits(kind: EncounterKind, terrain: Terrain | null): boolean {
  return terrain !== null && kind.terrains.includes(terrain);
}

/**
 * 항구 칸이거나 그 이웃인가. 조우는 여기 생기지도, 여기로 들어오지도 않는다 (R25) —
 * 입항 직전·출항 직후 한 칸에서 붙잡히면 피할 길이 없다.
 */
export function nearPort(grid: WorldGrid, cell: Cell): boolean {
  if (grid.portAt(cell) !== null) {
    return true;
  }
  return DIRECTIONS.some((dir) => {
    const next = grid.neighbor(cell, dir);
    return next !== null && grid.portAt(next) !== null;
  });
}

/** 기댓값을 정수로. 소수 몫은 확률로 올린다 — 내림이면 작은 바다에는 영영 안 나온다. */
function stochasticRound(expected: number, rng: Rng): number {
  const whole = Math.floor(expected);
  return whole + (rng.chance(expected - whole) ? 1 : 0);
}

function pickDistinct(
  candidates: readonly Cell[],
  count: number,
  rng: Rng,
  grid: WorldGrid,
  taken: Set<number>,
): Cell[] {
  const picked: Cell[] = [];
  const available = candidates.filter((cell) => !taken.has(grid.indexOf(cell)));
  while (picked.length < count && available.length > 0) {
    const [cell] = available.splice(rng.int(0, available.length), 1);
    if (cell !== undefined) {
      taken.add(grid.indexOf(cell));
      picked.push(cell);
    }
  }
  return picked;
}

function rollCrew(kind: EncounterKind, rng: Rng): number {
  return rng.int(kind.crewMin, kind.crewMax + 1);
}
