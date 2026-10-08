import type { GridSize, LatLon, MapBounds, TileCoord } from '../geo/geo.types'
import type { LandPolygon } from './land-mask.types'

export interface TileMapOptions {
  polygons: readonly LandPolygon[]
  /** 1도당 타일 수. 해상도 근거는 land-mask.const.ts. */
  cellsPerDegree: number
  navigableAnchorages?: readonly LatLon[]
}

export interface TileMap {
  bounds: MapBounds
  size: GridSize
  /** 셀당 1비트. 직접 읽지 말고 isLandTile을 쓴다. */
  land: Uint32Array
  isLandTile(tile: TileCoord): boolean
  isNavigable(position: LatLon): boolean
}
