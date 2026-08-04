import type { GridSize, LatLon, MapBounds, TileCoord } from "../geo/geo.types";
import {
  NM_PER_DEGREE,
  haversineNm,
  isTileInside,
  latLonToTile,
  tileCenter,
} from "../geo/geo.utils";
import type { ExplorationState } from "./fog-of-war.types";

/** 탐사 여부는 타일당 1비트다. 격자가 수백만 칸이라 바이트로 두면 메모리가 8배다. */
const BITS_PER_BYTE = 8;
/** index >> 3 = index / 8 (바이트 번호), index & 7 = 바이트 안의 비트 자리. */
const BYTE_SHIFT = 3;
const BIT_MASK = 7;

export function createExplorationState(
  size: GridSize,
  revealed = new Uint8Array(Math.ceil((size.width * size.height) / BITS_PER_BYTE)),
): ExplorationState {
  const bitAt = (tile: TileCoord): { byte: number; mask: number } => {
    const index = tile.y * size.width + tile.x;
    return { byte: index >> BYTE_SHIFT, mask: 1 << (index & BIT_MASK) };
  };

  const isRevealed = (tile: TileCoord): boolean => {
    if (!isTileInside(size, tile)) {
      return false;
    }
    const { byte, mask } = bitAt(tile);
    return ((revealed[byte] as number) & mask) !== 0;
  };

  return {
    size,
    revealed,
    isRevealed,
    revealAround(bounds: MapBounds, position: LatLon, radiusNm: number): number {
      const center = latLonToTile(bounds, position);
      const tileSpanNm = bounds.tileSize * NM_PER_DEGREE;
      const span = Math.ceil(radiusNm / tileSpanNm) + 1;
      let newlyRevealed = 0;

      for (let dy = -span; dy <= span; dy += 1) {
        for (let dx = -span; dx <= span; dx += 1) {
          const tile = { x: center.x + dx, y: center.y + dy };
          if (!isTileInside(size, tile) || isRevealed(tile)) {
            continue;
          }
          if (haversineNm(position, tileCenter(bounds, tile)) > radiusNm) {
            continue;
          }
          const { byte, mask } = bitAt(tile);
          revealed[byte] = (revealed[byte] as number) | mask;
          newlyRevealed += 1;
        }
      }
      return newlyRevealed;
    },
    revealedCount(): number {
      let count = 0;
      for (const byte of revealed) {
        let bits = byte;
        while (bits > 0) {
          count += bits & 1;
          bits >>= 1;
        }
      }
      return count;
    },
  };
}
