import type { DayReport } from "./voyage.types";

/**
 * 항해를 멈추는 이유. 플레이어가 다시 판단해야 하는 순간만 여기에 들어간다.
 * 나머지 날은 항해사가 알아서 간다.
 */
export type PassageStop =
  | "arrived"
  | "docked"
  | "hazard"
  | "warning"
  | "beating"
  | "blocked"
  | "supply"
  | "stuck"
  | "ended"
  | "max-days";

export interface PassageOptions {
  /** 한 번의 명령으로 진행할 최대 일수. */
  maxDays: number;
  /** 목적지 도달로 인정할 반경. */
  arrivalRangeNm: number;
  /** 이 일수 아래로 보급이 떨어지면 멈춘다. */
  supplyDaysFloor: number;
}

export interface PassageResult {
  days: number;
  reports: readonly DayReport[];
  stop: PassageStop;
  /** 멈춘 이유를 그대로 항해일지에 적는다. */
  summary: string;
}
