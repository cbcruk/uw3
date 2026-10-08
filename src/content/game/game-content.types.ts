import type { LandTerrain, Terrain } from "../../game/grid/world-grid.types";
import type { Conveyance } from "../../game/travel/travel.types";

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

/** 조우 종류의 식별자. 밀도 표(`encounters.tuning.ts`)의 키와 같다. */
export type EncounterKindId = "pirate" | "bandit" | "beast";

/**
 * 조우 종류. 어느 지형에 나오고 머릿수가 얼마인가.
 *
 * 머릿수는 전투(P3d)의 승원 판정에 쓰인다. 범위는 배·말 표처럼 Content로 손저작했다.
 */
export interface EncounterKind {
  id: EncounterKindId;
  name: string;
  terrains: readonly Terrain[];
  crewMin: number;
  crewMax: number;
  /**
   * 움직이는 수단. 여럿이면 칸마다 더 빠른 쪽을 쓴다 — 도적은 초지에서 말, 사막에서 낙타다.
   * 늑대는 말의 행정을 빌린다. 짐승 행정 표를 따로 만들 만큼 차이가 의미 있지 않다.
   */
  conveyances: readonly Conveyance[];
  /** 배로 움직이는 종류의 선형. 바람을 받는 방식이 선형마다 다르다. 뭍의 종류는 없다. */
  shipClassId?: string;
}
