/**
 * 원정이 잃을 수 있는 것. 시뮬의 `VoyageState`에서 넷만 남겼다 (SPEC-roguelike §11).
 *
 * 식량·물의 단위는 시뮬과 같다 — 1 = 한 사람의 하루치.
 */
export interface Supplies {
  crew: number;
  food: number;
  water: number;
  hull: number;
  hullMax: number;
  /** 식량·물을 채울 수 있는 상한. 배의 적재량에서 정해진다. */
  capacity: number;
}

/** 원정이 끝난 이유. 귀항(성공)은 P4의 목표 항구와 함께 들어온다. */
export type ExpeditionEnd = "crew-lost" | "hull-lost";

/** 하루치 소모의 결과. 화면 로그가 쓴다. */
export interface RationReport {
  lost: number;
  starving: boolean;
  thirsty: boolean;
}
