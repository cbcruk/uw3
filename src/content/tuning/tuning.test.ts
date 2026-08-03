import { describe, expect, it } from "vite-plus/test";
import { SAIL_CURVES, SAIL_SCALARS } from "./sail.tuning";
import { WIND_BANDS, WIND_SCALARS } from "./wind.tuning";
import { HAZARD_TABLES } from "./hazards.tuning";
import { VOYAGE_TABLES } from "./voyage.tuning";
import { gradeTally, tuningEntries } from "./tuning";
import type { Tuned } from "./tuning.types";

/** 수치 표 전부. 새 표를 만들면 여기에 등록해야 검증과 집계에 걸린다. */
const TABLES = [SAIL_SCALARS, WIND_SCALARS, ...HAZARD_TABLES, ...VOYAGE_TABLES];
/** 곡선·구간처럼 값이 수가 아닌 항목. 유한성 검사만 빼고 같은 규칙을 받는다. */
const CURVES: readonly Tuned<unknown>[] = [...Object.values(SAIL_CURVES), WIND_BANDS];
const ANNOTATED: readonly Tuned<unknown>[] = [...tuningEntries(TABLES), ...CURVES];

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
    const tally = gradeTally(ANNOTATED);
    const total = tally.measured + tally.qualitative + tally.unverified;

    console.log(
      `튜닝 표 ${total}항목 — ` +
        `measured ${tally.measured} · ` +
        `qualitative ${tally.qualitative} · ` +
        `unverified ${tally.unverified}`,
    );

    // 표에 아무것도 없으면 이관이 안 된 것이다.
    expect(total).toBeGreaterThan(20);
  });
});
