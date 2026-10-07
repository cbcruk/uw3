import type { LandTerrain } from "../../game/grid/world-grid.types";

/**
 * 지형 구역. 사각형으로 손저작했다 — 해안선과 달리 기후대에는 번들할 실측 자료가 아직 없다.
 * 실측 래스터로 바꾸는 순간 Content가 아니라 Shape 변경이다 (SPEC-roguelike §3).
 */
export interface TerrainZone {
  id: string;
  name: string;
  terrain: LandTerrain;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
