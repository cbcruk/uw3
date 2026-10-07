import { MOUNT } from "../../content/game/mounts.tuning";
import { HOURS_PER_DAY } from "../../sim/calendar/calendar";
import type { LatLon } from "../../sim/geo/geo.types";
import { relativeWindAngle } from "../../sim/geo/geo.utils";
import { computeSpeedKnots } from "../../sim/ship/sail";
import type { SailingCondition, ShipClass } from "../../sim/ship/ship.types";
import { windAt } from "../../sim/wind/wind";
import { headingOf } from "../grid/direction";
import type { Direction } from "../grid/direction.types";
import type { LandTerrain, Terrain } from "../grid/world-grid.types";
import type { Conveyance, Mount } from "./travel.types";

/**
 * 선원·선체가 온전한 배. P1에는 보급·선원 상태가 없어서 컨디션 항을 1로 둔다.
 * P3에서 상태 벡터가 들어오면 이 상수가 사라진다 (SPEC-roguelike §5).
 */
const FRESH_SHIP: SailingCondition = { hullRatio: 1, crewRatio: 1, fatigue: 0, discipline: 1 };

const MOUNT_RANGE_NM: Readonly<Record<Mount, Readonly<Record<LandTerrain, number>>>> = {
  horse: { grassland: MOUNT.horseGrassland, desert: MOUNT.horseDesert },
  camel: { grassland: MOUNT.camelGrassland, desert: MOUNT.camelDesert },
};

export function canEnter(conveyance: Conveyance, terrain: Terrain): boolean {
  return conveyance === "ship" ? terrain === "sea" : terrain !== "sea";
}

/**
 * 이 칸에서 이 방향으로 하루에 갈 수 있는 해리.
 *
 * 배는 그날 그 자리의 바람과 돛 극곡선이 정한다 — 시뮬의 값을 그대로 쓰고 배율을
 * 곱하지 않는다 (R7). 무역풍을 등지면 빠르고 편서풍을 거스르면 서지 못한다.
 */
export function dailyRangeNm(options: {
  conveyance: Conveyance;
  terrain: Terrain;
  position: LatLon;
  dayNumber: number;
  dir: Direction;
  shipClass: ShipClass;
}): number {
  const { conveyance, terrain, position, dayNumber, dir, shipClass } = options;
  if (!canEnter(conveyance, terrain)) {
    return 0;
  }
  if (conveyance !== "ship") {
    return MOUNT_RANGE_NM[conveyance][terrain as LandTerrain];
  }
  const wind = windAt(position, dayNumber);
  const knots = computeSpeedKnots({
    shipClass,
    rig: shipClass.defaultRig,
    sailsSet: shipClass.defaultRig.map(() => true),
    relAngleDeg: relativeWindAngle(headingOf(dir), wind.fromDeg),
    windSpeedKnots: wind.speedKnots,
    condition: FRESH_SHIP,
  });
  return knots * HOURS_PER_DAY;
}
