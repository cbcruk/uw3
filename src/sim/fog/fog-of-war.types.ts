import type { GridSize, LatLon, MapBounds, TileCoord } from "../geo/geo.types";

export interface ExplorationState {
  size: GridSize;
  revealed: Uint8Array;
  isRevealed(tile: TileCoord): boolean;
  revealAround(bounds: MapBounds, position: LatLon, radiusNm: number): number;
  revealedCount(): number;
}
