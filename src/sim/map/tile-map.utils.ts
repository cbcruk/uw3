import type { LatLon } from "../geo/geo.types";

export function isPointInPolygon(point: LatLon, polygon: readonly LatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i] as LatLon;
    const b = polygon[j] as LatLon;
    const straddles = a.lat > point.lat !== b.lat > point.lat;
    if (!straddles) {
      continue;
    }
    const crossingLon = a.lon + ((point.lat - a.lat) / (b.lat - a.lat)) * (b.lon - a.lon);
    if (point.lon < crossingLon) {
      inside = !inside;
    }
  }
  return inside;
}

export function isPointOnAnyLand(point: LatLon, polygons: readonly (readonly LatLon[])[]): boolean {
  return polygons.some((polygon) => isPointInPolygon(point, polygon));
}
