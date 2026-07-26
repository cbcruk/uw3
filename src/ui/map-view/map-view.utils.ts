import type { LatLon, MapBounds } from "../../sim/geo/geo.types";
import type { MapPalette } from "./map-view.types";

export const MAP_PALETTE: MapPalette = {
  fog: "#05090f",
  sea: "#123049",
  land: "#4a5340",
  coast: "#727a5c",
  grid: "#ffffff10",
  track: "#e8c88866",
  ship: "#f5e6c8",
  port: "#e0a83c",
  wind: "#7fb3d5",
};

export interface Projection {
  scale: number;
  toCanvas(position: LatLon): { x: number; y: number };
  toLatLon(x: number, y: number): LatLon;
}

export function createProjection(bounds: MapBounds, widthPx: number): Projection {
  const scale = widthPx / (bounds.maxLon - bounds.minLon);
  return {
    scale,
    toCanvas(position: LatLon): { x: number; y: number } {
      return {
        x: (position.lon - bounds.minLon) * scale,
        y: (bounds.maxLat - position.lat) * scale,
      };
    },
    toLatLon(x: number, y: number): LatLon {
      return {
        lon: bounds.minLon + x / scale,
        lat: bounds.maxLat - y / scale,
      };
    },
  };
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  headingDeg: number,
  size: number,
  color: string,
): void {
  const radians = ((headingDeg - 90) * Math.PI) / 180;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(radians);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, size * 0.62);
  ctx.lineTo(-size * 0.35, 0);
  ctx.lineTo(-size * 0.7, -size * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
