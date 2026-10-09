import { describe, expect, it } from 'vite-plus/test'
import { GOOD_BASE_PRICE, TRADE } from '../../content/game/trade.tuning'
import { findShipClass } from '../../content/ships'
import type { ShipClass } from '../../sim/ship/ship.types'
import { createSupplies } from '../supplies/supplies'
import { FAME } from '../../content/game/fame.tuning'
import type { LanguageId } from '../../content/content.types'
import {
  buyGoods,
  cargoGoods,
  knownLanguages,
  marketAt,
  portFee,
  priceAt,
  sellGoods,
} from './trade'

/** 말을 모두 아는 원정. 값의 바탕만 보려는 테스트가 쓴다. */
const FLUENT: ReadonlySet<LanguageId> = new Set(['portuguese', 'castilian', 'arabic'])

const shipClass = findShipClass('caravela-redonda') as ShipClass

describe('시장 — 값은 항구와 품목에서만 정해진다', () => {
  it('산지는 싸게, 산지가 아닌 항구는 비싸게 값을 매긴다', () => {
    expect(priceAt('angra', 'woad', 'buy', FLUENT)).toBe(
      Math.round(GOOD_BASE_PRICE.woad * TRADE.localPriceRatio),
    )
    expect(priceAt('lisboa', 'woad', 'buy', FLUENT)).toBe(
      Math.round(GOOD_BASE_PRICE.woad * TRADE.foreignPriceRatio),
    )
  })

  it('항구는 산지인 품목만 판다', () => {
    expect(marketAt('angra', FLUENT).map((line) => line.good.id)).toEqual(['wheat', 'wine', 'woad'])
  })

  it('금화와 화물칸이 허락하는 만큼만 산다', () => {
    const poor = { ...createSupplies(shipClass), gold: 100 }
    const price = priceAt('malaga', 'sugar', 'buy', FLUENT) ?? 0
    const result = buyGoods(poor, 'malaga', 'sugar', 50, FLUENT)
    expect(result).toEqual({
      ok: true,
      tons: Math.floor(100 / price),
      gold: -Math.floor(100 / price) * price,
    })

    const rich = { ...createSupplies(shipClass), gold: 1_000_000 }
    expect(buyGoods(rich, 'lisboa', 'salt', 1000, FLUENT)).toMatchObject({
      tons: shipClass.capacityTons,
    })
    expect(buyGoods(rich, 'lisboa', 'salt', 1, FLUENT)).toMatchObject({ ok: false })
  })

  it('실은 만큼만 팔고, 다 팔면 화물 목록에서 빠진다', () => {
    const supplies = { ...createSupplies(shipClass), cargo: { wine: 5, salt: 3 } }
    expect(cargoGoods(supplies)).toEqual(['salt', 'wine'])
    expect(sellGoods(supplies, 'angra', 'salt', 10, FLUENT)).toMatchObject({ ok: true, tons: 3 })
    expect(supplies.cargo).toEqual({ wine: 5 })
    expect(sellGoods(supplies, 'angra', 'salt', 1, FLUENT)).toMatchObject({ ok: false })
  })

  it('산지에서 사서 다른 항구에 팔면 이익이 난다', () => {
    const supplies = createSupplies(shipClass)
    const before = supplies.gold
    buyGoods(supplies, 'angra', 'woad', 10, FLUENT)
    sellGoods(supplies, 'lisboa', 'woad', 10, FLUENT)
    expect(supplies.gold).toBeGreaterThan(before)
  })

  const native = knownLanguages({
    seed: 0,
    startDate: { year: 1502, month: 1, day: 1 },
    startPortId: 'lisboa',
    shipClassId: 'x',
  })

  it('다른 나라 항구에서는 관세를 낸다 — 말을 다 알아도 남는다', () => {
    const base = GOOD_BASE_PRICE.sugar * TRADE.localPriceRatio
    expect(portFee('malaga', FLUENT)).toEqual({
      customs: TRADE.customsDuty,
      interpreter: 0,
      total: TRADE.customsDuty,
    })
    expect(priceAt('malaga', 'sugar', 'buy', FLUENT)).toBe(
      Math.round(base * (1 + TRADE.customsDuty)),
    )
    expect(priceAt('malaga', 'sugar', 'sell', FLUENT)).toBe(
      Math.round(base * (1 - TRADE.customsDuty)),
    )
  })

  it('말을 모르는 항구에서는 통역료를 더 낸다. 관세와 더한다', () => {
    expect(portFee('malaga', native).total).toBeCloseTo(TRADE.customsDuty + FAME.interpreterFee)
    expect(portFee('ceuta', native)).toEqual({
      customs: 0,
      interpreter: FAME.interpreterFee,
      total: FAME.interpreterFee,
    })
  })

  it('원정의 나라·말인 항구에서는 떼이는 몫이 없어 산지의 사는 값과 파는 값이 같다', () => {
    expect(portFee('lisboa', native).total).toBe(0)
    expect(priceAt('lisboa', 'salt', 'buy', native)).toBe(priceAt('lisboa', 'salt', 'sell', native))
    expect(priceAt('ceuta', 'wax', 'buy', FLUENT)).toBe(priceAt('ceuta', 'wax', 'sell', FLUENT))
  })
})
