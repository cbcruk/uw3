import type { LatLon, MapBounds, TileCoord } from "../geo/geo.types";
import { gridSizeOf, isTileInside, latLonToTile, tileCenter, tileIndex } from "../geo/geo.utils";
import type { TileMap } from "./tile-map.types";
import { isPointOnAnyLand } from "./tile-map.utils";

/** 정박지를 중심으로 열어 두는 앞바다 반경 (타일). */
const FAIRWAY_TILE_RADIUS = 1;

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

  /**
   * 정박지 한 칸만 뚫으면 배가 항구에 갇힌다. 타일 한 변이 수십 해리라 리스본처럼
   * 만 안쪽에 있는 항구는 사방이 육지가 되고, 태킹할 여유 폭이 없어 출항 자체가 막힌다.
   * 항구 앞바다(정박지와 이웃한 한 겹)를 함께 열어 출항 항로를 보장한다.
   */
  for (const anchorage of navigableAnchorages) {
    const tile = latLonToTile(bounds, anchorage);
    for (let dy = -FAIRWAY_TILE_RADIUS; dy <= FAIRWAY_TILE_RADIUS; dy += 1) {
      for (let dx = -FAIRWAY_TILE_RADIUS; dx <= FAIRWAY_TILE_RADIUS; dx += 1) {
        const approach = { x: tile.x + dx, y: tile.y + dy };
        if (isTileInside(size, approach)) {
          land[tileIndex(size, approach)] = 0;
        }
      }
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
