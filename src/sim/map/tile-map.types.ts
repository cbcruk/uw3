import type { GridSize, LatLon, MapBounds, TileCoord } from "../geo/geo.types";

export interface TileMap {
  bounds: MapBounds;
  size: GridSize;
  land: Uint8Array;
  isLandTile(tile: TileCoord): boolean;
  isNavigable(position: LatLon): boolean;
}
