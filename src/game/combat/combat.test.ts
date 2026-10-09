import { describe, expect, it } from 'vite-plus/test'
import { findShipClass } from '../../content/ships'
import { COMBAT } from '../../content/game/combat.tuning'
import type { ShipClass } from '../../sim/ship/ship.types'
import type { Encounter } from '../encounter/encounter.types'
import { createSupplies } from '../supplies/supplies'
import { fightRound } from './combat'
import type { CombatEvent } from './combat.types'

const shipClass = findShipClass('caravela-redonda') as ShipClass

function foe(kind: Encounter['kind'], crew: number): Encounter {
  return {
    id: `${kind}-x`,
    kind,
    cell: { x: 0, y: 0 },
    crew,
    crewAtStart: crew,
    conveyance: kind === 'pirate' ? 'ship' : 'horse',
    nextActHours: 0,
    rounds: 0,
    chasing: true,
  }
}

function rounds(
  kind: Encounter['kind'],
  crew: number,
  conveyance: 'ship' | 'horse',
  count: number,
) {
  const supplies = createSupplies(shipClass)
  const enemy = foe(kind, crew)
  for (let i = 0; i < count && enemy.crew > 0 && supplies.crew > 0; i += 1) {
    fightRound({ seed: 7, supplies, conveyance, foe: enemy, initiated: false })
  }
  return { supplies, enemy }
}

/** 시드 1..`seeds`마다 새 무리끼리 붙여 `play`의 결과를 모은다. */
function trials<T>(seeds: number, play: (seed: number) => T): T[] {
  return Array.from({ length: seeds }, (_, i) => play(i + 1))
}

describe('한 합 — 머릿수가 곧 공격력이다', () => {
  it('양쪽이 동시에 잃고, 몇 번째 합인지 센다', () => {
    const supplies = createSupplies(shipClass)
    const enemy = foe('bandit', 30)
    const [round] = fightRound({
      seed: 7,
      supplies,
      conveyance: 'horse',
      foe: enemy,
      initiated: true,
    })
    expect(round).toMatchObject({ type: 'combat', initiated: true, hullLost: 0 })
    expect(enemy.rounds).toBe(1)
    expect(supplies.crew + (round?.type === 'combat' ? round.crewLost : 0)).toBe(32)
  })

  it('해적만 배의 선체를 깎는다. 뭍에서는 선체가 그대로다', () => {
    const hullLost = (kind: Encounter['kind'], conveyance: 'ship' | 'horse') =>
      trials(20, (seed) => {
        const supplies = createSupplies(shipClass)
        const enemy = { ...foe(kind, 40), id: `${kind}-${seed}` }
        fightRound({ seed, supplies, conveyance, foe: enemy, initiated: false })
        return shipClass.hullPoints - supplies.hull
      }).reduce((sum, lost) => sum + lost, 0)
    expect(hullLost('pirate', 'ship')).toBeGreaterThan(0)
    expect(hullLost('bandit', 'horse')).toBe(0)
    expect(hullLost('pirate', 'horse')).toBe(0)
  })

  it('작은 무리는 무너지고, 큰 해적에게는 원정 쪽이 무너진다', () => {
    expect(rounds('beast', 6, 'horse', 50).enemy.crew).toBe(0)
    const outcomes = trials(50, (seed) => {
      const supplies = createSupplies(shipClass)
      const enemy = { ...foe('pirate', 200), id: `pirate-${seed}` }
      const events: CombatEvent[] = []
      while (enemy.crew > 0 && supplies.crew > 0) {
        events.push(
          ...fightRound({ seed, supplies, conveyance: 'ship', foe: enemy, initiated: false }),
        )
      }
      return events.some((e) => e.type === 'broken' && e.atSea)
    })
    expect(outcomes.filter(Boolean).length).toBeGreaterThan(25)
  })

  it('같은 시드·조우·합 번호면 같은 결과다', () => {
    expect(rounds('pirate', 40, 'ship', 3)).toEqual(rounds('pirate', 40, 'ship', 3))
  })

  it('쓰러뜨리면 defeated를 함께 낸다', () => {
    const supplies = createSupplies(shipClass)
    const enemy = foe('beast', 1)
    let events = fightRound({
      seed: 1,
      supplies,
      conveyance: 'horse',
      foe: enemy,
      initiated: true,
    })
    for (let i = 0; i < 20 && enemy.crew > 0; i += 1) {
      events = fightRound({ seed: 1, supplies, conveyance: 'horse', foe: enemy, initiated: true })
    }
    expect(events.at(-1)).toEqual({ type: 'defeated', encounterId: 'beast-x', kind: 'beast' })
  })
})

describe('무너짐 — 약탈대는 일찍, 원정 쪽은 늦게 무너진다 (R76)', () => {
  it('들이받힌 도적은 무너져 routed를 내고 격자에서 빠진다', () => {
    const supplies = createSupplies(shipClass)
    const enemy = foe('bandit', 20)
    let routed = false
    for (let i = 0; i < 30 && enemy.crew > 0; i += 1) {
      const events = fightRound({
        seed: 3,
        supplies,
        conveyance: 'horse',
        foe: enemy,
        initiated: true,
      })
      routed ||= events.some((e) => e.type === 'routed')
    }
    expect(routed).toBe(true)
    expect(enemy.crew).toBe(0)
  })
})

describe('전면 폭 — 배끼리는 한 번에 붙는 인원이 묶인다', () => {
  function losses(conveyance: 'ship' | 'horse', kind: Encounter['kind'], foeCrew: number) {
    let lost = 0
    for (let seed = 1; seed <= 100; seed += 1) {
      const supplies = { ...createSupplies(shipClass), crew: 48 }
      const enemy = { ...foe(kind, foeCrew), id: `${kind}-${seed}`, conveyance }
      for (let round = 0; round < 3; round += 1) {
        fightRound({ seed, supplies, conveyance, foe: enemy, initiated: false })
      }
      lost += 48 - supplies.crew
    }
    return lost / 100
  }

  it('Centurion호(1591) — 48명이 150명의 승선 공격을 세 합 받아도 몇 명만 잃는다', () => {
    expect(losses('ship', 'pirate', 150)).toBeLessThan(8)
  })

  it('상한보다 적으면 전원이 싸운다 — 작은 해적과의 손실은 상한 전과 같다', () => {
    const small = COMBAT.boardingFrontage - 2
    const supplies = { ...createSupplies(shipClass), crew: small }
    const enemy = foe('pirate', small)
    const [round] = fightRound({
      seed: 3,
      supplies,
      conveyance: 'ship',
      foe: enemy,
      initiated: true,
    })
    const open = { ...createSupplies(shipClass), crew: small }
    const landed = { ...foe('pirate', small), conveyance: 'horse' as const }
    const [ashore] = fightRound({
      seed: 3,
      supplies: open,
      conveyance: 'ship',
      foe: landed,
      initiated: true,
    })
    expect(round).toEqual(ashore)
  })
})

describe('사료의 사례 — 견제는 거의 죽이지 않고, 손실은 무너진 뒤에 난다', () => {
  function horseFight(seed: number, crew: number, foeCrew: number, id: string) {
    const supplies = { ...createSupplies(shipClass), crew }
    const enemy = { ...foe('bandit', foeCrew), id: `${id}-${seed}` }
    return { supplies, enemy }
  }

  it('Centurion호(1591) — 48명이 150명의 승선 공격을 세 합 받아도 대개 버틴다', () => {
    const held = trials(100, (seed) => {
      const supplies = { ...createSupplies(shipClass), crew: 48 }
      const enemy = { ...foe('pirate', 150), id: `pirate-${seed}` }
      const events = [0, 1, 2].flatMap(() =>
        enemy.crew > 0
          ? fightRound({ seed, supplies, conveyance: 'ship', foe: enemy, initiated: false })
          : [],
      )
      return { held: !events.some((e) => e.type === 'broken'), lost: 48 - supplies.crew }
    })
    expect(held.filter((t) => t.held).length).toBeGreaterThan(60)
    expect(held.reduce((sum, t) => sum + t.lost, 0) / held.length).toBeLessThan(6)
  })

  it('포르투 다스 페드라스(1514) — 144명과 900명의 투창 견제는 한 합에 한 명 남짓 죽인다', () => {
    const lost = trials(100, (seed) => {
      const { supplies, enemy } = horseFight(seed, 144, 900, 'pedras')
      const [round] = fightRound({
        seed,
        supplies,
        conveyance: 'horse',
        foe: enemy,
        initiated: true,
      })
      return round?.type === 'combat' ? round.crewLost : 0
    })
    expect(lost.reduce((sum, n) => sum + n, 0) / lost.length).toBeLessThan(2)
  })

  it('조르즈 비에이라(1510) — 100명에게 쫓긴 32명은 대개 무너지고, 손실은 추격에서 난다', () => {
    const outcomes = trials(100, (seed) => {
      const { supplies, enemy } = horseFight(seed, 32, 100, 'vieira')
      for (let round = 0; round < 6 && enemy.crew > 0; round += 1) {
        const events = fightRound({
          seed,
          supplies,
          conveyance: 'horse',
          foe: enemy,
          initiated: false,
        })
        const broken = events.find((e) => e.type === 'broken')
        if (broken?.type === 'broken') {
          return broken
        }
      }
      return null
    })
    const broken = outcomes.filter((e) => e !== null)
    expect(broken.length).toBeGreaterThan(70)
    expect(broken.every((e) => !e.atSea && e.lost > 0 && e.captured <= e.lost)).toBe(true)
  })

  it('알아채지 못한 무리를 들이받으면 첫 합에 더 자주 무너진다 (아르실라 1509 알가라파)', () => {
    const breaks = (chasing: boolean) =>
      trials(1000, (seed) => {
        const { supplies, enemy } = horseFight(seed, 80, 110, 'algarrafa')
        const events = fightRound({
          seed,
          supplies,
          conveyance: 'horse',
          foe: { ...enemy, chasing },
          initiated: true,
        })
        return events.some((e) => e.type === 'routed')
      }).filter(Boolean).length
    expect(breaks(false)).toBeGreaterThan(breaks(true) * 1.5)
  })

  it('바다에서 무너진 해적은 제 배로 물러날 뿐이라 추격 손실도 포로도 없다', () => {
    const routs = trials(100, (seed) => {
      const supplies = createSupplies(shipClass)
      const enemy = { ...foe('pirate', 20), id: `pirate-${seed}` }
      return fightRound({ seed, supplies, conveyance: 'ship', foe: enemy, initiated: true }).find(
        (e) => e.type === 'routed',
      )
    }).filter((e): e is Extract<CombatEvent, { type: 'routed' }> => e?.type === 'routed')
    expect(routs.length).toBeGreaterThan(0)
    expect(routs.every((e) => e.lost === 0 && e.captured === 0)).toBe(true)
  })
})
