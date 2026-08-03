import type { GridSize, LatLon, MapBounds, TileCoord } from "./geo.types";

export const EARTH_RADIUS_NM = 3440.065;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * 1도 = 60분이고 1분 = 1해리다. 좌표계의 **정의**이지 조정 가능한 값이 아니다 —
 * 표에 넣을 수 없는 종류의 수다.
 */
export const NM_PER_DEGREE = 60;

/** 정반대 방위. 바람이 불어오는 쪽에서 흘러가는 쪽을 얻을 때 쓴다. */
export const OPPOSITE_DEG = 180;

/** 한 바퀴. */
export const FULL_TURN_DEG = 360;

const COMPASS_POINTS = 8;

/**
 * 8방위 인덱스. 방위**명**은 쓰는 쪽이 붙인다 — 바람은 "서풍"이 서에서 오는 것이고
 * 해류는 "남향류"가 남으로 가는 것이다 (SPEC 6.2). 규약이 반대라 이름은 공유하지 않는다.
 */
export function compassIndex(deg: number): number {
  const step = 360 / COMPASS_POINTS;
  return Math.round(normalizeHeading(deg) / step) % COMPASS_POINTS;
}

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
  const deltaLat = (distanceNm * Math.cos(heading)) / NM_PER_DEGREE;
  const midLat = toRadians(from.lat + deltaLat / 2);
  const lonScale = Math.max(Math.cos(midLat), 1e-4);
  const deltaLon = (distanceNm * Math.sin(heading)) / (NM_PER_DEGREE * lonScale);
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

/**
 * 방위를 벡터로 바꿔 섞는다. 각도를 그냥 보간하면 359°와 1° 사이에서 한 바퀴를
 * 거꾸로 돈다 — 경계에서 항적이 튄다.
 */
export function blendHeadings(a: number, b: number, t: number): number {
  const ar = toRadians(a);
  const br = toRadians(b);
  const x = lerp(Math.cos(ar), Math.cos(br), t);
  const y = lerp(Math.sin(ar), Math.sin(br), t);
  return normalizeHeading(toDegrees(Math.atan2(y, x)));
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
