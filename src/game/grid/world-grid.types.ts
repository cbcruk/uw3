import type { LatLon } from "../../sim/geo/geo.types";
import type { Direction } from "./direction.types";

/** 칸 하나의 지형. 칸마다 하나다 — 혼합 지형은 다른 구조다 (SPEC-roguelike R1). */
export type Terrain = "sea" | "grassland" | "desert";

export type LandTerrain = Exclude<Terrain, "sea">;

/** 격자 칸. `x`는 경도 방향이라 순환하고, `y`는 북에서 남으로 는다. */
export interface Cell {
  x: number;
  y: number;
}

/**
 * 메르카토르 세계 격자. 지형은 시뮬의 육지 마스크에서 파생한다 (R2).
 *
 * 칸의 지형은 그 칸이 속한 영역을 처음 물을 때 굽는다 (R4).
 */
export interface WorldGrid {
  width: number;
  height: number;
  /** 칸 한 변의 경도 폭. 메르카토르라 행 높이도 같은 각도다. */
  cellDeg: number;
  /** 격자 밖(극 쪽)이면 `null`. */
  terrainAt(cell: Cell): Terrain | null;
  /** 정박지가 이 칸에 있는 항구. */
  portAt(cell: Cell): string | null;
  cellOfPort(portId: string): Cell | null;
  cellCenter(cell: Cell): LatLon;
  cellOf(position: LatLon): Cell | null;
  /** 경도 순환을 반영한 이웃. 격자 밖이면 `null`. */
  neighbor(cell: Cell, dir: Direction): Cell | null;
  /** 이웃 칸으로 한 걸음의 실제 거리. 이동 비용은 칸 수가 아니라 해리다 (R3). */
  stepNm(from: Cell, dir: Direction): number;
  /** 지금까지 구운 영역 수. 영역을 지연해서 굽는지 테스트가 본다. */
  bakedRegionCount(): number;
}
