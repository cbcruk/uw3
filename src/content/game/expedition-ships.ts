import { FAME } from './fame.tuning'
import type { ExpeditionShip } from './game-content.types'

/**
 * 원정에 고를 수 있는 선형 (SPEC-roguelike §21). 셋 다 1502년에 쓸 수 있다(`availableFrom`).
 *
 * 두 카라벨은 처음부터 고른다 — 라틴은 해적과 속력이 같아 피하는 배, 혼합은 그 사이다.
 * 나우는 전투·적재·보급 모두 앞서서 명성으로 연다. 대가는 속력이다.
 */
export const EXPEDITION_SHIPS: readonly ExpeditionShip[] = [
  { shipClassId: 'caravela-latina', minFame: 0 },
  { shipClassId: 'caravela-redonda', minFame: 0 },
  { shipClassId: 'nau', minFame: FAME.nauFame },
]

/** 데일리와 고르지 않은 자유 원정의 선형. 원정마다 같은 배로 떠나던 때(§15)의 배다. */
export const DEFAULT_EXPEDITION_SHIP = 'caravela-redonda'
