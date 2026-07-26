import { describe, expect, it } from "vite-plus/test";
import { LANDMASSES, WORLD_BOUNDS } from "../../content/coastline";
import { PORTS, PORT_ANCHORAGES } from "../../content/ports";
import type { TileCoord } from "../geo/geo.types";
import { latLonToTile, tileIndex } from "../geo/geo.utils";
import { createTileMap } from "./tile-map";

const tileMap = createTileMap({
  bounds: WORLD_BOUNDS,
  landmasses: LANDMASSES,
  navigableAnchorages: PORT_ANCHORAGES,
});

function reachableSeaTiles(start: TileCoord): Set<number> {
  const seen = new Set<number>([tileIndex(tileMap.size, start)]);
  const queue: TileCoord[] = [start];
  const neighbours = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const tile = queue.pop() as TileCoord;
    for (const offset of neighbours) {
      const next = { x: tile.x + offset.x, y: tile.y + offset.y };
      if (tileMap.isLandTile(next)) {
        continue;
      }
      const index = tileIndex(tileMap.size, next);
      if (seen.has(index)) {
        continue;
      }
      seen.add(index);
      queue.push(next);
    }
  }
  return seen;
}

describe("createTileMap", () => {
  it("이베리아 내륙은 육지다", () => {
    expect(tileMap.isNavigable({ lat: 40.4, lon: -3.7 })).toBe(false);
    expect(tileMap.isNavigable({ lat: 41.65, lon: -4.72 })).toBe(false);
  });

  it("모로코 내륙은 육지다", () => {
    expect(tileMap.isNavigable({ lat: 32.0, lon: -6.5 })).toBe(false);
  });

  it("대서양 외해는 바다다", () => {
    expect(tileMap.isNavigable({ lat: 38.0, lon: -13.0 })).toBe(true);
    expect(tileMap.isNavigable({ lat: 34.0, lon: -12.0 })).toBe(true);
  });

  it("모든 항구는 항행 가능한 타일에 있다", () => {
    for (const port of PORTS) {
      expect(tileMap.isNavigable({ lat: port.lat, lon: port.lon })).toBe(true);
    }
  });

  /** SPEC 3.1: 병목 지형이 테크트리의 뼈대다. 래스터화로 해협이 막히면 안 된다. */
  it("지브롤터 해협이 열려 있어 모든 항구가 해로로 이어진다", () => {
    const lisboaTile = latLonToTile(WORLD_BOUNDS, { lat: 38.71, lon: -9.14 });
    const reachable = reachableSeaTiles(lisboaTile);

    for (const port of PORTS) {
      const tile = latLonToTile(WORLD_BOUNDS, { lat: port.lat, lon: port.lon });
      expect(reachable.has(tileIndex(tileMap.size, tile))).toBe(true);
    }
  });

  it("해협은 넓지 않다 — 통과 지점이 제한적이다", () => {
    const strait = { lat: 35.94, lon: -5.5 };
    expect(tileMap.isNavigable(strait)).toBe(true);
    expect(tileMap.isNavigable({ lat: 35.6, lon: -5.5 })).toBe(false);
  });
});
