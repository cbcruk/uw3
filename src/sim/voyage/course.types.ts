import type { LatLon } from '../geo/geo.types'

export interface CourseProjection {
  end: LatLon
  travelledNm: number
  /** 육지에 막혀 항정을 다 쓰지 못했다. */
  blocked: boolean
}
