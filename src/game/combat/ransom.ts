import { GOOD_BASE_PRICE } from '../../content/game/trade.tuning'
import type { GoodId } from '../../content/game/game-content.types'
import type { Cargo, Supplies } from '../supplies/supplies.types'
import { cargoGoods } from '../trade/trade'
import type { Ransom } from './combat.types'

/**
 * 몸값을 금화로 내고, 모자라면 화물로 채운다. 내지 못하면 `null`이고 아무것도 바꾸지 않는다.
 *
 * 화물은 기준값으로 친다 — 산지 값도 외지 값도 아니다. 비싼 품목부터 통째 톤으로 가져가서
 * 조금 더 낼 수 있다. 해적이 거스름을 주지 않는다.
 */
export function payRansom(supplies: Supplies, demand: number): Ransom | null {
  const gold = Math.min(supplies.gold, demand)
  let owed = demand - gold
  const cargo: Cargo = {}
  const byValue = cargoGoods(supplies).sort((a, b) => GOOD_BASE_PRICE[b] - GOOD_BASE_PRICE[a])
  for (const goodId of byValue) {
    if (owed <= 0) {
      break
    }
    const price = GOOD_BASE_PRICE[goodId]
    const tons = Math.min(supplies.cargo[goodId] ?? 0, Math.ceil(owed / price))
    cargo[goodId] = tons
    owed -= tons * price
  }
  if (owed > 0) {
    return null
  }
  supplies.gold -= gold
  for (const [goodId, tons] of Object.entries(cargo) as [GoodId, number][]) {
    const left = (supplies.cargo[goodId] ?? 0) - tons
    if (left > 0) {
      supplies.cargo[goodId] = left
    } else {
      delete supplies.cargo[goodId]
    }
  }
  return { gold, cargo }
}
