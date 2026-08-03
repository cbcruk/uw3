import { describe, expect, it } from "vite-plus/test";
import { PORTS, PORT_ANCHORAGES } from "../../content/ports";
import { LAND_POLYGONS } from "../../content/world-land";
import { ROUTE_CELLS_PER_DEGREE } from "./land-mask.const";
import { findSeaRoute } from "./sea-route";
import { createTileMap } from "./tile-map";

/** 도달성 검사는 항로 격자로 한다. 실제 자동 항해가 쓰는 격자와 같아야 의미가 있다. */
const tileMap = createTileMap({
  polygons: LAND_POLYGONS,
  cellsPerDegree: ROUTE_CELLS_PER_DEGREE,
  navigableAnchorages: PORT_ANCHORAGES,
});

describe("createTileMap", () => {
  it("실제 대륙 내륙은 육지다", () => {
    expect(tileMap.isNavigable({ lat: 40.4, lon: -3.7 })).toBe(false);
    expect(tileMap.isNavigable({ lat: 25.0, lon: 5.0 })).toBe(false);
    expect(tileMap.isNavigable({ lat: -5.0, lon: -60.0 })).toBe(false);
    expect(tileMap.isNavigable({ lat: 45.0, lon: 100.0 })).toBe(false);
  });

  it("대양은 항해 가능하다", () => {
    expect(tileMap.isNavigable({ lat: 30.0, lon: -40.0 })).toBe(true);
    expect(tileMap.isNavigable({ lat: 0.0, lon: -160.0 })).toBe(true);
    expect(tileMap.isNavigable({ lat: -40.0, lon: 80.0 })).toBe(true);
  });

  it("격자는 지구 전체를 덮는다", () => {
    expect(tileMap.bounds.minLat).toBe(-90);
    expect(tileMap.bounds.maxLat).toBe(90);
    expect(tileMap.size.width).toBe(360 * ROUTE_CELLS_PER_DEGREE);
    expect(tileMap.size.height).toBe(180 * ROUTE_CELLS_PER_DEGREE);
  });

  it("경도는 날짜변경선을 넘어 이어진다", () => {
    const east = tileMap.isLandTile({ x: 0, y: 100 });
    expect(tileMap.isLandTile({ x: tileMap.size.width, y: 100 })).toBe(east);
    expect(tileMap.isLandTile({ x: -tileMap.size.width, y: 100 })).toBe(east);
  });

  /**
   * 항구가 외해와 이어지지 않으면 출항 자체가 불가능하다. 두 번 겪은 문제다 —
   * 손으로 그린 해안선에서 한 번, 실제 데이터의 하구 해상도에서 한 번.
   */
  it("모든 항구의 정박지가 외해에서 닿는다", () => {
    const openSea = { lat: 30, lon: -40 };

    for (const port of PORTS) {
      expect(tileMap.isNavigable(port.anchorage)).toBe(true);
      expect(findSeaRoute(tileMap, openSea, port.anchorage)).not.toBeNull();
    }
  });
});
