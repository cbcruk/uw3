import { PROVISION } from '../../content/game/provisions.tuning'
import { TRADE } from '../../content/game/trade.tuning'
import type { ShipClass } from '../../sim/ship/ship.types'
import { supplyCapacity } from '../../sim/world/world'
import type {
  Cargo,
  ExpeditionEnd,
  ProvisionSettlement,
  Provisioned,
  RationReport,
  Supplies,
} from './supplies.types'

/**
 * 출항 때의 보급. 시뮬의 새 게임과 같은 규칙이다 — 선원은 정원의 가운데, 식량·물은 가득, 화물칸은 비었다.
 *
 * @param patronGold 명성에서 나온 후원금. 출항 금화에 더한다.
 */
export function createSupplies(shipClass: ShipClass, patronGold = 0): Supplies {
  const capacity = supplyCapacity(shipClass.capacityTons)
  return {
    crew: Math.round((shipClass.crewMin + shipClass.crewMax) / 2),
    food: capacity,
    water: capacity,
    hull: shipClass.hullPoints,
    hullMax: shipClass.hullPoints,
    capacity,
    holdTons: shipClass.capacityTons,
    gold: TRADE.startGold + patronGold,
    cargo: {},
  }
}

/**
 * 하루치를 먹고 마신다. 모자라면 모자란 몫에 비례해 선원을 잃는다.
 *
 * 한 명이라도 모자라면 최소 한 명은 잃는다. 비율만 쓰면 작은 배는 영영 죽지 않는다.
 *
 * @param waterRatio 한 사람의 하루 물 소모 배율. 사막의 말은 3, 낙타는 1.5다 (R68). 올림으로 떠낸다.
 */
export function consumeDay(supplies: Provisioned, waterRatio = 1): Omit<RationReport, 'ashore'> {
  const need = supplies.crew
  const waterNeed = Math.ceil(need * waterRatio)
  const foodServed = Math.min(supplies.food, need)
  const waterServed = Math.min(supplies.water, waterNeed)
  supplies.food -= foodServed
  supplies.water -= waterServed

  const foodShort = shortfall(need, foodServed)
  const waterShort = shortfall(waterNeed, waterServed)
  const lossRatio =
    foodShort * PROVISION.starvationLossRatio + waterShort * PROVISION.thirstLossRatio
  const lost = lossRatio > 0 ? Math.min(supplies.crew, Math.max(1, Math.ceil(need * lossRatio))) : 0
  supplies.crew -= lost
  return { lost, starving: foodShort > 0, thirsty: waterShort > 0 }
}

/** 화물칸에 실은 톤 수. */
export function cargoTons(cargo: Cargo): number {
  return Object.values(cargo).reduce((sum, tons) => sum + tons, 0)
}

/**
 * 화물이 남긴 자리에 실을 수 있는 식량·물 각각의 상한.
 *
 * 빈 배면 `capacity`다. 화물이 적재량의 3분의 1을 차지하면 식량·물도 3분의 1이 준다 (R53).
 */
export function provisionLimit(supplies: Supplies): number {
  const freeTons = Math.max(0, supplies.holdTons - cargoTons(supplies.cargo))
  return Math.floor((supplies.capacity * freeTons) / supplies.holdTons)
}

/**
 * 항구에서 식량·물을 화물이 남긴 자리까지 맞춘다. 모자라면 사고, 넘치면 같은 값에 되판다.
 *
 * 금화가 모자라면 살 수 있는 만큼만 산다. 식량과 물에는 모자란 몫에 비례해 나눈다.
 * 사는 값은 올림, 되파는 값은 내림이다 — 사고팔기를 되풀이해 금화가 불어나지 않게 한다.
 */
export function settleProvisions(supplies: Supplies): ProvisionSettlement {
  const before = { food: supplies.food, water: supplies.water, gold: supplies.gold }
  const price = PROVISION.provisionPrice
  const limit = provisionLimit(supplies)
  const surplus = Math.max(0, supplies.food - limit) + Math.max(0, supplies.water - limit)
  supplies.food = Math.min(supplies.food, limit)
  supplies.water = Math.min(supplies.water, limit)
  supplies.gold += Math.floor(surplus * price)

  const foodNeed = limit - supplies.food
  const waterNeed = limit - supplies.water
  const need = foodNeed + waterNeed
  const bought = Math.min(need, Math.floor(supplies.gold / price))
  if (bought > 0) {
    const food = Math.floor((bought * foodNeed) / need)
    supplies.food += food
    supplies.water += bought - food
    supplies.gold -= Math.min(supplies.gold, Math.ceil(bought * price))
  }
  return {
    food: supplies.food - before.food,
    water: supplies.water - before.water,
    gold: supplies.gold - before.gold,
    short: bought < need,
  }
}

/**
 * 식량과 물 중 먼저 떨어지는 쪽으로 며칠을 버티는가. 선원이 없으면 0.
 *
 * @param waterRatio 지금 자리의 물 소모 배율. 사막에서는 물이 먼저 떨어진다.
 */
export function daysOfSupply(supplies: Provisioned, waterRatio = 1): number {
  if (supplies.crew <= 0) {
    return 0
  }
  return Math.floor(
    Math.min(supplies.food / supplies.crew, supplies.water / Math.ceil(supplies.crew * waterRatio)),
  )
}

/** 원정이 끝났는가. 선원이 없거나 선체가 무너지면 끝이다. */
export function expeditionEndOf(supplies: Supplies): ExpeditionEnd | null {
  if (supplies.crew <= 0) {
    return 'crew-lost'
  }
  if (supplies.hull <= 0) {
    return 'hull-lost'
  }
  return null
}

function shortfall(need: number, served: number): number {
  return need > 0 ? (need - served) / need : 0
}
