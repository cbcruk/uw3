import { describe, expect, it } from "vite-plus/test";
import { SAIL_CURVES, SAIL_TUNING } from "./sail.tuning";
import { WIND_BANDS, WIND_TUNING } from "./wind.tuning";
import { gradeTally } from "./tuning";
import type { SourceGrade, Tuned } from "./tuning.types";

const TABLES = [SAIL_TUNING, WIND_TUNING];
const ANNOTATED: readonly Tuned<unknown>[] = [
  ...Object.values(SAIL_TUNING),
  ...Object.values(WIND_TUNING),
  ...Object.values(SAIL_CURVES),
  WIND_BANDS,
];

describe("튜닝 표", () => {
  /** 근거 없는 값이 근거 있는 값인 척하면 대조 자체가 거짓이 된다 (SPEC 3). */
  it("모든 값이 근거를 달고 있다", () => {
    for (const entry of ANNOTATED) {
      expect(entry.source.length).toBeGreaterThan(0);
      expect(entry.unit.length).toBeGreaterThan(0);
    }
  });

  it("measured는 출처를 명시해야 한다", () => {
    for (const entry of ANNOTATED) {
      if (entry.grade === "measured") {
        // 자료를 옮겼다면 무엇에서 옮겼는지가 적혀 있어야 한다.
        expect(entry.source).toMatch(/[A-Za-z가-힣]{4,}/);
      }
    }
  });

  it("unverified는 무엇을 확인해야 하는지 적는다", () => {
    for (const entry of ANNOTATED) {
      if (entry.grade === "unverified") {
        expect(entry.source).toMatch(/감으로 정함|미확인|필요/);
      }
    }
  });

  it("값이 유한한 수다", () => {
    for (const table of TABLES) {
      for (const entry of Object.values(table)) {
        expect(Number.isFinite(entry.value)).toBe(true);
      }
    }
  });

  /**
   * 이 테스트는 통과/실패가 목적이 아니라 **부채를 눈에 보이게 하는 것**이 목적이다.
   * 등급 분포가 곧 이 시뮬레이터의 실제 충실도다 (SPEC 3).
   */
  it("충실도 부채를 집계한다", () => {
    const tally = gradeTally(TABLES);
    const curves: Record<SourceGrade, number> = { measured: 0, qualitative: 0, unverified: 0 };
    for (const entry of [...Object.values(SAIL_CURVES), WIND_BANDS]) {
      curves[entry.grade] += 1;
    }

    const total =
      tally.measured +
      tally.qualitative +
      tally.unverified +
      curves.measured +
      curves.qualitative +
      curves.unverified;

    console.log(
      `튜닝 표 ${total}항목 — ` +
        `measured ${tally.measured + curves.measured} · ` +
        `qualitative ${tally.qualitative + curves.qualitative} · ` +
        `unverified ${tally.unverified + curves.unverified}`,
    );

    // 표에 아무것도 없으면 이관이 안 된 것이다.
    expect(total).toBeGreaterThan(20);
  });
});
