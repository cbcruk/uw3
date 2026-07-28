import type { LatLon } from "../../sim/geo/geo.types";
import type { Game } from "../../sim/world/world.types";

export interface MapViewOptions {
  canvas: HTMLCanvasElement;
  game: Game;
  onCourseSet: (headingDeg: number) => void;
  /** 초기 안개 표시 여부. 기본 true. */
  fog?: boolean;
}

export interface MapView {
  render(track: readonly LatLon[]): void;
  /** 안개 표시만 켜고 끈다. 탐사 상태는 건드리지 않는다. */
  setFog(enabled: boolean): void;
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
}
