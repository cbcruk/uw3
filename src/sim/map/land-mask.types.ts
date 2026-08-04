import type { LatLon } from "../geo/geo.types";

/** [경도, 위도] 순서. GeoJSON 관례를 그대로 따른다. */
export type LandPoint = readonly [number, number];

/** 외곽 링 + 구멍 링들. */
export type LandPolygon = readonly (readonly LandPoint[])[];

export type RingBucket = [LandPoint, LandPoint][];

export interface LandMask {
  /** 1도당 셀 수. 해상도를 정하는 유일한 손잡이. */
  cellsPerDegree: number;
  width: number;
  height: number;
  /** 셀당 1비트로 채운 비트셋. */
  mask: Uint32Array;
  isLand(position: LatLon): boolean;
}
