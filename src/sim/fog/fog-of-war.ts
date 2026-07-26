import type { GridSize, LatLon, MapBounds, TileCoord } from "../geo/geo.types";
import { haversineNm, isTileInside, latLonToTile, tileCenter } from "../geo/geo.utils";
import type { ExplorationState } from "./fog-of-war.types";

export function createExplorationState(
  size: GridSize,
  revealed = new Uint8Array(Math.ceil((size.width * size.height) / 8)),
): ExplorationState {
  const bitAt = (tile: TileCoord): { byte: number; mask: number } => {
    const index = tile.y * size.width + tile.x;
    return { byte: index >> 3, mask: 1 << (index & 7) };
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
      const tileSpanNm = bounds.tileSize * 60;
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
