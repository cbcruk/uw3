import type { LatLon, MapBounds, TileCoord } from "../geo/geo.types";
import { gridSizeOf, isTileInside, latLonToTile, tileCenter, tileIndex } from "../geo/geo.utils";
import type { TileMap } from "./tile-map.types";
import { isPointOnAnyLand } from "./tile-map.utils";

export interface TileMapOptions {
  bounds: MapBounds;
  landmasses: readonly (readonly LatLon[])[];
  navigableAnchorages?: readonly LatLon[];
}

export function createTileMap(options: TileMapOptions): TileMap {
  const { bounds, landmasses, navigableAnchorages = [] } = options;
  const size = gridSizeOf(bounds);
  const land = new Uint8Array(size.width * size.height);

  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      const center = tileCenter(bounds, { x, y });
      if (isPointOnAnyLand(center, landmasses)) {
        land[tileIndex(size, { x, y })] = 1;
      }
    }
  }

  for (const anchorage of navigableAnchorages) {
    const tile = latLonToTile(bounds, anchorage);
    if (isTileInside(size, tile)) {
      land[tileIndex(size, tile)] = 0;
    }
  }

  const isLandTile = (tile: TileCoord): boolean => {
    if (!isTileInside(size, tile)) {
      return true;
    }
    return land[tileIndex(size, tile)] === 1;
  };

  return {
    bounds,
    size,
    land,
    isLandTile,
    isNavigable(position: LatLon): boolean {
      return !isLandTile(latLonToTile(bounds, position));
    },
  };
}
