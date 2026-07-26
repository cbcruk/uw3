import type { LatLon } from "../../sim/geo/geo.types";
import type { Game } from "../../sim/world/world.types";

export interface MapViewOptions {
  canvas: HTMLCanvasElement;
  game: Game;
  onCourseSet: (headingDeg: number) => void;
}

export interface MapView {
  render(track: readonly LatLon[]): void;
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
