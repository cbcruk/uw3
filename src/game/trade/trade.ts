import { GOODS, findGoodByName } from '../../content/game/goods'
import type { GoodId } from '../../content/game/game-content.types'
import { GOOD_BASE_PRICE, TRADE } from '../../content/game/trade.tuning'
import { findPort } from '../../content/ports'
import { cargoTons } from '../supplies/supplies'
import type { Supplies } from '../supplies/supplies.types'
import type { MarketLine, TradeResult } from './trade.types'

/** 시장이 있는 항구인가. 시장이 없으면 사지도 팔지도 못한다. */
function hasMarket(portId: string): boolean {
  return findPort(portId)?.facilities.includes('market') ?? false
}

/** 이 항구가 산지인 품목. 항구 자료의 이름을 교역 표의 순서로 바꾼다. */
function producedAt(portId: string): Set<GoodId> {
  const names = findPort(portId)?.goods ?? []
  return new Set(
    names.flatMap((name) => {
      const good = findGoodByName(name)
      return good === undefined ? [] : [good.id]
    }),
  )
}

/**
 * 이 항구에서 그 품목 한 톤의 값. 시장이 없으면 `null`.
 *
 * 산지는 기준값 × `localPriceRatio`에 사고팔고, 산지가 아니면 기준값 × `foreignPriceRatio`에 사들인다.
 * 거리도 재고도 보지 않는다 — 값은 항구와 품목에서만 정해진다 (R54).
 */
export function priceAt(portId: string, goodId: GoodId): number | null {
  // 저장소에서 되살린 명령 로그에는 표에 없는 품목이 섞여 있을 수 있다.
  const base = GOOD_BASE_PRICE[goodId] as number | undefined
  if (base === undefined || !hasMarket(portId)) {
    return null
  }
  const ratio = producedAt(portId).has(goodId) ? TRADE.localPriceRatio : TRADE.foreignPriceRatio
  return Math.round(base * ratio)
}

/** 이 항구에서 살 수 있는 품목과 값. 산지인 품목만 판다. */
export function marketAt(portId: string): MarketLine[] {
  if (!hasMarket(portId)) {
    return []
  }
  const produced = producedAt(portId)
  return GOODS.filter((good) => produced.has(good.id)).map((good) => ({
    good,
    price: priceAt(portId, good.id) ?? 0,
  }))
}

/** 실은 품목을 교역 표의 순서로. 화면의 화물 목록과 팔기 키가 이 순서를 쓴다. */
export function cargoGoods(supplies: Supplies): GoodId[] {
  return GOODS.map((good) => good.id).filter((id) => (supplies.cargo[id] ?? 0) > 0)
}

/**
 * 산지 항구에서 화물을 산다. 금화와 화물칸 자리가 허락하는 만큼만 산다.
 *
 * 식량·물은 자리를 막지 않는다 — 산 뒤에 `settleProvisions`가 밀려난 몫을 되판다 (R53).
 */
export function buyGoods(
  supplies: Supplies,
  portId: string,
  goodId: GoodId,
  tons: number,
): TradeResult {
  const price = priceAt(portId, goodId)
  if (price === null || !producedAt(portId).has(goodId)) {
    return { ok: false, reason: '이 항구에서는 그 품목을 팔지 않는다' }
  }
  const room = Math.max(0, supplies.holdTons - cargoTons(supplies.cargo))
  const affordable = Math.floor(supplies.gold / price)
  const bought = Math.min(wholeTons(tons), room, affordable)
  if (bought <= 0) {
    return {
      ok: false,
      reason: room <= 0 ? '화물칸이 찼다' : `금화가 모자라다 (한 톤 ${price}두카트)`,
    }
  }
  const gold = bought * price
  supplies.gold -= gold
  supplies.cargo[goodId] = (supplies.cargo[goodId] ?? 0) + bought
  return { ok: true, tons: bought, gold: -gold }
}

/** 실은 화물을 판다. 시장이 있는 항구라면 어디서나 판다. 실은 것보다 많이 팔려 하면 실은 만큼만. */
export function sellGoods(
  supplies: Supplies,
  portId: string,
  goodId: GoodId,
  tons: number,
): TradeResult {
  const price = priceAt(portId, goodId)
  if (price === null) {
    return { ok: false, reason: '이 항구에는 시장이 없다' }
  }
  const held = supplies.cargo[goodId] ?? 0
  const sold = Math.min(wholeTons(tons), held)
  if (sold <= 0) {
    return { ok: false, reason: '그 품목을 싣고 있지 않다' }
  }
  const gold = sold * price
  supplies.gold += gold
  if (sold === held) {
    delete supplies.cargo[goodId]
  } else {
    supplies.cargo[goodId] = held - sold
  }
  return { ok: true, tons: sold, gold }
}

/** 명령 로그는 저장소에서 되살아나므로 톤 수가 정수라고 믿지 않는다. */
function wholeTons(tons: number): number {
  return Number.isFinite(tons) ? Math.max(0, Math.floor(tons)) : 0
}
