import type { LatLon, TileCoord } from "../geo/geo.types";
import { gridSizeOf, isTileInside, latLonToTile, tileIndex } from "../geo/geo.utils";
import { bakeLandMask } from "./land-mask";
import type { LandPolygon } from "./land-mask.types";
import type { TileMap, TileMapOptions } from "./tile-map.types";

/** 정박지를 중심으로 열어 두는 앞바다 반경 (타일). */
const FAIRWAY_TILE_RADIUS = 1;

/**
 * 전 지구 타일 맵. 실제 해안선(Natural Earth 1:50m)을 래스터로 구워 만든다.
 *
 * 타일 격자와 육지 마스크는 같은 것이다 — 경계가 지구 전체이고 타일 한 변이
 * 1/cellsPerDegree일 때 `latLonToTile`의 행·열이 마스크의 셀 인덱스와 정확히 일치한다.
 */
export function createTileMap(options: TileMapOptions): TileMap {
  const { polygons, cellsPerDegree, navigableAnchorages = [] } = options;

  const bounds = {
    minLat: -90,
    maxLat: 90,
    minLon: -180,
    maxLon: 180,
    tileSize: 1 / cellsPerDegree,
  };
  const size = gridSizeOf(bounds);
  const { mask } = bakeLandMask(polygons as readonly LandPolygon[], cellsPerDegree);

  const readBit = (index: number): boolean =>
    (((mask[index >>> 5] ?? 0) >>> (index & 31)) & 1) === 1;
  const clearBit = (index: number): void => {
    mask[index >>> 5] = ((mask[index >>> 5] ?? 0) & ~(1 << (index & 31))) >>> 0;
  };

  /**
   * 정박지 한 칸만 뚫으면 배가 항구에 갇힌다. 항구 앞바다를 함께 열어 출항 항로를 보장한다.
   * 실제 해안선을 써도 하구·만 안쪽 항구는 여전히 격자에서 막힐 수 있다.
   */
  for (const anchorage of navigableAnchorages) {
    const tile = latLonToTile(bounds, anchorage);
    for (let dy = -FAIRWAY_TILE_RADIUS; dy <= FAIRWAY_TILE_RADIUS; dy += 1) {
      for (let dx = -FAIRWAY_TILE_RADIUS; dx <= FAIRWAY_TILE_RADIUS; dx += 1) {
        const approach = { x: tile.x + dx, y: tile.y + dy };
        if (isTileInside(size, approach)) {
          clearBit(tileIndex(size, approach));
        }
      }
    }
  }

  const isLandTile = (tile: TileCoord): boolean => {
    if (tile.y < 0 || tile.y >= size.height) {
      return true;
    }
    // 경도는 순환한다. 날짜변경선을 넘어도 이어져야 한다.
    const x = ((tile.x % size.width) + size.width) % size.width;
    return readBit(tileIndex(size, { x, y: tile.y }));
  };

  return {
    bounds,
    size,
    land: mask,
    isLandTile,
    isNavigable(position: LatLon): boolean {
      return !isLandTile(latLonToTile(bounds, position));
    },
  };
}
