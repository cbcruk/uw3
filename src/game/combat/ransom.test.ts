import { describe, expect, it } from 'vite-plus/test'
import { findShipClass } from '../../content/ships'
import { GOOD_BASE_PRICE } from '../../content/game/trade.tuning'
import type { ShipClass } from '../../sim/ship/ship.types'
import { createSupplies } from '../supplies/supplies'
import type { Cargo, Supplies } from '../supplies/supplies.types'
import { payRansom } from './ransom'

const shipClass = findShipClass('caravela-redonda') as ShipClass

function holding(gold: number, cargo: Cargo): Supplies {
  return { ...createSupplies(shipClass), gold, cargo: { ...cargo } }
}

describe('몸값 — 값진 것부터, 모자라지 않을 만큼 (R63)', () => {
  it('금화로 다 내면 화물은 그대로다', () => {
    const supplies = holding(1000, { silk: 1 })
    expect(payRansom(supplies, 600)).toEqual({ gold: 600, cargo: {} })
    expect(supplies.cargo).toEqual({ silk: 1 })
  })

  it('몸값보다 비싼 비단은 두고, 설탕을 통째로 가져간 뒤 남은 몫을 덮는 가장 싼 한 톤으로 채운다', () => {
    const supplies = holding(0, { silk: 1, sugar: 10 })
    const ransom = payRansom(supplies, 600)
    const sugar = Math.floor(600 / GOOD_BASE_PRICE.sugar) + 1
    expect(ransom).toEqual({ gold: 0, cargo: { sugar } })
    expect(supplies.cargo).toEqual({ silk: 1, sugar: 10 - sugar })
  })

  it('남은 몫을 덮는 화물이 비단뿐이면 비단 한 톤을 함께 낸다', () => {
    const supplies = holding(0, { silk: 1, sugar: 6 })
    expect(payRansom(supplies, 600)).toEqual({ gold: 0, cargo: { sugar: 6, silk: 1 } })
  })

  it('비단만 실었으면 비단 한 톤을 낸다 — 거스름은 없다', () => {
    const supplies = holding(0, { silk: 2 })
    expect(payRansom(supplies, 600)).toEqual({ gold: 0, cargo: { silk: 1 } })
    expect(supplies.cargo).toEqual({ silk: 1 })
  })

  it('더 내는 몫은 남은 몫을 덮는 가장 싼 한 톤 안이다', () => {
    const supplies = holding(0, { silk: 1, wax: 1, salt: 2 })
    const ransom = payRansom(supplies, 150)
    // 비단(3,000)은 두고 소금 두 톤을 가져간 뒤, 남은 144를 덮는 가장 싼 한 톤은 밀랍이다
    expect(ransom?.cargo).toEqual({ salt: 2, wax: 1 })
    const paid = 2 * GOOD_BASE_PRICE.salt + GOOD_BASE_PRICE.wax
    expect(paid - 150).toBeLessThan(GOOD_BASE_PRICE.wax)
  })

  it('다 내도 모자라면 아무것도 바꾸지 않는다', () => {
    const supplies = holding(10, { salt: 2 })
    expect(payRansom(supplies, 600)).toBeNull()
    expect(supplies).toMatchObject({ gold: 10, cargo: { salt: 2 } })
  })
})
