export interface Wind {
  /** 바람이 불어오는 방향 (항해 관례). 0 = 북풍. */
  fromDeg: number
  speedKnots: number
  regime: WindRegime
}

export type WindRegime =
  | 'doldrums'
  | 'trades'
  | 'horse-latitudes'
  | 'westerlies'
  | 'mediterranean'
  | 'mistral'
  | 'levanter'
  | 'poniente'

export interface WindBand {
  maxLat: number
  fromDeg: number
  speedKnots: number
  regime: WindRegime
}
