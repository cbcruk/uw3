import { LEEWAY } from "../../content/tuning/leeway.tuning";
import { angleDifference, clamp, toRadians } from "../geo/geo.utils";

/**
 * 압류각 — 뱃머리 방향과 실제 진행 방향이 벌어지는 크기 (SHAPE P9).
 *
 * 돛이 내는 양력 중 앞으로 미는 몫과 옆으로 미는 몫의 비는 풍향각에 달려 있다.
 * 바람에 가깝게 붙을수록 옆으로 미는 몫이 커지고, 선체가 그것을 다 받아내지
 * 못하면 배는 풍하로 미끄러진다. 정횡을 지나면 옆으로 미는 힘이 사라져 압류도 없다.
 *
 * `cos(풍향각)`은 그 몫을 나타낸다 — 정풍에서 1, 정횡에서 0. 실제로 항해 가능한
 * 최소 각(무보각 한계)에서 최대가 되므로, 압류는 클로스홀드에서 가장 크다.
 */
export function leewayAngleDeg(relAngleDeg: number, windSpeedKnots: number): number {
  const sideForceFraction = clamp(Math.cos(toRadians(relAngleDeg)), 0, 1);
  const windFactor = clamp(
    windSpeedKnots / LEEWAY.referenceWindKnots,
    LEEWAY.windScaleFloor,
    LEEWAY.windScaleCap,
  );
  return LEEWAY.referenceDeg * sideForceFraction * windFactor;
}

/**
 * 압류를 반영한 **돛의 실제 진행 방위**. 배는 뱃머리가 향한 곳으로 가지 않는다.
 *
 * 어느 쪽으로 밀리는지는 바람을 어느 현으로 받는가에 달려 있다. 좌현으로 받으면
 * 우현으로, 우현으로 받으면 좌현으로 밀린다 — 언제나 풍하 쪽이다.
 */
export function leewayTrackDeg(
  headingDeg: number,
  windFromDeg: number,
  windSpeedKnots: number,
  sailSpeedKnots: number,
): number {
  // 돛이 물지 못하면 옆으로 미는 힘도 없다. 표류는 해류가 맡는다.
  if (sailSpeedKnots <= 0) {
    return headingDeg;
  }
  const signed = angleDifference(headingDeg, windFromDeg);
  const leewayDeg = leewayAngleDeg(Math.abs(signed), windSpeedKnots);
  return headingDeg + Math.sign(signed) * leewayDeg;
}
