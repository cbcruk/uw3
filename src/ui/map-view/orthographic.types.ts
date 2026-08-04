import type { LatLon } from "../../sim/geo/geo.types";

export interface ScreenPoint {
  /** 지구 중심 기준 픽셀 오프셋. 화면 좌표는 여기에 중심을 더해 만든다. */
  x: number;
  y: number;
  /** 지구 반대편이면 false. 그리면 안 된다. */
  visible: boolean;
}

export interface OrthographicOptions {
  centerLat: number;
  centerLon: number;
  radiusPx: number;
  minRadiusPx: number;
  maxRadiusPx: number;
}

export interface Orthographic {
  readonly centerLat: number;
  readonly centerLon: number;
  readonly radiusPx: number;
  rotateTo(lat: number, lon: number): void;
  zoomTo(radiusPx: number): void;
  project(position: LatLon): ScreenPoint;
  /** 지구 밖을 찍으면 null. */
  invert(x: number, y: number): LatLon | null;
}
