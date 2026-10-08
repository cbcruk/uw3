import { describe, expect, it } from 'vite-plus/test'
import { GRID } from '../../content/game/grid.tuning'
import { PORTS } from '../../content/ports'
import { haversineNm } from '../../sim/geo/geo.utils'
import { createWorld } from '../run/run'
import { DIRECTIONS } from './direction'
import type { Cell, WorldGrid } from './world-grid.types'

const grid = createWorld()

function cellAt(lat: number, lon: number): Cell {
  const cell = grid.cellOf({ lat, lon })
  if (cell === null) {
    throw new Error(`outside grid: ${lat}, ${lon}`)
  }
  return cell
}

/** 바다 칸만 밟아 a에서 b로 갈 수 있는가. 해협이 열려 있는지를 본다. */
function seaConnected(world: WorldGrid, a: Cell, b: Cell, limit = 40_000): boolean {
  const key = (c: Cell): string => `${c.x},${c.y}`
  const seen = new Set([key(a)])
  const queue = [a]
  for (let head = 0; head < queue.length && seen.size < limit; head += 1) {
    const cell = queue[head] as Cell
    if (cell.x === b.x && cell.y === b.y) {
      return true
    }
    for (const dir of DIRECTIONS) {
      const next = world.neighbor(cell, dir)
      if (next !== null && !seen.has(key(next)) && world.terrainAt(next) === 'sea') {
        seen.add(key(next))
        queue.push(next)
      }
    }
  }
  return false
}

describe('메르카토르 세계 격자', () => {
  it('영역이 경도 한 바퀴를 나누어떨어지게 자른다', () => {
    expect(grid.width % GRID.regionCols).toBe(0)
  })

  it('고위도에서도 칸이 지상에서 정사각형이다 — 8방향이 진방위가 되는 근거', () => {
    for (const lat of [0, 40, 60, 70]) {
      const cell = cellAt(lat, 10)
      const center = grid.cellCenter(cell)
      const east = grid.cellCenter({ x: cell.x + 1, y: cell.y })
      const north = grid.cellCenter({ x: cell.x, y: cell.y - 1 })
      const ratio = haversineNm(center, north) / haversineNm(center, east)
      expect(ratio).toBeCloseTo(1, 1)
    }
  })

  it('이동 비용은 해리다 — 고위도의 한 칸은 짧다', () => {
    const equator = grid.stepNm(cellAt(0, 10), 'e')
    const high = grid.stepNm(cellAt(60, 10), 'e')
    expect(high / equator).toBeCloseTo(0.5, 1)
    expect(grid.stepNm(cellAt(0, 10), 'ne') / equator).toBeCloseTo(Math.SQRT2, 3)
  })

  it('극 쪽 격자 밖은 지형이 없다', () => {
    expect(grid.cellOf({ lat: 80, lon: 0 })).toBeNull()
    expect(grid.terrainAt({ x: 0, y: -1 })).toBeNull()
    expect(grid.neighbor({ x: 0, y: 0 }, 'n')).toBeNull()
  })

  it('경도는 날짜변경선을 넘어 이어진다', () => {
    const west = cellAt(0, -179.9)
    expect(grid.neighbor(west, 'w')).toEqual(cellAt(0, 179.9))
  })

  it('지형은 실제 해안선과 구역 표에서 나온다', () => {
    expect(grid.terrainAt(cellAt(38, -30))).toBe('sea')
    expect(grid.terrainAt(cellAt(40, -4))).toBe('grassland')
    expect(grid.terrainAt(cellAt(24, 10))).toBe('desert')
  })

  it('영역은 처음 물을 때 굽는다', () => {
    const fresh = createWorld()
    expect(fresh.bakedRegionCount()).toBe(0)
    fresh.terrainAt(cellAt(38, -9))
    expect(fresh.bakedRegionCount()).toBe(1)
  })

  // 칸 폭(0.25°)이 시뮬 마스크(1/16°)보다 성기다. 칸 폭을 키우면 여기가 먼저 깨진다.
  it.each([
    ['지브롤터', [36.0, -7.5], [36.3, -3.5]],
    ['도버', [50.0, -1.0], [52.5, 2.5]],
    ['호르무즈', [26.0, 54.0], [25.0, 58.0]],
    ['말라카', [6.0, 97.0], [1.5, 104.5]],
    ['마젤란', [-52.5, -75.0], [-52.5, -67.5]],
  ] as const)('%s 해협이 열려 있다', (_name, a, b) => {
    expect(seaConnected(grid, cellAt(a[0], a[1]), cellAt(b[0], b[1]))).toBe(true)
  })

  it.each(PORTS.map((port) => [port.name, port.id] as const))(
    '%s 정박지는 바다 칸이고 내릴 뭍이 붙어 있다',
    (_name, portId) => {
      const cell = grid.cellOfPort(portId)
      expect(cell).not.toBeNull()
      expect(grid.terrainAt(cell as Cell)).toBe('sea')
      expect(grid.portAt(cell as Cell)).toBe(portId)
      const land = DIRECTIONS.map((dir) => grid.neighbor(cell as Cell, dir)).filter(
        (next) => next !== null && grid.terrainAt(next) !== 'sea',
      )
      expect(land.length).toBeGreaterThan(0)
    },
  )
})
