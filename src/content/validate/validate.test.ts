import { describe, expect, it } from "vite-plus/test";
import { CHECKS, debtFindings } from "./checks";
import { runValidation } from "./validate";
import type { SourceGrade } from "../tuning/tuning.types";
import type { Check } from "./validate.types";

/**
 * 검증기 **자체**의 테스트다. 자료가 맞는지는 `vp run validate`가 보고,
 * 여기서는 검증기가 제 일을 하는지를 본다 — 특히 실패해야 할 때 실패하는지.
 */
describe("검증기", () => {
  /**
   * 자료가 깨져 있으면 `vp test`도 알아야 한다. CI에서 두 단계가 갈려 있어도
   * 손으로 테스트만 돌리는 흐름이 흔하다.
   */
  it("현재 자료를 통과시킨다", () => {
    const report = runValidation();
    const errors = report.findings.filter((finding) => finding.severity === "error");
    expect(errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("검사가 터져도 나머지를 계속 본다", () => {
    const exploding: Check = {
      name: "터지는 검사",
      run: () => {
        throw new Error("자료를 읽을 수 없다");
      },
    };
    const quiet: Check = { name: "조용한 검사", run: () => [] };

    const report = runValidation([exploding, quiet]);

    expect(report.ok).toBe(false);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]?.message).toContain("자료를 읽을 수 없다");
  });

  /**
   * 래칫이 이 방향으로 돌아야 표가 부채를 늘리는 도구가 되지 않는다 (SPEC 6.1).
   * 여기가 통과하지 않으면 표로 뺀 것이 오히려 해가 된다.
   */
  describe("부채 래칫", () => {
    const baseline: Record<SourceGrade, number> = {
      measured: 3,
      qualitative: 10,
      unverified: 20,
    };
    const errorsOf = (tally: Record<SourceGrade, number>): string[] =>
      debtFindings(tally, baseline)
        .filter((finding) => finding.severity === "error")
        .map((finding) => finding.message);

    it("근거 없는 값이 늘면 막는다", () => {
      const messages = errorsOf({ measured: 3, qualitative: 10, unverified: 21 });
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain("근거 없는 값이 늘었다");
    });

    it("그대로면 통과한다", () => {
      expect(errorsOf({ measured: 3, qualitative: 10, unverified: 20 })).toEqual([]);
    });

    /** 근거 있는 값을 늘리는 것은 언제나 환영이다. 상한이 아니라 하한이다. */
    it("근거 있는 값이 늘면 막지 않는다", () => {
      expect(errorsOf({ measured: 9, qualitative: 10, unverified: 20 })).toEqual([]);
    });

    it("근거 있는 값이 줄면 막는다", () => {
      const messages = errorsOf({ measured: 2, qualitative: 10, unverified: 20 });
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain("자료에 근거한 값이 줄었다");
    });

    /** 갚은 만큼 즉시 상한을 낮춰야 그 자리를 되돌려 쓰지 못한다. */
    it("부채가 줄면 상한을 낮추라고 알린다", () => {
      const findings = debtFindings({ measured: 3, qualitative: 10, unverified: 14 }, baseline);
      const notes = findings.filter((finding) => finding.severity === "note");
      expect(notes.some((finding) => finding.message.includes("낮춰"))).toBe(true);
      expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
    });
  });

  it("모든 검사에 이름이 있다", () => {
    for (const check of CHECKS) {
      expect(check.name.length).toBeGreaterThan(0);
    }
  });
});
