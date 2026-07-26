import { clamp, lerp } from "../geo/geo.utils";
import type { MastSail, SailingCondition, SailType, ShipClass } from "./ship.types";

type Curve = readonly (readonly [angle: number, efficiency: number])[];

/**
 * 원작의 수치 테이블을 이식하지 않는다 (SPEC 8.2). 곡선의 형태만 계승한다.
 * 가로돛: 정풍 근처에서 무력, 뒤에서 받을 때 강력.
 * 세로돛(라틴): 역풍 대각까지 물고 갈 수 있으나 순풍에서 둔하다.
 */
const SQUARE_CURVE: Curve = [
  [0, 0],
  [50, 0],
  [65, 0.18],
  [90, 0.52],
  [120, 0.84],
  [150, 1],
  [180, 0.9],
];

const LATEEN_CURVE: Curve = [
  [0, 0],
  [32, 0],
  [45, 0.44],
  [70, 0.85],
  [100, 1],
  [130, 0.86],
  [155, 0.68],
  [180, 0.52],
];

const CURVES: Readonly<Record<SailType, Curve>> = {
  square: SQUARE_CURVE,
  lateen: LATEEN_CURVE,
};

/** 이 풍속에서 선급 최고 속력이 나온다. 이보다 세면 축범이 필요하다. */
const NOMINAL_WIND_KNOTS = 14;
const REEFING_THRESHOLD_KNOTS = 26;

export function sailEfficiency(type: SailType, relAngleDeg: number): number {
  const curve = CURVES[type];
  const angle = clamp(relAngleDeg, 0, 180);
  for (let i = 1; i < curve.length; i += 1) {
    const [prevAngle, prevValue] = curve[i - 1] as readonly [number, number];
    const [nextAngle, nextValue] = curve[i] as readonly [number, number];
    if (angle <= nextAngle) {
      const t = (angle - prevAngle) / (nextAngle - prevAngle);
      return lerp(prevValue, nextValue, t);
    }
  }
  return (curve[curve.length - 1] as readonly [number, number])[1];
}

/** 펼친 돛들의 합성 추진 계수. 전 돛을 최적각으로 받을 때 1.0. */
export function rigThrust(
  rig: readonly MastSail[],
  sailsSet: readonly boolean[],
  relAngleDeg: number,
): number {
  const totalArea = rig.reduce((sum, mast) => sum + mast.area, 0);
  if (totalArea <= 0) {
    return 0;
  }
  let driven = 0;
  rig.forEach((mast, index) => {
    if (sailsSet[index] === false) {
      return;
    }
    driven += mast.area * sailEfficiency(mast.sail, relAngleDeg);
  });
  return driven / totalArea;
}

/** 강풍은 속력을 무한정 올리지 않는다. 일정선을 넘으면 축범으로 오히려 줄어든다. */
export function effectiveWindKnots(windSpeedKnots: number): number {
  if (windSpeedKnots <= REEFING_THRESHOLD_KNOTS) {
    return windSpeedKnots;
  }
  return Math.max(6, REEFING_THRESHOLD_KNOTS - (windSpeedKnots - REEFING_THRESHOLD_KNOTS) * 0.7);
}

export function conditionFactor(condition: SailingCondition): number {
  const hull = 0.45 + 0.55 * clamp(condition.hullRatio, 0, 1);
  const crew = 0.35 + 0.65 * clamp(condition.crewRatio, 0, 1);
  const fatigue = 1 - 0.35 * clamp(condition.fatigue, 0, 1);
  const discipline = 0.75 + 0.25 * clamp(condition.discipline, 0, 1);
  return hull * crew * fatigue * discipline;
}

export function computeSpeedKnots(options: {
  shipClass: ShipClass;
  rig: readonly MastSail[];
  sailsSet: readonly boolean[];
  relAngleDeg: number;
  windSpeedKnots: number;
  condition: SailingCondition;
}): number {
  const { shipClass, rig, sailsSet, relAngleDeg, windSpeedKnots, condition } = options;
  const thrust = rigThrust(rig, sailsSet, relAngleDeg);
  if (thrust <= 0) {
    return 0;
  }
  const windDrive = Math.sqrt(effectiveWindKnots(windSpeedKnots) / NOMINAL_WIND_KNOTS);
  const raw = shipClass.maxSpeedKnots * thrust * windDrive * conditionFactor(condition);
  return clamp(raw, 0, shipClass.maxSpeedKnots * 1.15);
}
