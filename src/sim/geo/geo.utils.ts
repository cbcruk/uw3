import type { GridSize, LatLon, MapBounds, TileCoord } from "./geo.types";

export const EARTH_RADIUS_NM = 3440.065;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

export function toDegrees(radians: number): number {
  return radians * RAD_TO_DEG;
}

export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function angleDifference(a: number, b: number): number {
  const diff = normalizeHeading(a - b);
  return diff > 180 ? diff - 360 : diff;
}

export function relativeWindAngle(headingDeg: number, windFromDeg: number): number {
  return Math.abs(angleDifference(headingDeg, windFromDeg));
}

export function haversineNm(from: LatLon, to: LatLon): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_NM * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingDeg(from: LatLon, to: LatLon): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return normalizeHeading(toDegrees(Math.atan2(y, x)));
}

export function advance(from: LatLon, headingDeg: number, distanceNm: number): LatLon {
  const heading = toRadians(headingDeg);
  const deltaLat = (distanceNm * Math.cos(heading)) / 60;
  const midLat = toRadians(from.lat + deltaLat / 2);
  const lonScale = Math.max(Math.cos(midLat), 1e-4);
  const deltaLon = (distanceNm * Math.sin(heading)) / (60 * lonScale);
  return {
    lat: clamp(from.lat + deltaLat, -89.9, 89.9),
    lon: wrapLongitude(from.lon + deltaLon),
  };
}

export function wrapLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function gridSizeOf(bounds: MapBounds): GridSize {
  return {
    width: Math.round((bounds.maxLon - bounds.minLon) / bounds.tileSize),
    height: Math.round((bounds.maxLat - bounds.minLat) / bounds.tileSize),
  };
}

export function latLonToTile(bounds: MapBounds, position: LatLon): TileCoord {
  return {
    x: Math.floor((position.lon - bounds.minLon) / bounds.tileSize),
    y: Math.floor((bounds.maxLat - position.lat) / bounds.tileSize),
  };
}

export function tileCenter(bounds: MapBounds, tile: TileCoord): LatLon {
  return {
    lat: bounds.maxLat - (tile.y + 0.5) * bounds.tileSize,
    lon: bounds.minLon + (tile.x + 0.5) * bounds.tileSize,
  };
}

export function isInsideBounds(bounds: MapBounds, position: LatLon): boolean {
  return (
    position.lat >= bounds.minLat &&
    position.lat <= bounds.maxLat &&
    position.lon >= bounds.minLon &&
    position.lon <= bounds.maxLon
  );
}

export function tileIndex(size: GridSize, tile: TileCoord): number {
  return tile.y * size.width + tile.x;
}

export function isTileInside(size: GridSize, tile: TileCoord): boolean {
  return tile.x >= 0 && tile.y >= 0 && tile.x < size.width && tile.y < size.height;
}
