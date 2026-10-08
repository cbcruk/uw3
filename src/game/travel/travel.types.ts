export type Mount = "horse" | "camel";

/** 지금 타고 있는 것. 하나뿐이다 — 배에서 내리면 배는 항구에 남는다 (SPEC-roguelike R6). */
export type Conveyance = "ship" | Mount;

/** 한 방향으로 하루에 나아가는 정도. */
export interface Passage {
  /**
   * 그 방향으로 실제로 줄어드는 거리(해리/일). 해류의 나란한 몫까지 더했다.
   * 태킹이면 지그재그한 항정이 아니라 전진분이다. 역류가 더 세면 0이다.
   */
  rangeNm: number;
  /** 돛만의 몫. 0이면 무풍이고, 이것은 있는데 `rangeNm`이 0이면 역류에 막힌 것이다. */
  sailRangeNm: number;
  /** 곧장 겨누면 돛이 바람을 못 받아 지그재그로 간다. */
  tacking: boolean;
}
