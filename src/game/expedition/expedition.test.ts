import { describe, expect, it } from "vite-plus/test";
import { PORTS } from "../../content/ports";
import { DIRECTIONS, opposite } from "../grid/direction";
import type { Cell } from "../grid/world-grid.types";
import { applyCommand, createRun, createWorld } from "../run/run";
import type { RunConfig } from "../run/run.types";
import {
  applyRunToMeta,
  compareRecords,
  contractFor,
  createMeta,
  dailyConfig,
  dailyKey,
  freeConfig,
  recordOf,
} from "./expedition";
import type { RunRecord } from "./expedition.types";

const grid = createWorld();

describe("계약 — 시드에서 출발·목표·달이 갈린다", () => {
  it("목표는 출발과 다른 항구이고, 같은 시드면 같은 계약이다", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const contract = contractFor(seed);
      expect(contract.goalPortId).not.toBe(contract.startPortId);
      expect(PORTS.map((port) => port.id)).toContain(contract.goalPortId);
      expect(contractFor(seed)).toEqual(contract);
    }
  });

  it("데일리는 날짜에서만 나오고 메타를 들고 가지 않는다", () => {
    expect(dailyKey(new Date(Date.UTC(2026, 9, 8, 23)))).toBe("2026-10-08");
    expect(dailyConfig("2026-10-08")).toEqual(dailyConfig("2026-10-08"));
    expect(dailyConfig("2026-10-08").seed).not.toBe(dailyConfig("2026-10-09").seed);
    expect(dailyConfig("2026-10-08").knownPortIds).toEqual([]);
  });

  it("자유 원정은 메타의 아는 항구를 들고 가고, 그 둘레가 처음부터 보인다", () => {
    const meta = { ...createMeta(), knownPortIds: ["angra"] };
    const config = freeConfig(3, meta);
    expect(config.knownPortIds).toEqual(["angra"]);
    const run = createRun(config, grid);
    expect(run.explored.has(grid.cellOfPort("angra") as Cell)).toBe(true);
  });
});

describe("원정의 끝 — 목표 항구에 배로 들어오면 성공이다", () => {
  const CONFIG: RunConfig = {
    seed: 7,
    startDate: { year: 1502, month: 3, day: 14 },
    startPortId: "lisboa",
    goalPortId: "lisboa",
    shipClassId: "caravela-redonda",
  };

  it("출항했다가 목표 항구로 돌아오면 arrived로 끝나고, 기록과 메타가 만들어진다", () => {
    const run = createRun(CONFIG, grid);
    expect(recordOf(run, null)).toBeNull();
    let arrived = false;
    for (const dir of DIRECTIONS) {
      if (arrived) {
        break;
      }
      applyCommand(run, { type: "move", dir });
      if (grid.portAt(run.player.cell) === null) {
        const events = applyCommand(run, { type: "move", dir: opposite(dir) });
        arrived = events.some((e) => e.type === "ended" && e.reason === "arrived");
      }
    }
    expect(arrived).toBe(true);
    expect(run.ended).toBe("arrived");

    const record = recordOf(run, "2026-10-08") as RunRecord;
    expect(record).toMatchObject({
      outcome: "arrived",
      daily: "2026-10-08",
      crewLeft: run.supplies.crew,
    });
    const meta = applyRunToMeta(createMeta(), run, record);
    expect(meta.knownPortIds).toEqual(["lisboa"]);
    expect(meta.records).toEqual([record]);
  });
});

describe("리더보드 순서 — 도착 > 짧은 날수 > 남긴 선원", () => {
  const base: RunRecord = {
    config: {
      seed: 1,
      startDate: { year: 1502, month: 1, day: 1 },
      startPortId: "lisboa",
      shipClassId: "x",
    },
    daily: null,
    outcome: "arrived",
    days: 10,
    crewAtStart: 32,
    crewLeft: 30,
    defeated: 0,
    regions: 2,
  };

  it("도착한 원정이 먼저이고, 그 안에서는 빠른 쪽, 같으면 선원을 많이 남긴 쪽", () => {
    const lost = { ...base, outcome: "crew-lost" as const, days: 3, regions: 9 };
    const slow = { ...base, days: 12 };
    const fewer = { ...base, crewLeft: 10 };
    const sorted = [lost, slow, fewer, base].sort(compareRecords);
    expect(sorted).toEqual([base, fewer, slow, lost]);
  });
});
