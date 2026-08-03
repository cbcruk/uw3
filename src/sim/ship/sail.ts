import { SAIL, SAIL_CURVES } from "../../content/tuning/sail.tuning";
import { clamp, lerp } from "../geo/geo.utils";
import type { MastSail, SailingCondition, SailType, ShipClass } from "./ship.types";

export function sailEfficiency(type: SailType, relAngleDeg: number): number {
  const curve = SAIL_CURVES[type].value;
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
  if (windSpeedKnots <= SAIL.reefingThresholdKnots) {
    return windSpeedKnots;
  }
  return Math.max(
    SAIL.reefedFloorKnots,
    SAIL.reefingThresholdKnots - (windSpeedKnots - SAIL.reefingThresholdKnots) * SAIL.reefingDecay,
  );
}

export function conditionFactor(condition: SailingCondition): number {
  const hull = SAIL.hullFloor + SAIL.hullRange * clamp(condition.hullRatio, 0, 1);
  const crew = SAIL.crewFloor + SAIL.crewRange * clamp(condition.crewRatio, 0, 1);
  const fatigue = 1 - SAIL.fatiguePenalty * clamp(condition.fatigue, 0, 1);
  const discipline =
    SAIL.disciplineFloor + SAIL.disciplineRange * clamp(condition.discipline, 0, 1);
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
  const windDrive = Math.sqrt(effectiveWindKnots(windSpeedKnots) / SAIL.nominalWindKnots);
  const raw = shipClass.maxSpeedKnots * thrust * windDrive * conditionFactor(condition);
  return clamp(raw, 0, shipClass.maxSpeedKnots * SAIL.overspeedFactor);
}
