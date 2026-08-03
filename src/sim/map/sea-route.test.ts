import { describe, expect, it } from "vite-plus/test";
import { PORT_ANCHORAGES, findPort } from "../../content/ports";
import { LAND_POLYGONS } from "../../content/world-land";
import type { TileCoord } from "../geo/geo.types";
import { tileCenter } from "../geo/geo.utils";
import { ROUTE_CELLS_PER_DEGREE } from "./land-mask.const";
import { createTileMap } from "./tile-map";
import { findSeaRoute } from "./sea-route";

const tileMap = createTileMap({
  polygons: LAND_POLYGONS,
  cellsPerDegree: ROUTE_CELLS_PER_DEGREE,
  navigableAnchorages: PORT_ANCHORAGES,
});

/** 바다에 접한 육지 타일. 해안선 데이터가 바뀌어도 테스트가 따라간다. */
function findCoastalLandTile(): TileCoord {
  for (let y = 1; y < tileMap.size.height - 1; y += 1) {
    for (let x = 1; x < tileMap.size.width - 1; x += 1) {
      if (!tileMap.isLandTile({ x, y })) {
        continue;
      }
      if (!tileMap.isLandTile({ x: x - 1, y }) || !tileMap.isLandTile({ x, y: y - 1 })) {
        return { x, y };
      }
    }
  }
  throw new Error("coastal land tile not found");
}

describe("findSeaRoute", () => {
  it("경로 전체가 바다 위에 있다", () => {
    const lisboa = findPort("lisboa");
    const ceuta = findPort("ceuta");
    expect(lisboa).toBeDefined();
    expect(ceuta).toBeDefined();

    const route = findSeaRoute(tileMap, lisboa!.anchorage, ceuta!.anchorage);

    expect(route).not.toBeNull();
    expect(route!.length).toBeGreaterThan(1);
    for (const point of route!) {
      expect(tileMap.isNavigable(point)).toBe(true);
    }
  });

  /** 해안을 살짝 벗어난 클릭까지 버리면 조작이 까다로워진다. 가까운 바다로 당긴다. */
  it("해안가 뭍을 찍으면 가까운 바다로 당긴다", () => {
    const lisboa = findPort("lisboa");
    const shore = tileCenter(tileMap.bounds, findCoastalLandTile());
    expect(tileMap.isNavigable(shore)).toBe(false);

    const route = findSeaRoute(tileMap, lisboa!.anchorage, shore);

    expect(route).not.toBeNull();
    expect(tileMap.isNavigable(route![route!.length - 1] as { lat: number; lon: number })).toBe(
      true,
    );
  });

  /** 내륙 깊은 곳은 당길 바다가 없다. 조용히 아무 데나 보내는 것보다 거절이 낫다. */
  it("내륙 깊은 곳으로는 경로가 없다", () => {
    const lisboa = findPort("lisboa");
    const sahara = { lat: 22, lon: 12 };

    expect(findSeaRoute(tileMap, lisboa!.anchorage, sahara)).toBeNull();
  });

  it("같은 입력에는 같은 경로를 낸다", () => {
    const lisboa = findPort("lisboa");
    const from = lisboa!.anchorage;
    const to = { lat: 33, lon: -13 };

    expect(findSeaRoute(tileMap, from, to)).toEqual(findSeaRoute(tileMap, from, to));
  });
});
