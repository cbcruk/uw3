import { describe, expect, it } from 'vite-plus/test'
import { findShipClass } from '../../content/ships'
import { toDayNumber } from '../../sim/calendar/calendar'
import type { ShipClass } from '../../sim/ship/ship.types'
import type { Cell } from '../grid/world-grid.types'
import { applyCommand, createRun, createWorld, replayRun } from '../run/run'
import type { RunConfig, RunEvent, RunState } from '../run/run.types'
import { crossDriftNm, currentAlongKnots, currentKnots, idleDriftNm, resolveDrift } from './drift'
import { passageToward } from './travel'

const grid = createWorld()

const CONFIG: RunConfig = {
  seed: 7,
  startDate: { year: 1502, month: 3, day: 14 },
  startPortId: 'lisboa',
  shipClassId: 'caravela-redonda',
}

const GULF_STREAM = { lat: 33, lon: -70 }

function cellAt(lat: number, lon: number): Cell {
  const cell = grid.cellOf({ lat, lon })
  if (cell === null) {
    throw new Error(`outside grid: ${lat}, ${lon}`)
  }
  return cell
}

/** 리스본에서 출발한 런을 바다 한복판으로 옮긴다. 해류 테스트에 항해 경로는 상관없다. */
function runAtSea(lat: number, lon: number): RunState {
  const run = createRun(CONFIG, grid)
  run.player.cell = cellAt(lat, lon)
  return run
}

function drifts(events: readonly RunEvent[]): number {
  return events.filter((e) => e.type === 'drift').length
}

describe('해류 — 나란한 몫은 속력, 수직인 몫은 편류', () => {
  it('수직인 몫만 옆으로 쌓는다', () => {
    const pushed = crossDriftNm({ east: 1, north: 0 }, 'n', 10)
    expect(pushed.east).toBeCloseTo(10, 9)
    expect(pushed.north).toBeCloseTo(0, 9)
    expect(crossDriftNm({ east: 0, north: 1 }, 'n', 10).north).toBeCloseTo(0, 9)
  })

  it('만류를 타면 빨라지고 거스르면 느려진다', () => {
    const shipClass = findShipClass(CONFIG.shipClassId) as ShipClass
    const dayNumber = toDayNumber(CONFIG.startDate)
    const base = { conveyance: 'ship' as const, terrain: 'sea' as const, dayNumber, shipClass }
    const along = (dir: 'ne' | 'sw') => currentAlongKnots(currentKnots(GULF_STREAM), dir) * 24

    const withStream = passageToward({ ...base, position: GULF_STREAM, dir: 'ne' })
    const against = passageToward({ ...base, position: GULF_STREAM, dir: 'sw' })
    expect(along('ne')).toBeGreaterThan(40)
    expect(withStream.rangeNm - withStream.sailRangeNm).toBeCloseTo(along('ne'), 6)
    expect(against.rangeNm).toBeLessThan(against.sailRangeNm)
  })

  it('만류 위에서 하루 기다리면 북동으로 여러 칸 떠밀린다', () => {
    const run = runAtSea(GULF_STREAM.lat, GULF_STREAM.lon)
    const start = run.player.cell
    const events = applyCommand(run, { type: 'wait' })
    expect(drifts(events)).toBeGreaterThanOrEqual(4)
    expect(run.player.cell.x).toBeGreaterThan(start.x)
    expect(run.player.cell.y).toBeLessThan(start.y)
  })

  it('정박 중에는 밀리지 않는다', () => {
    const run = createRun(CONFIG, grid)
    const start = run.player.cell
    const events = applyCommand(run, { type: 'wait' })
    expect(drifts(events)).toBe(0)
    expect(run.player.cell).toEqual(start)
    expect(run.player.driftNm).toEqual({ east: 0, north: 0 })
  })

  it('뭍 쪽으로는 밀려 들어가지 않고 해안에 붙는다', () => {
    const lisbon = grid.cellOfPort('lisboa') as Cell
    const north = grid.neighbor(lisbon, 'n') as Cell
    expect(grid.terrainAt(north)).not.toBe('sea')
    const side = grid.stepNm(lisbon, 'e')
    const result = resolveDrift(grid, lisbon, { east: 0, north: side })
    expect(result.cell).toEqual(lisbon)
    expect(result.offsetNm.north).toBe(0)
  })

  it('칸 안 위치는 칸 한 변의 절반 안에 남는다', () => {
    const start = cellAt(GULF_STREAM.lat, GULF_STREAM.lon)
    const result = resolveDrift(grid, start, idleDriftNm(currentKnots(GULF_STREAM), 24))
    const half = grid.stepNm(result.cell, 'e') / 2
    expect(Math.abs(result.offsetNm.east)).toBeLessThanOrEqual(half)
    expect(Math.abs(result.offsetNm.north)).toBeLessThanOrEqual(half)
  })

  it('seed와 명령 로그로 같은 편류가 나온다', () => {
    const run = createRun(CONFIG, grid)
    for (const dir of ['s', 's', 's', 'w', 's', 's'] as const) {
      applyCommand(run, { type: 'move', dir })
    }
    applyCommand(run, { type: 'wait' })
    applyCommand(run, { type: 'wait' })
    const again = replayRun(CONFIG, run.commands, grid)
    expect(again.player).toEqual(run.player)
    expect(again.elapsedHours).toBe(run.elapsedHours)
  })
})
