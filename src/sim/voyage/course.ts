import { VOYAGE_TUNING as V } from "../../content/tuning/voyage.tuning";
import { advance } from "../geo/geo.utils";
import type { LatLon } from "../geo/geo.types";
import type { TileMap } from "../map/tile-map.types";
import type { CourseProjection } from "./course.types";

/**
 * 하루 항정을 타일보다 촘촘히 쪼갠다. 종점만 보면 좁은 해협과 곶을 통과해 버린다.
 * 하루 진행과 항해사 예측이 같은 보폭을 써야 예측이 실제와 어긋나지 않는다.
 */
/** 위도 1도는 60해리다. 물리 상수이므로 표에 두지 않는다. */
const MINUTES_PER_DEGREE = 60;

export function courseStepNm(tileMap: TileMap): number {
  return Math.max(
    V.courseStepFloorNm,
    tileMap.bounds.tileSize * MINUTES_PER_DEGREE * V.courseStepTileRatio,
  );
}

/** 부작용 없이 하루 항로를 따라가 본다. 항해사가 침로 후보를 고를 때 쓴다. */
export function projectCourse(
  from: LatLon,
  headingDeg: number,
  distanceNm: number,
  tileMap: TileMap,
): CourseProjection {
  const stepNm = courseStepNm(tileMap);
  const steps = Math.max(1, Math.ceil(distanceNm / stepNm));
  const legNm = distanceNm / steps;

  let end = from;
  let travelledNm = 0;

  for (let i = 0; i < steps; i += 1) {
    const next = advance(end, headingDeg, legNm);
    if (!tileMap.isNavigable(next)) {
      return { end, travelledNm, blocked: true };
    }
    end = next;
    travelledNm += legNm;
  }

  return { end, travelledNm, blocked: false };
}
