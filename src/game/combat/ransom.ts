import { GOOD_BASE_PRICE } from '../../content/game/trade.tuning'
import type { GoodId } from '../../content/game/game-content.types'
import type { Cargo, Supplies } from '../supplies/supplies.types'
import { cargoGoods } from '../trade/trade'
import type { Ransom } from './combat.types'

/**
 * 몸값을 금화로 내고, 모자라면 화물로 채운다. 내지 못하면 `null`이고 아무것도 바꾸지 않는다.
 *
 * 화물은 기준값으로 친다 — 산지 값도 외지 값도 아니다. 해적은 값진 것부터 고르되 모자라지 않을 만큼만
 * 통째 톤으로 가져가고, 남은 몫은 그것을 덮는 가장 싼 한 톤으로 채운다 (R63). 거스름은 없으므로
 * 더 내는 몫은 그 한 톤 안이다. 비단만 실었으면 여전히 비단 한 톤을 낸다.
 */
export function payRansom(supplies: Supplies, demand: number): Ransom | null {
  const gold = Math.min(supplies.gold, demand)
  let owed = demand - gold
  const cargo: Cargo = {}
  const left = (goodId: GoodId): number => (supplies.cargo[goodId] ?? 0) - (cargo[goodId] ?? 0)
  const take = (goodId: GoodId, tons: number): void => {
    cargo[goodId] = (cargo[goodId] ?? 0) + tons
    owed -= tons * GOOD_BASE_PRICE[goodId]
  }
  const byValue = cargoGoods(supplies).sort((a, b) => GOOD_BASE_PRICE[b] - GOOD_BASE_PRICE[a])
  for (const goodId of byValue) {
    const tons = Math.min(left(goodId), Math.floor(owed / GOOD_BASE_PRICE[goodId]))
    if (tons > 0) {
      take(goodId, tons)
    }
  }
  if (owed > 0) {
    const cover = byValue.findLast((goodId) => left(goodId) > 0 && GOOD_BASE_PRICE[goodId] >= owed)
    if (cover !== undefined) {
      take(cover, 1)
    }
  }
  if (owed > 0) {
    return null
  }
  supplies.gold -= gold
  for (const [goodId, tons] of Object.entries(cargo) as [GoodId, number][]) {
    const kept = (supplies.cargo[goodId] ?? 0) - tons
    if (kept > 0) {
      supplies.cargo[goodId] = kept
    } else {
      delete supplies.cargo[goodId]
    }
  }
  return { gold, cargo }
}
