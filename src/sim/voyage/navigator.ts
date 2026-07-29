import type { LatLon } from "../geo/geo.types";
import { bearingDeg, haversineNm, normalizeHeading, relativeWindAngle } from "../geo/geo.utils";
import { findSeaRoute } from "../map/sea-route";
import type { TileMap } from "../map/tile-map.types";
import { computeSpeedKnots } from "../ship/sail";
import { windAt } from "../wind/wind";
import { projectCourse } from "./course";
import type { NavigatorPlan } from "./navigator.types";
import { sailingCondition } from "./voyage";
import type { VoyageContext, VoyageState } from "./voyage.types";

/** 침로 후보 간격. 5°면 태킹 각을 놓치지 않으면서 하루치 계산이 수십 회에 그친다. */
const CANDIDATE_STEP_DEG = 5;
const HOURS_PER_DAY = 24;

/**
 * 경로에서 지금 위치에서 곧장 갈 수 있는 가장 먼 지점을 고른다.
 * 외해에서는 목적지를 직접 겨누고, 곶 앞에서는 모퉁이만 겨눈다.
 */
function aimPoint(from: LatLon, route: readonly LatLon[], tileMap: TileMap): LatLon {
  for (let i = route.length - 1; i > 0; i -= 1) {
    const candidate = route[i] as LatLon;
    const rangeNm = haversineNm(from, candidate);
    const sight = projectCourse(from, bearingDeg(from, candidate), rangeNm, tileMap);
    if (!sight.blocked) {
      return candidate;
    }
  }
  return (route[route.length - 1] ?? from) as LatLon;
}

/**
 * 항해사. 목적지까지 그 날 가장 많이 다가서는 침로를 고른다.
 *
 * 매일 태킹 각을 손으로 재는 것은 선장의 일이 아니다 (SPEC 5 — 헤매기는 UX 문제).
 * 난이도는 보급·계절·회항 판단에 남기고, 조타는 항해사에게 넘긴다.
 *
 * 부작용도 난수도 없다. 같은 상태에서는 항상 같은 침로가 나온다 (SPEC 8.1).
 */
export function planHeading(
  state: VoyageState,
  context: VoyageContext,
  destination: LatLon,
): NavigatorPlan | null {
  const route = findSeaRoute(context.tileMap, state.position, destination);
  if (route === null) {
    return null;
  }
  const aim = aimPoint(state.position, route, context.tileMap);

  const wind = windAt(state.position, state.day);
  const condition = sailingCondition(state, context.shipClass.crewMin);
  const startRangeNm = haversineNm(state.position, aim);

  let best: NavigatorPlan | null = null;

  for (let offset = 0; offset < 360; offset += CANDIDATE_STEP_DEG) {
    const headingDeg = normalizeHeading(offset);
    const speedKnots = computeSpeedKnots({
      shipClass: context.shipClass,
      rig: state.rig,
      sailsSet: state.sailsSet,
      relAngleDeg: relativeWindAngle(headingDeg, wind.fromDeg),
      windSpeedKnots: wind.speedKnots,
      condition,
    });
    if (speedKnots <= 0) {
      continue;
    }

    const projection = projectCourse(
      state.position,
      headingDeg,
      speedKnots * HOURS_PER_DAY,
      context.tileMap,
    );
    if (projection.travelledNm <= 0) {
      continue;
    }

    const gainNm = startRangeNm - haversineNm(projection.end, aim);
    if (best === null || gainNm > best.gainNm) {
      best = { headingDeg, gainNm, speedKnots, blocked: projection.blocked };
    }
  }

  // 이득이 없는 침로도 돌려준다. 바람이 막힌 해안에서는 하루이틀 바다 쪽으로
  // 여유를 벌어야 다음 태킹이 열린다. 언제 포기할지는 구간 항해가 판단한다.
  return best;
}
