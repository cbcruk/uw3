import { SIGHT } from "../../content/game/sight.tuning";
import type { Cell, WorldGrid } from "../grid/world-grid.types";
import type { Conveyance } from "../travel/travel.types";
import type { ExploredMap } from "./fog.types";

export function sightRadiusNm(conveyance: Conveyance): number {
  return conveyance === "ship" ? SIGHT.shipSightNm : SIGHT.landSightNm;
}

/**
 * 시야 안의 칸. 반경은 해리이고, 칸 수로는 위도마다 다르게 나온다 (R3).
 *
 * 가림을 계산하지 않는다. 바다에는 가릴 것이 없고, 뭍에는 아직 고도 자료가 없다.
 * 메르카토르는 등각이라 가까운 범위에서는 칸 거리 × 칸 한 변으로 충분하다.
 */
export function cellsInSight(grid: WorldGrid, center: Cell, radiusNm: number): Cell[] {
  const sideNm = grid.stepNm(center, "e");
  const radius = radiusNm / sideNm;
  const reach = Math.ceil(radius);
  const cells: Cell[] = [];
  for (let dy = -reach; dy <= reach; dy += 1) {
    const y = center.y + dy;
    if (y < 0 || y >= grid.height) {
      continue;
    }
    for (let dx = -reach; dx <= reach; dx += 1) {
      if (Math.hypot(dx, dy) <= radius) {
        cells.push({ x: (((center.x + dx) % grid.width) + grid.width) % grid.width, y });
      }
    }
  }
  return cells;
}

export function isInSight(
  grid: WorldGrid,
  viewer: Cell,
  conveyance: Conveyance,
  target: Cell,
): boolean {
  return isWithinNm(grid, viewer, target, sightRadiusNm(conveyance));
}

/** 두 칸이 그 해리 안에 있는가. 칸 크기는 보는 쪽 위도에서 잰다. */
export function isWithinNm(grid: WorldGrid, viewer: Cell, target: Cell, radiusNm: number): boolean {
  const radius = radiusNm / grid.stepNm(viewer, "e");
  const rawDx = Math.abs(target.x - viewer.x);
  const dx = Math.min(rawDx, grid.width - rawDx);
  return Math.hypot(dx, target.y - viewer.y) <= radius;
}

export function createExploredMap(grid: WorldGrid): ExploredMap {
  const seen = new Uint8Array(grid.width * grid.height);
  let total = 0;
  return {
    has: (cell) => seen[grid.indexOf(cell)] === 1,
    reveal(cells: readonly Cell[]): number {
      let fresh = 0;
      for (const cell of cells) {
        const index = grid.indexOf(cell);
        if (seen[index] !== 1) {
          seen[index] = 1;
          fresh += 1;
        }
      }
      total += fresh;
      return fresh;
    },
    count: () => total,
  };
}
