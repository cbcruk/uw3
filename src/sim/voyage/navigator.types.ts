export interface NavigatorPlan {
  headingDeg: number
  /** 이 침로로 하루를 보냈을 때 목적지까지 줄어드는 거리. 양수만 채택한다. */
  gainNm: number
  speedKnots: number
  /** 하루 항정 도중 육지에 막힌다. 채택은 하되 하루를 다 쓰지는 못한다. */
  blocked: boolean
}
