import { describe, expect, it } from "vite-plus/test";
import { latitudeOfMercatorY, mercatorY } from "./mercator.utils";
import {
  advance,
  angleDifference,
  bearingDeg,
  haversineNm,
  latLonToTile,
  normalizeHeading,
  relativeWindAngle,
  tileCenter,
} from "./geo.utils";
import type { MapBounds } from "./geo.types";

const BOUNDS: MapBounds = {
  minLat: 28,
  maxLat: 46,
  minLon: -14,
  maxLon: 10,
  tileSize: 0.125,
};

describe("normalizeHeading", () => {
  it("0 이상 360 미만으로 정규화한다", () => {
    expect(normalizeHeading(370)).toBeCloseTo(10);
    expect(normalizeHeading(-90)).toBeCloseTo(270);
    expect(normalizeHeading(360)).toBeCloseTo(0);
  });
});

describe("angleDifference", () => {
  it("최단 방향 부호차를 낸다", () => {
    expect(angleDifference(10, 350)).toBeCloseTo(20);
    expect(angleDifference(350, 10)).toBeCloseTo(-20);
  });
});

describe("relativeWindAngle", () => {
  it("맞바람은 0도, 뒷바람은 180도", () => {
    expect(relativeWindAngle(0, 0)).toBeCloseTo(0);
    expect(relativeWindAngle(0, 180)).toBeCloseTo(180);
    expect(relativeWindAngle(90, 180)).toBeCloseTo(90);
  });
});

describe("advance", () => {
  it("정북으로 60해리는 위도 1도", () => {
    const next = advance({ lat: 40, lon: -9 }, 0, 60);
    expect(next.lat).toBeCloseTo(41, 2);
    expect(next.lon).toBeCloseTo(-9, 4);
  });

  /** SPEC 8.2: 위도가 높을수록 같은 거리의 경도 변화가 커진다. */
  it("고위도에서 동서 이동의 경도 변화가 더 크다", () => {
    const atEquator = advance({ lat: 0, lon: 0 }, 90, 60);
    const atSixty = advance({ lat: 60, lon: 0 }, 90, 60);
    expect(atEquator.lon).toBeCloseTo(1, 2);
    expect(atSixty.lon).toBeGreaterThan(1.9);
  });

  it("이동 거리가 하버사인 거리와 일치한다", () => {
    const from = { lat: 38.71, lon: -9.14 };
    const to = advance(from, 225, 120);
    expect(haversineNm(from, to)).toBeCloseTo(120, 0);
  });
});

describe("bearingDeg", () => {
  /** 같은 위도의 동쪽 지점이라도 대권 초기방위는 90도보다 약간 북쪽이다. */
  it("정동쪽 지점의 방위는 90도 바로 아래다", () => {
    const bearing = bearingDeg({ lat: 36, lon: -6 }, { lat: 36, lon: -4 });
    expect(bearing).toBeGreaterThan(89);
    expect(bearing).toBeLessThan(90);
  });

  it("정북쪽 지점의 방위는 0도다", () => {
    expect(bearingDeg({ lat: 36, lon: -6 }, { lat: 38, lon: -6 })).toBeCloseTo(0, 4);
  });
});

describe("타일 변환", () => {
  it("타일 중심의 왕복 변환이 같은 타일로 돌아온다", () => {
    const tile = { x: 40, y: 55 };
    const center = tileCenter(BOUNDS, tile);
    expect(latLonToTile(BOUNDS, center)).toEqual(tile);
  });

  it("북서 모서리가 (0, 0) 타일이다", () => {
    expect(latLonToTile(BOUNDS, { lat: 45.99, lon: -13.99 })).toEqual({ x: 0, y: 0 });
  });
});

describe("메르카토르", () => {
  it("적도는 0이고 위도와 왕복한다", () => {
    expect(mercatorY(0)).toBeCloseTo(0, 12);
    for (const lat of [-70, -30, 15, 45, 75]) {
      expect(latitudeOfMercatorY(mercatorY(lat))).toBeCloseTo(lat, 9);
    }
  });
});
