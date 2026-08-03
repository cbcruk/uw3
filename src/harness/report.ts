import type { RouteResult, ScenarioResult, Stat } from "./harness.types";

function fmt(stat: Stat | null, digits = 0): string {
  if (stat === null) {
    return "—";
  }
  const range =
    stat.min === stat.max ? "" : ` (${stat.min.toFixed(digits)}~${stat.max.toFixed(digits)})`;
  return `${stat.median.toFixed(digits)}${range}`;
}

function routeLine(result: RouteResult, fastestId: string | null): string {
  const mark = result.route.id === fastestId ? "◀" : " ";
  const rate = `${Math.round(result.arrivalRate * 100)}%`;
  const failures = result.outcomes.filter((outcome) => !outcome.arrived);
  const why =
    failures.length === 0
      ? ""
      : `  ${[...new Set(failures.map((outcome) => outcome.failure))].join(", ")}`;

  return (
    `  ${mark} ${result.route.label.padEnd(20)} ` +
    `도달 ${rate.padStart(4)}  ` +
    `${fmt(result.days).padStart(12)}일  ` +
    `${fmt(result.distanceNm).padStart(16)}해리  ` +
    `최남단 ${fmt(result.southmostLat, 1).padStart(4)}°  ` +
    `정지 ${fmt(result.stalledDays).padStart(8)}일${why}`
  );
}

export function formatScenario(result: ScenarioResult): string {
  const lines = [
    `${result.voyageName} — 시드 ${result.routes[0]?.outcomes.length ?? 0}개`,
    "",
    ...result.routes.map((route) => routeLine(route, result.fastestRouteId)),
    "",
  ];

  // 사료 대조. 기준선이 없으면 오차 칸을 비운다 (SHAPE G2).
  lines.push(
    result.fidelity.comparable
      ? `  사료 대조: 사료 ${result.fidelity.referenceDays}일 · 시뮬 ${result.fidelity.simulatedDays}일 · 오차 ${result.fidelity.absDays}일`
      : `  사료 대조: 불가 — ${result.fidelity.note}`,
  );
  if (!result.fidelity.comparable) {
    lines.push(`             ${result.reference.source}`);
  }

  // SPEC 3.3의 결함 지표.
  if (result.detourAdvantageDays === null) {
    lines.push("  우회 이점: 잴 수 없다 (직항 또는 우회가 도달하지 못했다)");
  } else {
    const value = result.detourAdvantageDays;
    const verdict =
      value <= 0
        ? "직항이 같거나 빠르다. 볼타 두 마르가 재현되지 않는다"
        : value < 3
          ? "우회 이점이 미미하다. 태킹이 너무 싸다 (SPEC 3.3 — 압류 부재)"
          : "우회가 뚜렷이 빠르다";
    lines.push(`  우회 이점: ${value > 0 ? "+" : ""}${value}일 — ${verdict}`);
  }

  return lines.join("\n");
}

export function formatReport(results: readonly ScenarioResult[]): string {
  const blocks = results.map(formatScenario);
  const comparable = results.filter((result) => result.fidelity.comparable).length;

  return [
    "충실도 측정",
    "",
    ...blocks.flatMap((block) => [block, ""]),
    `대조 가능한 항해: ${comparable}/${results.length}`,
    comparable === 0
      ? "기준선이 있는 항해가 없다. 충실도 **오차는 아직 잴 수 없다** — 위의 수치는" +
        "\n시뮬 내부의 비교일 뿐 사료와의 거리가 아니다 (SPEC 3, SHAPE G2)."
      : "",
  ]
    .join("\n")
    .trimEnd();
}
