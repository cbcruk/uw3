import type { LatLon } from '../geo/geo.types'

export interface VoyageReference {
  /** 실제 소요 일수. **사료로 확인되지 않았으면 null.** 추정치를 넣지 않는다. */
  days: number | null
  /** 출처. 확인 전에는 무엇을 확인해야 하는지 적는다. */
  source: string
}

export interface HistoricalVoyage {
  id: string
  name: string
  summary: string
  /** 이 항해가 가르치는 것. 재현에 성공하면 플레이어가 스스로 겪는 내용이다. */
  lesson: string
  startPortId: string
  endPortId: string
  departure: { year: number; month: number; day: number }
  reference: VoyageReference
}

/**
 * 항해 기록. 대조 화면의 근거가 되므로 시뮬이 직접 쌓는다.
 * 항적을 UI가 따로 집계하면 두 숫자가 갈라진다.
 */
export interface Logbook {
  startDay: number
  startPosition: LatLon
  daysAtSea: number
  distanceNm: number
  southmostLat: number
  northmostLat: number
  /** 돛이 바람을 물지 못한 날. 계획이 나빴는지 보는 지표다. */
  stalledDays: number
  hazardDays: number
}

export interface VoyageComparison {
  voyage: HistoricalVoyage
  arrived: boolean
  days: number
  distanceNm: number
  /** 출발지에서 목적지까지의 직선거리. */
  directNm: number
  /** 항정 ÷ 직선거리. 1에 가까울수록 곧게 갔다는 뜻이다. */
  detourRatio: number
  southmostLat: number
  stalledDays: number
  reference: VoyageReference
}
