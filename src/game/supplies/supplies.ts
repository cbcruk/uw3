import { PROVISION } from '../../content/game/provisions.tuning'
import type { ShipClass } from '../../sim/ship/ship.types'
import { supplyCapacity } from '../../sim/world/world'
import type { ExpeditionEnd, RationReport, Supplies } from './supplies.types'

/** 출항 때의 보급. 시뮬의 새 게임과 같은 규칙이다 — 선원은 정원의 가운데, 식량·물은 가득. */
export function createSupplies(shipClass: ShipClass): Supplies {
  const capacity = supplyCapacity(shipClass.capacityTons)
  return {
    crew: Math.round((shipClass.crewMin + shipClass.crewMax) / 2),
    food: capacity,
    water: capacity,
    hull: shipClass.hullPoints,
    hullMax: shipClass.hullPoints,
    capacity,
  }
}

/**
 * 하루치를 먹고 마신다. 모자라면 모자란 몫에 비례해 선원을 잃는다.
 *
 * 한 명이라도 모자라면 최소 한 명은 잃는다. 비율만 쓰면 작은 배는 영영 죽지 않는다.
 */
export function consumeDay(supplies: Supplies): RationReport {
  const need = supplies.crew
  const foodServed = Math.min(supplies.food, need)
  const waterServed = Math.min(supplies.water, need)
  supplies.food -= foodServed
  supplies.water -= waterServed

  const foodShort = shortfall(need, foodServed)
  const waterShort = shortfall(need, waterServed)
  const lossRatio =
    foodShort * PROVISION.starvationLossRatio + waterShort * PROVISION.thirstLossRatio
  const lost = lossRatio > 0 ? Math.min(supplies.crew, Math.max(1, Math.ceil(need * lossRatio))) : 0
  supplies.crew -= lost
  return { lost, starving: foodShort > 0, thirsty: waterShort > 0 }
}

/** 항구에서 식량과 물을 가득 채운다. 값은 아직 받지 않는다 — 교역이 들어오면 바뀐다. */
export function resupply(supplies: Supplies): void {
  supplies.food = supplies.capacity
  supplies.water = supplies.capacity
}

/** 식량과 물 중 먼저 떨어지는 쪽으로 며칠을 버티는가. 선원이 없으면 0. */
export function daysOfSupply(supplies: Supplies): number {
  if (supplies.crew <= 0) {
    return 0
  }
  return Math.floor(Math.min(supplies.food, supplies.water) / supplies.crew)
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
