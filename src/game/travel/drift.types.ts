import type { Cell } from "../grid/world-grid.types";

/** 동·북 성분 벡터. 단위는 쓰는 곳마다 다르다 (노트 또는 해리). */
export interface EastNorth {
  east: number;
  north: number;
}

export interface DriftResult {
  cell: Cell;
  /** 칸 중심에서 벗어난 거리(해리). 각 성분은 칸 한 변의 ±절반 안이다. */
  offsetNm: EastNorth;
  /** 밀려서 거쳐 간 칸. 순서대로. */
  pushedThrough: Cell[];
}
