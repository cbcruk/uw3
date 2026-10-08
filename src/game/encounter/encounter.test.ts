import { describe, expect, it } from "vite-plus/test";
import { ENCOUNTER_KINDS } from "../../content/game/encounter-kinds";
import { ENCOUNTER_DENSITY } from "../../content/game/encounters.tuning";
import { isWithinNm, sightRadiusNm } from "../fog/fog";
import type { Cell } from "../grid/world-grid.types";
import { regionOf } from "../region/region";
import { createWorld } from "../run/run";
import { spawnEncounters } from "./encounter";

const grid = createWorld();

function regionAt(lat: number, lon: number) {
  return regionOf(grid.cellOf({ lat, lon }) as Cell);
}

const OPEN_ATLANTIC = regionAt(30, -40);
const IBERIA = regionAt(39, -8);
const SAHARA = regionAt(24, 5);

describe("조우 생성 — 시드 × 영역만으로 정해진다", () => {
  it("같은 시드·같은 영역이면 같은 조우가 나온다", () => {
    expect(spawnEncounters(grid, 7, IBERIA)).toEqual(spawnEncounters(grid, 7, IBERIA));
  });

  it("시드가 다르면 배치가 달라진다", () => {
    const cellsOf = (seed: number) =>
      JSON.stringify(spawnEncounters(grid, seed, OPEN_ATLANTIC).map((e) => e.cell));
    expect(cellsOf(1)).not.toBe(cellsOf(2));
  });

  it("종류마다 제 지형에만 놓인다", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      for (const region of [OPEN_ATLANTIC, IBERIA, SAHARA]) {
        for (const encounter of spawnEncounters(grid, seed, region)) {
          const kind = ENCOUNTER_KINDS.find((entry) => entry.id === encounter.kind);
          expect(kind?.terrains).toContain(grid.terrainAt(encounter.cell));
          expect(encounter.crew).toBeGreaterThanOrEqual(kind?.crewMin ?? 0);
          expect(encounter.crew).toBeLessThanOrEqual(kind?.crewMax ?? 0);
        }
      }
    }
  });

  it("항구에서 배의 시야 안에는 놓지 않는다 — 출항한 배가 먼저 보인다", () => {
    const lisboa = grid.cellOfPort("lisboa") as Cell;
    for (let seed = 0; seed < 20; seed += 1) {
      for (const { cell } of spawnEncounters(grid, seed, regionOf(lisboa))) {
        expect(isWithinNm(grid, lisboa, cell, sightRadiusNm("ship"))).toBe(false);
      }
    }
  });

  it("한 칸에 둘이 겹치지 않는다", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const keys = spawnEncounters(grid, seed, IBERIA).map((e) => grid.indexOf(e.cell));
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("대양 한복판 영역의 해적 수는 평균적으로 밀도 표를 따른다", () => {
    const seeds = 200;
    let pirates = 0;
    for (let seed = 0; seed < seeds; seed += 1) {
      pirates += spawnEncounters(grid, seed, OPEN_ATLANTIC).filter(
        (e) => e.kind === "pirate",
      ).length;
    }
    const expected = (2400 * ENCOUNTER_DENSITY.pirate) / 1000;
    expect(pirates / seeds).toBeCloseTo(expected, 0);
  });

  it("사막에는 늑대가 없고 도적은 있다", () => {
    let bandits = 0;
    for (let seed = 0; seed < 20; seed += 1) {
      const encounters = spawnEncounters(grid, seed, SAHARA);
      expect(
        encounters.some((e) => e.kind === "beast" && grid.terrainAt(e.cell) === "desert"),
      ).toBe(false);
      bandits += encounters.filter((e) => e.kind === "bandit").length;
    }
    expect(bandits).toBeGreaterThan(0);
  });
});
