import { describe, expect, it } from "vite-plus/test";
import { createOrthographic } from "./orthographic";

function globe(centerLat = 0, centerLon = 0) {
  return createOrthographic({
    centerLat,
    centerLon,
    radiusPx: 300,
    minRadiusPx: 100,
    maxRadiusPx: 4000,
  });
}

describe("정사도법", () => {
  it("화면 중심은 시점 중심이다", () => {
    const view = globe(38, -9);
    const point = view.project({ lat: 38, lon: -9 });
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(0, 6);
    expect(point.visible).toBe(true);
  });

  it("지구 반대편은 보이지 않는다", () => {
    const view = globe(0, 0);
    expect(view.project({ lat: 0, lon: 180 }).visible).toBe(false);
    expect(view.project({ lat: 0, lon: 91 }).visible).toBe(false);
    expect(view.project({ lat: 0, lon: 89 }).visible).toBe(true);
  });

  it("동쪽은 오른쪽, 북쪽은 위쪽에 놓인다", () => {
    const view = globe(0, 0);
    expect(view.project({ lat: 0, lon: 30 }).x).toBeGreaterThan(0);
    expect(view.project({ lat: 0, lon: -30 }).x).toBeGreaterThan(-1e-9 - 300);
    expect(view.project({ lat: 0, lon: -30 }).x).toBeLessThan(0);
    // 캔버스 y는 아래로 증가한다. 북쪽이 위라면 y가 음수여야 한다.
    expect(view.project({ lat: 30, lon: 0 }).y).toBeLessThan(0);
    expect(view.project({ lat: -30, lon: 0 }).y).toBeGreaterThan(0);
  });

  it("가장자리는 반지름을 넘지 않는다", () => {
    const view = globe(20, 45);
    for (let lat = -90; lat <= 90; lat += 15) {
      for (let lon = -180; lon < 180; lon += 15) {
        const point = view.project({ lat, lon });
        expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(300.0001);
      }
    }
  });

  /** 클릭 지점을 위경도로 되돌릴 수 없으면 조작이 성립하지 않는다. */
  it("투영과 역투영이 서로를 되돌린다", () => {
    const view = globe(35, -20);
    for (const position of [
      { lat: 35, lon: -20 },
      { lat: 38.7, lon: -9.1 },
      { lat: 0, lon: 0 },
      { lat: -30, lon: -45 },
      { lat: 60, lon: 10 },
    ]) {
      const point = view.project(position);
      expect(point.visible).toBe(true);
      const back = view.invert(point.x, point.y);
      expect(back).not.toBeNull();
      expect(back!.lat).toBeCloseTo(position.lat, 6);
      expect(back!.lon).toBeCloseTo(position.lon, 6);
    }
  });

  it("지구 밖을 찍으면 아무 데도 아니다", () => {
    const view = globe();
    expect(view.invert(400, 0)).toBeNull();
    expect(view.invert(250, 250)).toBeNull();
    expect(view.invert(0, 0)).not.toBeNull();
  });

  it("회전은 극을 넘지 않고 경도는 감싼다", () => {
    const view = globe();
    view.rotateTo(120, 400);
    expect(view.centerLat).toBeLessThanOrEqual(89.9);
    expect(view.centerLon).toBeGreaterThanOrEqual(-180);
    expect(view.centerLon).toBeLessThanOrEqual(180);
  });

  it("확대는 한계 안에서만 움직인다", () => {
    const view = globe();
    view.zoomTo(10);
    expect(view.radiusPx).toBe(100);
    view.zoomTo(99999);
    expect(view.radiusPx).toBe(4000);
  });
});
