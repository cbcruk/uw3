import { describe, expect, it } from 'vite-plus/test'
import { DIRECTIONS } from '../grid/direction'
import type { Cell } from '../grid/world-grid.types'
import { applyCommand, createRun, createWorld, replayRun } from '../run/run'
import type { RunConfig } from '../run/run.types'
import { cellsInSight, isInSight, sightRadiusNm } from './fog'

const grid = createWorld()

const CONFIG: RunConfig = {
  seed: 7,
  startDate: { year: 1502, month: 3, day: 14 },
  startPortId: 'lisboa',
  shipClassId: 'caravela-redonda',
}

function cellAt(lat: number, lon: number): Cell {
  const cell = grid.cellOf({ lat, lon })
  if (cell === null) {
    throw new Error(`outside grid: ${lat}, ${lon}`)
  }
  return cell
}

describe('시야', () => {
  it('반경이 해리라서 고위도에서는 더 많은 칸이 보인다', () => {
    const radius = sightRadiusNm('ship')
    const equator = cellsInSight(grid, cellAt(0, -30), radius).length
    const high = cellsInSight(grid, cellAt(60, -30), radius).length
    expect(high).toBeGreaterThan(equator * 3)
  })

  it('어느 탈것이든 적도에서도 이웃 여덟 칸은 보인다', () => {
    const center = cellAt(0, 20)
    for (const conveyance of ['ship', 'horse', 'camel'] as const) {
      for (const dir of DIRECTIONS) {
        const next = grid.neighbor(center, dir) as Cell
        expect(isInSight(grid, center, conveyance, next)).toBe(true)
      }
    }
  })

  it('배에서 내리면 시야가 좁아진다', () => {
    expect(sightRadiusNm('horse')).toBeLessThan(sightRadiusNm('ship'))
  })

  it('날짜변경선 너머도 이어서 본다', () => {
    const west = cellAt(0, -179.9)
    const east = cellAt(0, 179.9)
    expect(isInSight(grid, west, 'ship', east)).toBe(true)
  })
})

describe('탐사 기록', () => {
  it('출발할 때 리스본 주변만 보이고 대서양 한복판은 모른다', () => {
    const run = createRun(CONFIG, grid)
    expect(run.explored.has(run.player.cell)).toBe(true)
    expect(run.explored.count()).toBeGreaterThan(9)
    expect(run.explored.has(cellAt(38, -30))).toBe(false)
  })

  it('움직이면 늘고, 막힌 걸음은 늘리지 않는다', () => {
    const run = createRun(CONFIG, grid)
    const before = run.explored.count()
    applyCommand(run, { type: 'move', dir: 'ne' })
    expect(run.explored.count()).toBe(before)
    applyCommand(run, { type: 'move', dir: 's' })
    expect(run.explored.count()).toBeGreaterThan(before)
  })

  it('한 번 본 칸은 멀어져도 남는다', () => {
    const run = createRun(CONFIG, grid)
    const start = run.player.cell
    for (let step = 0; step < 15; step += 1) {
      applyCommand(run, { type: 'move', dir: 's' })
    }
    expect(isInSight(grid, run.player.cell, 'ship', start)).toBe(false)
    expect(run.explored.has(start)).toBe(true)
  })

  it('seed와 명령 로그로 같은 탐사 기록이 나온다', () => {
    const run = createRun(CONFIG, grid)
    for (const dir of ['s', 's', 'nw', 's', 'sw'] as const) {
      applyCommand(run, { type: 'move', dir })
    }
    applyCommand(run, { type: 'wait' })
    const again = replayRun(CONFIG, run.commands, grid)
    expect(again.explored.count()).toBe(run.explored.count())
  })
})
