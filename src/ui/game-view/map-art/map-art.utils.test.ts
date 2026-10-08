import { describe, expect, it } from "vite-plus/test";
import { createWorld } from "../../../game/run/run";
import type { Cell } from "../../../game/grid/world-grid.types";
import { directionToward, facingOf, tileKeyOf, tileVariant } from "./map-art.utils";

const grid = createWorld();

describe("지도 그림의 순수 부분", () => {
  it("무늬 변형은 좌표만으로 정해진다", () => {
    expect(tileVariant({ x: 10, y: 20 })).toBe(tileVariant({ x: 10, y: 20 }));
    const variants = new Set(Array.from({ length: 64 }, (_, i) => tileVariant({ x: i, y: i * 3 })));
    expect(variants.size).toBeGreaterThan(1);
  });

  it("뭍 칸은 바다에 닿은 변에만 모래톱을 두르고, 그 옆 바다는 얕은 물이다", () => {
    const lisboa = grid.cellOfPort("lisboa") as Cell;
    const coastLand = [lisboa, ...[1, 2, 3].map((dx) => ({ x: lisboa.x + dx, y: lisboa.y }))]
      .map((cell) => ({ cell, key: tileKeyOf(grid, cell) }))
      .find(({ key }) => key !== null && key.terrain !== "sea");
    const key = coastLand?.key;
    expect(key).toBeDefined();
    expect(Object.values(key?.coast ?? {}).some(Boolean)).toBe(true);
    expect(tileKeyOf(grid, lisboa)?.shallow).toBe(true);
  });

  it("먼바다는 얕은 물이 아니고 모래톱도 없다", () => {
    const open = tileKeyOf(grid, grid.cellOf({ lat: 30, lon: -40 }) as Cell);
    expect(open?.terrain).toBe("sea");
    expect(open?.shallow).toBe(false);
  });

  it("옆모습은 서쪽 성분이 있으면 왼쪽, 아니면 오른쪽을 본다", () => {
    expect(facingOf("w")).toBe("left");
    expect(facingOf("sw")).toBe("left");
    expect(facingOf("ne")).toBe("right");
    expect(facingOf("n")).toBe("right");
  });

  it("상대를 향하는 방향은 8방위로 접힌다", () => {
    expect(directionToward({ x: 0, y: 0 }, { x: 5, y: -2 })).toBe("ne");
    expect(directionToward({ x: 0, y: 0 }, { x: 0, y: 3 })).toBe("s");
    expect(directionToward({ x: 1, y: 1 }, { x: 1, y: 1 })).toBeNull();
  });
});
