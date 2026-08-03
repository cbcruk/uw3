import type { LatLon } from "../../sim/geo/geo.types";
import type { Game } from "../../sim/world/world.types";

export interface MapViewOptions {
  canvas: HTMLCanvasElement;
  game: Game;
  /** 해도의 한 지점을 찍었다. 침로로 쓸지 목적지로 쓸지는 조타 모드가 정한다. */
  onChartPick: (target: LatLon) => void;
}

export interface MapView {
  render(track: readonly LatLon[]): void;
  /** 지구본을 그 지점이 정면에 오도록 돌린다. */
  lookAt(position: LatLon): void;
}

export interface MapPalette {
  fog: string;
  sea: string;
  land: string;
  coast: string;
  grid: string;
  track: string;
  ship: string;
  port: string;
  wind: string;
  destination: string;
  equator: string;
}
