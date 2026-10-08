import { toDegrees, toRadians } from './geo.utils'

/** 메르카토르 식의 π/4. 정의다. */
const QUARTER_TURN_RAD = Math.PI / 4

/** 위도 → 메르카토르 y (라디안 단위). 극에서 발산한다. */
export function mercatorY(latDeg: number): number {
  return Math.log(Math.tan(QUARTER_TURN_RAD + toRadians(latDeg) / 2))
}

/** 메르카토르 y → 위도. */
export function latitudeOfMercatorY(y: number): number {
  return toDegrees(Math.atan(Math.sinh(y)))
}
