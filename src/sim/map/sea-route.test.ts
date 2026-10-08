import { describe, expect, it } from 'vite-plus/test'
import { PORT_ANCHORAGES, findPort } from '../../content/ports'
import { LAND_POLYGONS } from '../../content/world-land'
import type { TileCoord } from '../geo/geo.types'
import { latLonToTile, tileCenter } from '../geo/geo.utils'
import { ROUTE_CELLS_PER_DEGREE } from './land-mask.const'
import { createTileMap } from './tile-map'
import { findSeaRoute } from './sea-route'

const tileMap = createTileMap({
  polygons: LAND_POLYGONS,
  cellsPerDegree: ROUTE_CELLS_PER_DEGREE,
  navigableAnchorages: PORT_ANCHORAGES,
})

/**
 * 바다에 접한 육지 타일. 해안선 데이터가 바뀌어도 테스트가 따라간다.
 *
 * 출발지에서 가까운 순으로 찾는다. 격자 처음부터 훑으면 북극 해안이 잡히고,
 * 스냅 하나 확인하자고 A*가 대서양을 가로지른다 (4초).
 */
function findCoastalLandTile(origin: TileCoord): TileCoord {
  const maxRadius = Math.max(tileMap.size.width, tileMap.size.height)
  for (let radius = 1; radius < maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
          continue
        }
        const tile = { x: origin.x + dx, y: origin.y + dy }
        if (tile.x < 1 || tile.y < 1) {
          continue
        }
        if (tile.x >= tileMap.size.width - 1 || tile.y >= tileMap.size.height - 1) {
          continue
        }
        if (!tileMap.isLandTile(tile)) {
          continue
        }
        if (
          !tileMap.isLandTile({ x: tile.x - 1, y: tile.y }) ||
          !tileMap.isLandTile({ x: tile.x, y: tile.y - 1 })
        ) {
          return tile
        }
      }
    }
  }
  throw new Error('coastal land tile not found')
}

describe('findSeaRoute', () => {
  it('경로 전체가 바다 위에 있다', () => {
    const lisboa = findPort('lisboa')
    const ceuta = findPort('ceuta')
    expect(lisboa).toBeDefined()
    expect(ceuta).toBeDefined()

    const route = findSeaRoute(tileMap, lisboa!.anchorage, ceuta!.anchorage)

    expect(route).not.toBeNull()
    expect(route!.length).toBeGreaterThan(1)
    for (const point of route!) {
      expect(tileMap.isNavigable(point)).toBe(true)
    }
  })

  /** 해안을 살짝 벗어난 클릭까지 버리면 조작이 까다로워진다. 가까운 바다로 당긴다. */
  it('해안가 뭍을 찍으면 가까운 바다로 당긴다', () => {
    const lisboa = findPort('lisboa')
    const origin = latLonToTile(tileMap.bounds, lisboa!.anchorage)
    const shore = tileCenter(tileMap.bounds, findCoastalLandTile(origin))
    expect(tileMap.isNavigable(shore)).toBe(false)

    const route = findSeaRoute(tileMap, lisboa!.anchorage, shore)

    expect(route).not.toBeNull()
    expect(tileMap.isNavigable(route![route!.length - 1] as { lat: number; lon: number })).toBe(
      true,
    )
  })

  /** 내륙 깊은 곳은 당길 바다가 없다. 조용히 아무 데나 보내는 것보다 거절이 낫다. */
  it('내륙 깊은 곳으로는 경로가 없다', () => {
    const lisboa = findPort('lisboa')
    const sahara = { lat: 22, lon: 12 }

    expect(findSeaRoute(tileMap, lisboa!.anchorage, sahara)).toBeNull()
  })

  it('같은 입력에는 같은 경로를 낸다', () => {
    const lisboa = findPort('lisboa')
    const from = lisboa!.anchorage
    const to = { lat: 33, lon: -13 }

    expect(findSeaRoute(tileMap, from, to)).toEqual(findSeaRoute(tileMap, from, to))
  })
})
