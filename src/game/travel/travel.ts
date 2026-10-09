import { MOUNT, MOUNT_WATER } from '../../content/game/mounts.tuning'
import { HOURS_PER_DAY } from '../../sim/calendar/calendar'
import type { LatLon } from '../../sim/geo/geo.types'
import {
  FULL_TURN_DEG,
  angleDifference,
  relativeWindAngle,
  toRadians,
} from '../../sim/geo/geo.utils'
import { leewayTrackDeg } from '../../sim/ship/leeway'
import { computeSpeedKnots } from '../../sim/ship/sail'
import type { SailingCondition, ShipClass } from '../../sim/ship/ship.types'
import { windAt } from '../../sim/wind/wind'
import { headingOf } from '../grid/direction'
import type { Direction } from '../grid/direction.types'
import type { LandTerrain, Terrain } from '../grid/world-grid.types'
import { currentAlongKnots, currentKnots } from './drift'
import type { Conveyance, Mount, Passage } from './travel.types'

/**
 * 선원·선체가 온전한 배. P1에는 보급·선원 상태가 없어서 컨디션 항을 1로 둔다.
 * P3에서 상태 벡터가 들어오면 이 상수가 사라진다 (SPEC-roguelike §5).
 */
const FRESH_SHIP: SailingCondition = { hullRatio: 1, crewRatio: 1, fatigue: 0, discipline: 1 }

/**
 * 태킹 침로 후보 간격. 시뮬 항해사(`navigator.ts`)와 같은 값이다 — 5°면 클로스홀드 각을
 * 놓치지 않는다. 계산 해상도라 표에 두지 않는다.
 */
const HEADING_STEP_DEG = 5

const MOUNT_RANGE_NM: Readonly<Record<Mount, Readonly<Record<LandTerrain, number>>>> = {
  horse: { grassland: MOUNT.horseGrassland, desert: MOUNT.horseDesert },
  camel: { grassland: MOUNT.camelGrassland, desert: MOUNT.camelDesert },
}

/** 바다·초지의 물 소모. 한 사람의 하루치가 1이다. */
const BASE_WATER_RATIO = 1

/**
 * 이 탈것으로 이 지형에 있을 때 한 사람의 하루 물 소모 배율 (R68). 사막의 말·낙타만 1이 아니다.
 *
 * 탈것이 마시는 몫까지 사람 머릿수에 얹은 배율이다 — 말과 낙타의 물을 따로 세지 않는다.
 */
export function waterRatio(conveyance: Conveyance, terrain: Terrain | null): number {
  if (terrain !== 'desert' || conveyance === 'ship') {
    return BASE_WATER_RATIO
  }
  return conveyance === 'horse' ? MOUNT_WATER.horseDesertWater : MOUNT_WATER.camelDesertWater
}

export function canEnter(conveyance: Conveyance, terrain: Terrain): boolean {
  return conveyance === 'ship' ? terrain === 'sea' : terrain !== 'sea'
}

/**
 * 이 칸에서 이 방향으로 하루에 얼마나 나아가는가.
 *
 * 배는 그 방향을 곧장 겨누지 않는다. 모든 침로를 재서 **그 방향으로 가장 빨리 다가가는
 * 침로**를 고른다 — 맞바람이면 그것이 태킹이다. 지그재그는 칸 하나 안에서 일어난 것으로
 * 친다. 칸 한 변(위도 38°에서 약 12해리)이 카라벨의 한 번 꺾는 거리보다 넓어서, 폭 1칸
 * 수로에서도 역풍을 거슬러 갈 수 있다 (SPEC-roguelike §8).
 *
 * 압류를 넣는다. 클로스홀드에서 풍하로 밀려 태킹 손실이 커진다 (시뮬 P9). 해류는 그 방향과
 * 나란한 몫만 더한다 — 수직인 몫은 옆으로 미는 편류로 따로 쌓인다 (`drift.ts`).
 * 바람·돛·압류·해류 모두 시뮬의 값을 그대로 쓰고 배율을 곱하지 않는다 (R7).
 */
export function passageToward(options: {
  conveyance: Conveyance
  terrain: Terrain
  position: LatLon
  dayNumber: number
  dir: Direction
  shipClass: ShipClass
}): Passage {
  const { conveyance, terrain, position, dayNumber, dir, shipClass } = options
  if (!canEnter(conveyance, terrain)) {
    return { rangeNm: 0, sailRangeNm: 0, tacking: false }
  }
  if (conveyance !== 'ship') {
    const rangeNm = MOUNT_RANGE_NM[conveyance][terrain as LandTerrain]
    return { rangeNm, sailRangeNm: rangeNm, tacking: false }
  }
  const wind = windAt(position, dayNumber)
  const target = headingOf(dir)
  const sailKnots = (headingDeg: number): number =>
    computeSpeedKnots({
      shipClass,
      rig: shipClass.defaultRig,
      sailsSet: shipClass.defaultRig.map(() => true),
      relAngleDeg: relativeWindAngle(headingDeg, wind.fromDeg),
      windSpeedKnots: wind.speedKnots,
      condition: FRESH_SHIP,
    })

  let bestKnots = 0
  for (let heading = 0; heading < FULL_TURN_DEG; heading += HEADING_STEP_DEG) {
    const knots = sailKnots(heading)
    const track = leewayTrackDeg(heading, wind.fromDeg, wind.speedKnots, knots)
    const made = knots * Math.cos(toRadians(angleDifference(track, target)))
    bestKnots = Math.max(bestKnots, made)
  }
  const along = currentAlongKnots(currentKnots(position), dir)
  return {
    rangeNm: Math.max(0, bestKnots + along) * HOURS_PER_DAY,
    sailRangeNm: bestKnots * HOURS_PER_DAY,
    tacking: bestKnots > 0 && sailKnots(target) <= 0,
  }
}

/** {@linkcode passageToward}의 하루 행정만. */
export function dailyRangeNm(options: Parameters<typeof passageToward>[0]): number {
  return passageToward(options).rangeNm
}
