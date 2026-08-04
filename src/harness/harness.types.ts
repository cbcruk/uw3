import type { LatLon } from "../sim/geo/geo.types";
import type { VoyageReference } from "../sim/voyage/logbook.types";

/**
 * 측정 항로. 같은 출발·도착을 **어떻게 가는가**만 다르다.
 *
 * 경유점은 튜닝 값이 아니라 **비교 조건**이다 — SPEC 3.3의 대조표를 다시 돌리기
 * 위한 설정이고, 바꾸면 "다른 것을 측정한 것"이지 "같은 것을 더 잘 맞춘 것"이
 * 아니다. 그래서 표(`content/tuning/`)가 아니라 여기 있다.
 */
export interface Route {
  id: string;
  label: string;
  /** 목적지 전에 들를 지점들. 비어 있으면 직항이다. */
  waypoints: readonly LatLon[];
}

export interface Scenario {
  /** `content/voyages.ts`의 재현 항해 id. */
  voyageId: string;
  routes: readonly Route[];
  seeds: readonly number[];
}

/** 한 번의 항해 결과. 시드 하나에 하나씩 나온다. */
export interface RunOutcome {
  seed: number;
  arrived: boolean;
  days: number;
  distanceNm: number;
  detourRatio: number;
  southmostLat: number;
  stalledDays: number;
  hazardDays: number;
  /** 도달하지 못했다면 왜인지. 도달했으면 null. */
  failure: string | null;
}

export interface Stat {
  median: number;
  min: number;
  max: number;
}

export interface RouteResult {
  route: Route;
  outcomes: readonly RunOutcome[];
  /** 목적지에 닿은 시드의 비율. 0이면 아래 통계는 의미가 없다. */
  arrivalRate: number;
  /** 도달한 시드만으로 낸 통계. 하나도 못 닿았으면 null. */
  days: Stat | null;
  distanceNm: Stat | null;
  southmostLat: Stat | null;
  stalledDays: Stat | null;
}

/**
 * 사료 대조. `reference.days`가 null이면 **오차를 내지 않는다** (SHAPE G2).
 * 없는 기준선에 대고 0을 적으면 대조가 완벽한 것처럼 보인다.
 */
export interface FidelityError {
  referenceDays: number | null;
  simulatedDays: number | null;
  /** |시뮬 − 사료|. 둘 중 하나라도 없으면 null. */
  absDays: number | null;
  comparable: boolean;
  note: string;
}

export interface ScenarioResult {
  voyageId: string;
  voyageName: string;
  lesson: string;
  routes: readonly RouteResult[];
  /** 사료 대조. 기준선이 있는 항해에서만 수가 나온다. */
  fidelity: FidelityError;
  reference: VoyageReference;
  /**
   * 우회의 이점 (일). 직항 소요 − 가장 빠른 우회 소요.
   *
   * **이것이 SPEC 3.3의 결함 지표다.** 양수가 클수록 볼타 두 마르가 재현된
   * 것이고, 0에 가까우면 직항이 그만큼 싸다는 뜻이다. 압류(P9)를 넣으면
   * 이 수가 움직여야 한다. 안 움직이면 원인은 압류가 아니었던 것이다.
   */
  detourAdvantageDays: number | null;
  fastestRouteId: string | null;
}
