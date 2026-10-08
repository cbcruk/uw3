import { GRID } from '../../content/game/grid.tuning'
import type { Cell } from '../grid/world-grid.types'
import type { RegionId } from './region.types'

export function regionOf(cell: Cell): RegionId {
  return {
    rx: Math.floor(cell.x / GRID.regionCols),
    ry: Math.floor(cell.y / GRID.regionRows),
  }
}

export function regionKey(region: RegionId): string {
  return `${region.rx},${region.ry}`
}

export function sameRegion(a: RegionId, b: RegionId): boolean {
  return a.rx === b.rx && a.ry === b.ry
}
