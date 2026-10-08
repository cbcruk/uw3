import { describe, expect, it } from 'vite-plus/test'
import { GOOD_BASE_PRICE, TRADE } from '../../content/game/trade.tuning'
import { findShipClass } from '../../content/ships'
import type { ShipClass } from '../../sim/ship/ship.types'
import { createSupplies } from '../supplies/supplies'
import { buyGoods, cargoGoods, marketAt, priceAt, sellGoods } from './trade'

const shipClass = findShipClass('caravela-redonda') as ShipClass

describe('시장 — 값은 항구와 품목에서만 정해진다', () => {
  it('산지는 싸게, 산지가 아닌 항구는 비싸게 값을 매긴다', () => {
    expect(priceAt('angra', 'woad')).toBe(Math.round(GOOD_BASE_PRICE.woad * TRADE.localPriceRatio))
    expect(priceAt('lisboa', 'woad')).toBe(
      Math.round(GOOD_BASE_PRICE.woad * TRADE.foreignPriceRatio),
    )
  })

  it('항구는 산지인 품목만 판다', () => {
    expect(marketAt('angra').map((line) => line.good.id)).toEqual(['wheat', 'wine', 'woad'])
  })

  it('금화와 화물칸이 허락하는 만큼만 산다', () => {
    const poor = { ...createSupplies(shipClass), gold: 100 }
    const price = priceAt('malaga', 'sugar') ?? 0
    const result = buyGoods(poor, 'malaga', 'sugar', 50)
    expect(result).toEqual({
      ok: true,
      tons: Math.floor(100 / price),
      gold: -Math.floor(100 / price) * price,
    })

    const rich = { ...createSupplies(shipClass), gold: 1_000_000 }
    expect(buyGoods(rich, 'lisboa', 'salt', 1000)).toMatchObject({ tons: shipClass.capacityTons })
    expect(buyGoods(rich, 'lisboa', 'salt', 1)).toMatchObject({ ok: false })
  })

  it('실은 만큼만 팔고, 다 팔면 화물 목록에서 빠진다', () => {
    const supplies = { ...createSupplies(shipClass), cargo: { wine: 5, salt: 3 } }
    expect(cargoGoods(supplies)).toEqual(['salt', 'wine'])
    expect(sellGoods(supplies, 'angra', 'salt', 10)).toMatchObject({ ok: true, tons: 3 })
    expect(supplies.cargo).toEqual({ wine: 5 })
    expect(sellGoods(supplies, 'angra', 'salt', 1)).toMatchObject({ ok: false })
  })

  it('산지에서 사서 다른 항구에 팔면 이익이 난다', () => {
    const supplies = createSupplies(shipClass)
    const before = supplies.gold
    buyGoods(supplies, 'angra', 'woad', 10)
    sellGoods(supplies, 'lisboa', 'woad', 10)
    expect(supplies.gold).toBeGreaterThan(before)
  })
})
