import type { LatLon, TileCoord } from "../geo/geo.types";
import { latLonToTile, tileCenter, tileIndex } from "../geo/geo.utils";
import type { TileMap } from "./tile-map.types";

/** 8방향 이웃. 대각 이동 비용은 √2. */
const NEIGHBOURS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const DIAGONAL_COST = Math.SQRT2;
/** 클릭 지점이 뭍이면 이만큼 반경 안에서 가장 가까운 바다를 찾는다. */
const SNAP_RADIUS_TILES = 6;

function octile(from: TileCoord, to: TileCoord): number {
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  return Math.max(dx, dy) + (DIAGONAL_COST - 1) * Math.min(dx, dy);
}

/** 뭍을 찍었을 때 가장 가까운 항해 가능 타일로 당긴다. 클릭이 무반응이면 안 된다. */
function snapToSea(tileMap: TileMap, tile: TileCoord): TileCoord | null {
  if (!tileMap.isLandTile(tile)) {
    return tile;
  }
  for (let radius = 1; radius <= SNAP_RADIUS_TILES; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
          continue;
        }
        const candidate = { x: tile.x + dx, y: tile.y + dy };
        if (!tileMap.isLandTile(candidate)) {
          return candidate;
        }
      }
    }
  }
  return null;
}

/**
 * 바다만 밟는 최단 경로. 곶과 만은 탐욕적 조타로 빠져나올 수 없다 —
 * 알가르베 해안처럼 오목한 지형에서는 목적지에 다가서는 침로가 전부 육지로 막힌다.
 * 항해사에게 우회로를 미리 쥐여준다.
 *
 * A*는 타일 격자 위에서 결정론적이다 (SPEC 8.1).
 */
export function findSeaRoute(tileMap: TileMap, from: LatLon, to: LatLon): LatLon[] | null {
  const { bounds, size } = tileMap;
  const start = snapToSea(tileMap, latLonToTile(bounds, from));
  const goal = snapToSea(tileMap, latLonToTile(bounds, to));
  if (start === null || goal === null) {
    return null;
  }

  const cellCount = size.width * size.height;
  const cameFrom = new Int32Array(cellCount).fill(-1);
  const gScore = new Float64Array(cellCount).fill(Infinity);
  const closed = new Uint8Array(cellCount);

  const startIndex = tileIndex(size, start);
  const goalIndex = tileIndex(size, goal);
  gScore[startIndex] = 0;

  // 격자가 작아 (수만 칸) 정렬 삽입 큐로 충분하다. 비용순 오름차순 유지.
  const open: { index: number; tile: TileCoord; f: number }[] = [
    { index: startIndex, tile: start, f: octile(start, goal) },
  ];

  while (open.length > 0) {
    const current = open.shift();
    if (current === undefined) {
      break;
    }
    if (current.index === goalIndex) {
      const path: LatLon[] = [];
      let cursor = current.index;
      while (cursor !== -1) {
        const x = cursor % size.width;
        const y = (cursor - x) / size.width;
        path.push(tileCenter(bounds, { x, y }));
        cursor = cameFrom[cursor] ?? -1;
      }
      return path.reverse();
    }
    if (closed[current.index] === 1) {
      continue;
    }
    closed[current.index] = 1;

    for (const [dx, dy] of NEIGHBOURS) {
      const next = { x: current.tile.x + dx, y: current.tile.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= size.width || next.y >= size.height) {
        continue;
      }
      if (tileMap.isLandTile(next)) {
        continue;
      }
      const nextIndex = tileIndex(size, next);
      if (closed[nextIndex] === 1) {
        continue;
      }
      const step = dx !== 0 && dy !== 0 ? DIAGONAL_COST : 1;
      const tentative = (gScore[current.index] ?? Infinity) + step;
      if (tentative >= (gScore[nextIndex] ?? Infinity)) {
        continue;
      }

      gScore[nextIndex] = tentative;
      cameFrom[nextIndex] = current.index;
      const entry = { index: nextIndex, tile: next, f: tentative + octile(next, goal) };
      let low = 0;
      let high = open.length;
      while (low < high) {
        const mid = (low + high) >> 1;
        if ((open[mid] as { f: number }).f < entry.f) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      open.splice(low, 0, entry);
    }
  }

  return null;
}
