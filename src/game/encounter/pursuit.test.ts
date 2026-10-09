import { describe, expect, it } from 'vite-plus/test'
import { findShipClass } from '../../content/ships'
import type { ShipClass } from '../../sim/ship/ship.types'
import type { Cell } from '../grid/world-grid.types'
import { createWorld } from '../run/run'
import type { Conveyance } from '../travel/travel.types'
import type { Encounter } from './encounter.types'
import { COMBAT } from '../../content/game/combat.tuning'
import { actEncounters, adjacent, cellDistance } from './pursuit'
import type { PursuitContext } from './pursuit.types'

const grid = createWorld()
const shipClass = findShipClass('caravela-redonda') as ShipClass
const DAY_ONE = 200_000
const ATLANTIC = grid.cellOf({ lat: 30, lon: -40 }) as Cell

function at(dx: number, dy: number): Cell {
  return { x: ATLANTIC.x + dx, y: ATLANTIC.y + dy }
}

function pirate(cell: Cell, id = 'pirate-a'): Encounter {
  return {
    id,
    kind: 'pirate',
    cell,
    crew: 30,
    crewAtStart: 30,
    conveyance: 'ship',
    nextActHours: 0,
    rounds: 0,
    chasing: false,
  }
}

function context(
  hours: number,
  target: { cell: Cell; conveyance: Conveyance; crew?: number } = {
    cell: ATLANTIC,
    conveyance: 'ship',
  },
  startHours = 0,
): PursuitContext {
  return {
    grid,
    target,
    startHours,
    nowHours: hours,
    dayNumberAt: (h) => DAY_ONE + Math.floor(h / 24),
    fallbackShip: shipClass,
  }
}

describe('추격 — 다음 행동 시각 순으로 한 칸씩 다가온다', () => {
  it('보이는 해적은 다가오고, 다가온 만큼 시간이 밀린다', () => {
    const encounter = pirate(at(3, 0))
    const events = actEncounters(context(6), [encounter])
    expect(events[0]).toEqual({ type: 'chase', encounterId: 'pirate-a', kind: 'pirate' })
    expect(cellDistance(grid, encounter.cell, ATLANTIC)).toBeLessThan(3)
    expect(encounter.nextActHours).toBeGreaterThan(0)
    expect(encounter.chasing).toBe(true)
  })

  it('바로 옆에 붙으면 멈추고 한 번 알린다', () => {
    const encounter = pirate(at(3, 0))
    const events = actEncounters(context(24 * 5), [encounter])
    expect(adjacent(grid, encounter.cell, ATLANTIC)).toBe(true)
    expect(events.filter((e) => e.type === 'engaged')).toHaveLength(1)
    expect(actEncounters(context(24 * 6, undefined, 24 * 5), [encounter])).toEqual([])
  })

  it('알아채는 거리는 시야보다 짧다 — 먼저 본 쪽이 피할 수 있다', () => {
    const unnoticed = pirate(at(6, 0))
    expect(actEncounters(context(6), [unnoticed])).toEqual([])
    const chasing = { ...pirate(at(6, 0)), chasing: true }
    actEncounters(context(6), [chasing])
    expect(cellDistance(grid, chasing.cell, ATLANTIC)).toBeLessThan(6)
  })

  it('시야 밖의 조우는 움직이지 않는다', () => {
    const encounter = pirate(at(40, 0))
    expect(actEncounters(context(24 * 3), [encounter])).toEqual([])
    expect(encounter.cell).toEqual(at(40, 0))
  })

  it('쫓던 조우가 시야를 잃으면 따돌린 것이다', () => {
    const encounter = { ...pirate(at(5, 0)), chasing: true }
    const far = { cell: at(-40, 0), conveyance: 'ship' as const }
    const events = actEncounters(context(1, far), [encounter])
    expect(events).toEqual([{ type: 'evaded', encounterId: 'pirate-a', kind: 'pirate' }])
    expect(encounter.chasing).toBe(false)
  })

  it('두 조우는 한 칸에 겹치지 않는다', () => {
    const a = pirate(at(3, 0), 'pirate-a')
    const b = pirate(at(3, 1), 'pirate-b')
    actEncounters(context(24 * 5), [a, b])
    expect(a.cell).not.toEqual(b.cell)
    expect(adjacent(grid, a.cell, ATLANTIC)).toBe(true)
    expect(adjacent(grid, b.cell, ATLANTIC)).toBe(true)
  })

  it('같은 입력이면 같은 움직임이다', () => {
    const run = () => {
      const encounters = [pirate(at(6, 2), 'pirate-a'), pirate(at(-5, -3), 'pirate-b')]
      return { events: actEncounters(context(30), encounters), encounters }
    }
    expect(run()).toEqual(run())
  })

  it('쫓지 않던 조우는 명령이 시작된 시각부터 깨어난다 — 지난 시간을 몰아서 따라잡지 않는다', () => {
    const encounter = pirate(at(3, 0))
    actEncounters(context(1000 + 1, undefined, 1000), [encounter])
    expect(cellDistance(grid, encounter.cell, ATLANTIC)).toBeGreaterThanOrEqual(2)
  })
})

describe('우세 — 사람 무리는 머릿수가 앞설 때만 쫓는다 (R80)', () => {
  /** 해적 30명(픽스처)이 겨우 우세한 무리와, 겨우 못 미치는 무리의 머릿수. */
  const outnumbered = Math.floor(30 / COMBAT.chaseOdds)
  const target = (crew?: number) => ({ cell: ATLANTIC, conveyance: 'ship' as const, crew })

  it('우세하지 않으면 보여도 쫓지 않고, 우세하면 쫓는다. 머릿수를 모르면 모두 쫓는다', () => {
    expect(actEncounters(context(6, target(outnumbered + 1)), [pirate(at(3, 0))])).toEqual([])
    const chase = (crew?: number) =>
      actEncounters(context(6, target(crew)), [pirate(at(3, 0))]).filter((e) => e.type === 'chase')
    expect(chase(outnumbered)).toHaveLength(1)
    expect(chase(undefined)).toHaveLength(1)
  })

  it('쫓던 무리는 우세가 깨지면 보이는 채로 그만둔다 — 따돌린 것이 아니다', () => {
    const encounter = { ...pirate(at(3, 0)), chasing: true }
    const events = actEncounters(context(6, target(outnumbered + 1)), [encounter])
    expect(events).toEqual([{ type: 'gave-up', encounterId: 'pirate-a', kind: 'pirate' }])
    expect(encounter.chasing).toBe(false)
  })

  it('짐승과 이미 맞붙은 무리는 머릿수를 따지지 않는다', () => {
    const beast = { ...pirate(at(3, 0)), kind: 'beast' as const, crew: 1 }
    const fought = { ...pirate(at(3, 0), 'pirate-b'), crew: 1, rounds: 1 }
    const chased = (encounter: Encounter) =>
      actEncounters(context(6, target(1000)), [encounter]).some((e) => e.type === 'chase')
    expect(chased(beast)).toBe(true)
    expect(chased(fought)).toBe(true)
  })
})
