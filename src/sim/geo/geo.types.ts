export interface LatLon {
  lat: number;
  lon: number;
}

export interface TileCoord {
  x: number;
  y: number;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  tileSize: number;
}

export interface GridSize {
  width: number;
  height: number;
}
