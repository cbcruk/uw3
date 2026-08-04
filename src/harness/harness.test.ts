import { describe, expect, it } from "vite-plus/test";
import { fidelityErrorOf, runRoute, runRouteAcrossSeeds, runScenario } from "./harness";
import type { Route, Scenario } from "./harness.types";

const DIRECT: Route = { id: "direct", label: "직항", waypoints: [] };
const DETOUR: Route = {
  id: "trade-30",
  label: "무역풍대 우회",
  waypoints: [{ lat: 30, lon: -20 }],
};

/**
 * 하니스 **자체**의 테스트다. 며칠이 나와야 하는지는 여기서 정하지 않는다 —
 * 그것을 테스트에 박으면 시뮬을 고칠 때마다 기대값을 따라 고치게 되고,
 * 결국 "테스트에 맞춰 튜닝"이 된다 (SPEC 6). 여기서 보는 것은 측정이
 * **재현되는가**와 통계가 거짓말을 하지 않는가다.
 */
describe("충실도 하니스", () => {
  it("같은 시드는 같은 결과를 낸다", () => {
    expect(runRoute("volta-do-mar", DIRECT, 7)).toEqual(runRoute("volta-do-mar", DIRECT, 7));
  });

  it("시드가 다르면 결과가 갈린다", () => {
    const outcomes = [11, 22, 33].map((seed) => runRoute("volta-do-mar", DETOUR, seed));
    const distances = new Set(outcomes.map((outcome) => outcome.distanceNm));
    expect(distances.size).toBeGreaterThan(1);
  });

  it("없는 항해를 요구하면 거절한다", () => {
    expect(() => runRoute("없는-항해", DIRECT, 1)).toThrow();
  });

  describe("통계", () => {
    const result = runRouteAcrossSeeds("volta-do-mar", DIRECT, [1, 2, 3]);

    it("시드마다 결과를 하나씩 남긴다", () => {
      expect(result.outcomes).toHaveLength(3);
    });

    it("도달률과 통계가 어긋나지 않는다", () => {
      if (result.arrivalRate === 0) {
        expect(result.days).toBeNull();
      } else {
        expect(result.days).not.toBeNull();
        expect((result.days as { min: number; max: number }).min).toBeLessThanOrEqual(
          (result.days as { max: number }).max,
        );
      }
    });

    /**
     * 못 닿은 항해의 일수를 섞으면 "빨리 실패할수록 빠른 항로"가 된다.
     * 통계는 도달한 시드만으로 낸다.
     */
    it("도달한 시드만으로 통계를 낸다", () => {
      const arrived = result.outcomes.filter((outcome) => outcome.arrived);
      if (arrived.length > 0) {
        const days = arrived.map((outcome) => outcome.days);
        expect((result.days as { min: number }).min).toBe(Math.min(...days));
        expect((result.days as { max: number }).max).toBe(Math.max(...days));
      }
    });
  });

  /** 없는 기준선에 대고 오차를 내면 "완벽히 일치"로 읽힌다 (SHAPE G2). */
  describe("사료 대조", () => {
    it("기준선이 없으면 오차를 내지 않는다", () => {
      const error = fidelityErrorOf(null, 17);
      expect(error.comparable).toBe(false);
      expect(error.absDays).toBeNull();
    });

    it("시뮬이 못 닿았으면 오차가 아니라 실패다", () => {
      const error = fidelityErrorOf(93, null);
      expect(error.comparable).toBe(false);
      expect(error.absDays).toBeNull();
    });

    it("둘 다 있으면 절대 오차를 낸다", () => {
      const error = fidelityErrorOf(93, 118);
      expect(error.comparable).toBe(true);
      expect(error.absDays).toBe(25);
    });
  });

  describe("우회 이점", () => {
    const scenario: Scenario = {
      voyageId: "volta-do-mar",
      routes: [DIRECT, DETOUR],
      seeds: [1, 2],
    };
    const result = runScenario(scenario);

    /** SPEC 3.3의 결함 지표. 압류(P9)를 넣으면 이 수가 움직여야 한다. */
    it("직항과 우회의 차이를 일수로 낸다", () => {
      expect(result.detourAdvantageDays).not.toBeNull();
      expect(Number.isFinite(result.detourAdvantageDays as number)).toBe(true);
    });

    it("가장 빠른 항로를 짚는다", () => {
      expect([DIRECT.id, DETOUR.id]).toContain(result.fastestRouteId);
    });

    it("볼타 두 마르에는 아직 기준선이 없다", () => {
      expect(result.reference.days).toBeNull();
      expect(result.fidelity.comparable).toBe(false);
    });
  });
});
