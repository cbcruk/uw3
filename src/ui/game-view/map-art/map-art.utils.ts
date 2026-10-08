import { DIRECTION_DELTA, DIRECTIONS } from "../../../game/grid/direction";
import type { Direction } from "../../../game/grid/direction.types";
import type { Cell, WorldGrid } from "../../../game/grid/world-grid.types";
import type { CoastSides, Facing, TileKey } from "./map-art.types";

const VARIANTS = 4;
const HASH_X = 0x9e3779b1;
const HASH_Y = 0x85ebca77;
const HASH_MIX = 0x2c1b3c6d;
const SHIFT_A = 15;
const SHIFT_B = 12;

/** 칸 좌표에서 무늬 변형을 고른다. 난수 상태 없이 좌표만으로 정해진다. */
export function tileVariant(cell: Cell): number {
  let hash = Math.imul(cell.x, HASH_X) ^ Math.imul(cell.y, HASH_Y);
  hash ^= hash >>> SHIFT_A;
  hash = Math.imul(hash, HASH_MIX);
  hash ^= hash >>> SHIFT_B;
  return (hash >>> 0) % VARIANTS;
}

/** 칸 하나를 그릴 타일 키. 지형이 없는 칸(지도 밖)은 `null`이다. */
export function tileKeyOf(grid: WorldGrid, cell: Cell): TileKey | null {
  const terrain = grid.terrainAt(cell);
  if (terrain === null) {
    return null;
  }
  const isSea = (dir: Direction): boolean => {
    const next = grid.neighbor(cell, dir);
    return next !== null && grid.terrainAt(next) === "sea";
  };
  const coast: CoastSides =
    terrain === "sea"
      ? { n: false, e: false, s: false, w: false }
      : { n: isSea("n"), e: isSea("e"), s: isSea("s"), w: isSea("w") };
  const shallow =
    terrain === "sea" &&
    DIRECTIONS.some((dir) => {
      const next = grid.neighbor(cell, dir);
      const around = next === null ? null : grid.terrainAt(next);
      return around !== null && around !== "sea";
    });
  return { terrain, variant: tileVariant(cell), shallow, coast };
}

export function tileCacheKey(key: TileKey): string {
  const { n, e, s, w } = key.coast;
  const sides = [n, e, s, w].map((side) => (side ? 1 : 0)).join("");
  return `${key.terrain}:${key.variant}:${key.shallow ? 1 : 0}:${sides}`;
}

/** 옆모습 스프라이트의 좌우. 정북·정남은 직전 좌우를 알 수 없어 오른쪽으로 둔다. */
export function facingOf(dir: Direction): Facing {
  return DIRECTION_DELTA[dir].dx < 0 ? "left" : "right";
}

/** 한 칸에서 다른 칸을 향하는 8방위. 같은 칸이면 `null`이다. 경도 순환은 화면 한 장 안이라 무시한다. */
export function directionToward(from: Cell, to: Cell): Direction | null {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  return (
    DIRECTIONS.find((dir) => DIRECTION_DELTA[dir].dx === dx && DIRECTION_DELTA[dir].dy === dy) ??
    null
  );
}
