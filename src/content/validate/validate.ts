import { CHECKS } from "./checks";
import type { Check, Finding, ValidationReport } from "./validate.types";

/** 모든 검사를 돌린다. 하나가 실패해도 나머지를 계속 본다 — 한 번에 다 보여준다. */
export function runValidation(checks: readonly Check[] = CHECKS): ValidationReport {
  const findings: Finding[] = [];

  for (const check of checks) {
    try {
      findings.push(...check.run());
    } catch (cause) {
      // 검사가 터지는 것도 결과다. 자료가 애초에 읽히지 않는 상태일 수 있다.
      findings.push({
        severity: "error",
        area: check.name,
        message: `검사가 실행 중 실패했다: ${cause instanceof Error ? cause.message : String(cause)}`,
      });
    }
  }

  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warn").length;

  return { findings, errors, warnings, ok: errors === 0 };
}

const MARK: Record<Finding["severity"], string> = {
  error: "✗",
  warn: "!",
  note: "·",
};

/**
 * 사람이 읽을 보고서. 검증기는 자료를 고칠 사람이 보는 것이므로
 * **어느 파일을 열어야 하는지**가 각 줄에 있어야 한다.
 */
export function formatReport(report: ValidationReport): string {
  const lines = ["자료 검증", ""];

  const order: Finding["severity"][] = ["error", "warn", "note"];
  for (const severity of order) {
    for (const finding of report.findings.filter((f) => f.severity === severity)) {
      lines.push(`  ${MARK[severity]} [${finding.area}] ${finding.message}`);
    }
  }

  lines.push("");
  lines.push(
    report.ok
      ? `통과 — 오류 0, 경고 ${report.warnings}`
      : `실패 — 오류 ${report.errors}, 경고 ${report.warnings}`,
  );

  return lines.join("\n");
}
