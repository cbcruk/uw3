export type Mount = "horse" | "camel";

/** 지금 타고 있는 것. 하나뿐이다 — 배에서 내리면 배는 항구에 남는다 (SPEC-roguelike R6). */
export type Conveyance = "ship" | Mount;
