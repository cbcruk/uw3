import { describe, expect, it } from 'vite-plus/test'
import { PROVISION } from '../../content/game/provisions.tuning'
import { findShipClass } from '../../content/ships'
import type { ShipClass } from '../../sim/ship/ship.types'
import {
  consumeDay,
  createSupplies,
  daysOfSupply,
  expeditionEndOf,
  provisionLimit,
  settleProvisions,
} from './supplies'
import type { Supplies } from './supplies.types'
import { MOUNT } from '../../content/game/mounts.tuning'
import { waterRatio } from '../travel/travel'

const shipClass = findShipClass('caravela-redonda') as ShipClass

function s0(): Supplies {
  return createSupplies(shipClass)
}

function supplies(overrides: Partial<Supplies>): Supplies {
  return { ...createSupplies(shipClass), ...overrides }
}

describe('보급 — 하루치를 먹고, 모자라면 선원을 잃는다', () => {
  it('출항 때는 가득 차 있고 정원의 가운데만큼 태운다', () => {
    const start = createSupplies(shipClass)
    expect(start.food).toBe(start.capacity)
    expect(start.water).toBe(start.capacity)
    expect(start.crew).toBe(Math.round((shipClass.crewMin + shipClass.crewMax) / 2))
    expect(start.hull).toBe(shipClass.hullPoints)
  })

  it('넉넉하면 한 사람이 하루 하나씩 먹고 마시고 아무도 잃지 않는다', () => {
    const s = supplies({ crew: 30, food: 100, water: 100 })
    const report = consumeDay(s)
    expect(report).toEqual({ lost: 0, starving: false, thirsty: false })
    expect(s).toMatchObject({ crew: 30, food: 70, water: 70 })
  })

  it('물이 떨어지면 굶을 때보다 많이 잃는다', () => {
    const thirsty = supplies({ crew: 100, food: 1000, water: 0 })
    const starving = supplies({ crew: 100, food: 0, water: 1000 })
    const thirstLoss = consumeDay(thirsty).lost
    const starveLoss = consumeDay(starving).lost
    expect(thirstLoss).toBe(Math.ceil(100 * PROVISION.thirstLossRatio))
    expect(thirstLoss).toBeGreaterThan(starveLoss)
  })

  it('작은 선원이라도 모자라면 최소 한 명은 잃는다', () => {
    const s = supplies({ crew: 3, food: 0, water: 3 })
    expect(consumeDay(s).lost).toBe(1)
  })

  it('선원이 0이 되면 원정이 끝난다', () => {
    const s = supplies({ crew: 1, food: 0, water: 0 })
    consumeDay(s)
    expect(s.crew).toBe(0)
    expect(expeditionEndOf(s)).toBe('crew-lost')
    expect(expeditionEndOf(supplies({ hull: 0 }))).toBe('hull-lost')
    expect(expeditionEndOf(createSupplies(shipClass))).toBeNull()
  })

  it('버틸 날은 식량과 물 중 적은 쪽이 정한다', () => {
    expect(daysOfSupply(supplies({ crew: 10, food: 95, water: 300 }))).toBe(9)
    expect(daysOfSupply(supplies({ crew: 0 }))).toBe(0)
  })

  it('항구에서 채우면 상한까지 사서 채우고 그 값을 낸다', () => {
    const s = supplies({ food: 1, water: 2, gold: 10_000 })
    const settled = settleProvisions(s)
    expect(s.food).toBe(s.capacity)
    expect(s.water).toBe(s.capacity)
    expect(settled.gold).toBe(-Math.ceil((settled.food + settled.water) * PROVISION.provisionPrice))
    expect(settled.short).toBe(false)
  })

  it('금화가 모자라면 살 수 있는 만큼만, 모자란 몫에 비례해 나눠 산다', () => {
    const s = supplies({ food: 0, water: 0, gold: 40 })
    const settled = settleProvisions(s)
    expect(settled.short).toBe(true)
    expect(s.food + s.water).toBe(Math.floor(40 / PROVISION.provisionPrice))
    expect(Math.abs(s.food - s.water)).toBeLessThanOrEqual(1)
    expect(s.gold).toBeGreaterThanOrEqual(0)
  })

  it('화물이 자리를 차지하면 식량·물의 상한이 그만큼 준다', () => {
    const s = supplies({ cargo: { salt: s0().holdTons / 2 } })
    expect(provisionLimit(s)).toBe(Math.floor(s.capacity / 2))
    expect(provisionLimit(supplies({ cargo: { salt: s0().holdTons } }))).toBe(0)
  })
})

describe('사막의 물 — 낙타를 고를 이유', () => {
  /** 사막을 이만큼 건너는 동안 날마다 먹고 마신다. 남은 선원을 돌려준다. */
  function cross(distanceNm: number, mount: 'horse' | 'camel'): number {
    const s = s0()
    const speed = mount === 'horse' ? MOUNT.horseDesert : MOUNT.camelDesert
    const days = Math.ceil(distanceNm / speed)
    for (let day = 0; day < days; day += 1) {
      consumeDay(s, waterRatio(mount, 'desert'))
    }
    return s.crew
  }

  it('말은 사막에서 물을 더 마시고 낙타는 덜 마신다. 바다와 초지는 평소대로다', () => {
    expect(waterRatio('horse', 'desert')).toBeGreaterThan(waterRatio('camel', 'desert'))
    expect(waterRatio('camel', 'desert')).toBeGreaterThan(1)
    expect(waterRatio('horse', 'grassland')).toBe(1)
    expect(waterRatio('ship', 'sea')).toBe(1)
  })

  it('물 배율은 물에만 걸린다. 식량은 평소대로 줄고, 물은 올림으로 떠낸다', () => {
    const s = supplies({ crew: 10, food: 100, water: 100 })
    consumeDay(s, waterRatio('horse', 'desert'))
    expect(s).toMatchObject({
      food: 90,
      water: 100 - Math.ceil(10 * waterRatio('horse', 'desert')),
    })
  })

  it('사막 300해리를 건너면 낙타는 모두 살아남고 말은 물이 떨어져 선원을 잃는다', () => {
    const crew = s0().crew
    expect(cross(300, 'camel')).toBe(crew)
    expect(cross(300, 'horse')).toBeLessThan(crew / 2)
  })

  it('버틸 날은 물 배율만큼 줄어든다', () => {
    const s = supplies({ crew: 10, food: 300, water: 300 })
    expect(daysOfSupply(s)).toBe(30)
    expect(daysOfSupply(s, waterRatio('horse', 'desert'))).toBe(10)
  })
})
