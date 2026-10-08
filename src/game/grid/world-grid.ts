import { GRID } from '../../content/game/grid.tuning'
import type { TerrainZone } from '../../content/game/game-content.types'
import type { LatLon } from '../../sim/geo/geo.types'
import { FULL_TURN_DEG, NM_PER_DEGREE, toRadians, wrapLongitude } from '../../sim/geo/geo.utils'
import type { TileMap } from '../../sim/map/tile-map.types'
import { regionKey, regionOf } from '../region/region'
import { DIRECTION_DELTA, isDiagonal } from './direction'
import type { Direction } from './direction.types'
import { latitudeOfMercatorY, mercatorY } from '../../sim/geo/mercator.utils'
import type { Cell, LandTerrain, Terrain, WorldGrid } from './world-grid.types'

/** 경도의 서쪽 끝. 정의다. */
const WEST_EDGE_LON = -180

const TERRAIN_CODES: readonly Terrain[] = ['sea', 'grassland', 'desert']

export interface WorldGridOptions {
  /** 시뮬의 충돌 판정 마스크(1/16°). 게임 격자는 여기서 파생한다 (R2). */
  landMap: TileMap
  zones: readonly TerrainZone[]
  anchorages: readonly { id: string; anchorage: LatLon }[]
}

/**
 * 메르카토르 세계 격자를 만든다.
 *
 * 열은 경도 등간격, 행은 메르카토르 y 등간격이다 — 그래서 모든 칸이 지상에서
 * 정사각형이고 8방향이 곧 진방위다 (SPEC-roguelike R1). 칸의 지형은 그 칸이 속한
 * 영역을 처음 물을 때 굽는다 (R4).
 */
export function createWorldGrid(options: WorldGridOptions): WorldGrid {
  const { landMap, zones, anchorages } = options
  const cellDeg = GRID.cellDeg
  const cellRad = toRadians(cellDeg)
  const topY = mercatorY(GRID.maxLat)
  const width = Math.round(FULL_TURN_DEG / cellDeg)
  const height = Math.round((2 * topY) / cellRad)

  const wrapX = (x: number): number => ((x % width) + width) % width
  const isInside = (cell: Cell): boolean => cell.y >= 0 && cell.y < height
  const indexOf = (cell: Cell): number => cell.y * width + wrapX(cell.x)

  const latOfRow = (y: number): number => latitudeOfMercatorY(topY - y * cellRad)
  const cellCenter = (cell: Cell): LatLon => ({
    lat: latOfRow(cell.y + 1 / 2),
    lon: WEST_EDGE_LON + (wrapX(cell.x) + 1 / 2) * cellDeg,
  })
  const cellOf = (position: LatLon): Cell | null => {
    const y = Math.floor((topY - mercatorY(position.lat)) / cellRad)
    if (y < 0 || y >= height) {
      return null
    }
    const x = Math.floor((wrapLongitude(position.lon) - WEST_EDGE_LON) / cellDeg)
    return { x: wrapX(x), y }
  }

  /** 정박지 칸은 바다다. 시뮬이 정박지 앞바다를 여는 것(W5)과 같은 이유다. */
  const forcedSea = new Set<number>()
  const portByIndex = new Map<number, string>()
  const cellByPort = new Map<string, Cell>()
  for (const { id, anchorage } of anchorages) {
    const cell = cellOf(anchorage)
    if (cell !== null) {
      forcedSea.add(indexOf(cell))
      portByIndex.set(indexOf(cell), id)
      cellByPort.set(id, cell)
    }
  }

  const landTerrainAt = (position: LatLon): LandTerrain => {
    const zone = zones.find(
      (z) =>
        position.lat >= z.minLat &&
        position.lat < z.maxLat &&
        position.lon >= z.minLon &&
        position.lon < z.maxLon,
    )
    return zone?.terrain ?? 'grassland'
  }

  const classify = (cell: Cell): Terrain => {
    if (forcedSea.has(indexOf(cell))) {
      return 'sea'
    }
    const samples = GRID.samplesPerAxis
    const westLon = WEST_EDGE_LON + wrapX(cell.x) * cellDeg
    let seaCount = 0
    for (let sy = 0; sy < samples; sy += 1) {
      const lat = latOfRow(cell.y + (sy + 1 / 2) / samples)
      for (let sx = 0; sx < samples; sx += 1) {
        const lon = westLon + ((sx + 1 / 2) / samples) * cellDeg
        if (landMap.isNavigable({ lat, lon })) {
          seaCount += 1
        }
      }
    }
    if (seaCount / (samples * samples) >= GRID.seaFractionMin) {
      return 'sea'
    }
    return landTerrainAt(cellCenter(cell))
  }

  const terrain = new Uint8Array(width * height)
  const baked = new Set<string>()

  const bakeRegionOf = (cell: Cell): void => {
    const region = regionOf({ x: wrapX(cell.x), y: cell.y })
    const key = regionKey(region)
    if (baked.has(key)) {
      return
    }
    baked.add(key)
    const x0 = region.rx * GRID.regionCols
    const y0 = region.ry * GRID.regionRows
    const y1 = Math.min(height, y0 + GRID.regionRows)
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x0 + GRID.regionCols; x += 1) {
        terrain[y * width + x] = TERRAIN_CODES.indexOf(classify({ x, y }))
      }
    }
  }

  const terrainAt = (cell: Cell): Terrain | null => {
    if (!isInside(cell)) {
      return null
    }
    bakeRegionOf(cell)
    return TERRAIN_CODES[terrain[indexOf(cell)] ?? 0] ?? 'sea'
  }

  const neighbor = (cell: Cell, dir: Direction): Cell | null => {
    const { dx, dy } = DIRECTION_DELTA[dir]
    const next = { x: wrapX(cell.x + dx), y: cell.y + dy }
    return isInside(next) ? next : null
  }

  return {
    width,
    height,
    cellDeg,
    terrainAt,
    portAt: (cell) => (isInside(cell) ? (portByIndex.get(indexOf(cell)) ?? null) : null),
    cellOfPort: (portId) => cellByPort.get(portId) ?? null,
    cellCenter,
    indexOf,
    cellOf,
    neighbor,
    stepNm(from: Cell, dir: Direction): number {
      const to = neighbor(from, dir) ?? from
      const midLat = (cellCenter(from).lat + cellCenter(to).lat) / 2
      const sideNm = cellDeg * NM_PER_DEGREE * Math.cos(toRadians(midLat))
      return isDiagonal(dir) ? sideNm * Math.SQRT2 : sideNm
    },
    bakedRegionCount: () => baked.size,
  }
}
