import { haversineNm } from "../geo/geo.utils";
import { planHeading } from "./navigator";
import type { PassageOptions, PassageResult, PassageStop } from "./passage.types";
import { stepDay, supplyDays } from "./voyage";
import type { DayReport, VoyageContext, VoyageState } from "./voyage.types";

export const DEFAULT_PASSAGE_OPTIONS: PassageOptions = {
  maxDays: 30,
  arrivalRangeNm: 30,
  supplyDaysFloor: 20,
};

/**
 * 자동 조타에서 목적지에 가까워지지 않아도 이만큼은 버틴다. 바람이 막힌 해안에서
 * 바다 쪽으로 여유를 버는 며칠은 정상적인 항해다. 그 뒤로도 안 되면 사람이 판단할 문제다.
 */
const BEATING_DAYS_LIMIT = 4;

function summarize(stop: PassageStop, days: number, state: VoyageState): string {
  const prefix = `${days}일 항해.`;
  switch (stop) {
    case "arrived":
      return `${prefix} 목적지 해역에 도달했다.`;
    case "docked":
      return `${prefix} 항구에 들어섰다.`;
    case "hazard":
      return `${prefix} 항해를 멈추고 사태를 수습한다.`;
    case "warning":
      return `${prefix} 부관이 보고할 것이 있다.`;
    case "supply":
      return `${prefix} 보급이 ${supplyDays(state)}일분까지 줄었다.`;
    case "beating":
      return `${prefix} 며칠째 바람을 거슬러 한 발도 벌지 못했다. 계속 버틸지 판단이 필요하다.`;
    case "blocked":
      return `${prefix} 전방에 육지. 침로를 다시 잡아야 한다.`;
    case "stuck":
      return `${prefix} 배가 나아가지 못한다. 침로도 돛도 소용이 없다.`;
    case "ended":
      return `${prefix} 항해가 끝났다.`;
    case "max-days":
      return `${prefix} 중간 보고를 위해 일단 멈춘다.`;
  }
}

/**
 * 뭔가 일어날 때까지 계속 항행한다.
 *
 * 3편의 조작은 침로 지정이고, 배는 그 방향으로 계속 간다. 하루하루를 묻는 대신
 * 판단이 필요한 순간에만 돌려준다 (SPEC 4.2 텔레그래프, SPEC 5 UX).
 * 줄이는 것은 입력의 **빈도**지 종류가 아니다 — 침로는 여전히 플레이어가 잡는다.
 *
 * 자동 조타는 이미 아는 바다를 되짚을 때의 선택지다. 이때만 항해사가 침로를 고른다.
 * 하루 진행 규칙은 두 모드가 같다 — 맞바람으로도, 육지로도 전진하지 못한다 (SPEC 8.2).
 */
export function runPassage(
  state: VoyageState,
  context: VoyageContext,
  options: PassageOptions = DEFAULT_PASSAGE_OPTIONS,
): PassageResult {
  const reports: DayReport[] = [];
  const seenWarnings = new Set<string>();
  const startedShort = supplyDays(state) <= options.supplyDaysFloor;
  let bestRangeNm = Infinity;
  let beatingDays = 0;

  const finish = (stop: PassageStop): PassageResult => ({
    days: reports.length,
    reports,
    stop,
    summary: summarize(stop, reports.length, state),
  });

  for (let day = 0; day < options.maxDays; day += 1) {
    const destination = state.steering === "auto" ? state.destination : null;

    if (state.steering === "auto") {
      if (destination === null) {
        return finish("stuck");
      }
      const plan = planHeading(state, context, destination);
      if (plan === null) {
        return finish("stuck");
      }
      state.headingDeg = plan.headingDeg;
    }

    const report = stepDay(state, context);
    reports.push(report);

    if (report.ended !== null) {
      return finish("ended");
    }
    if (report.dockedPortId !== null) {
      return finish("docked");
    }
    if (
      destination !== null &&
      haversineNm(state.position, destination) <= options.arrivalRangeNm
    ) {
      return finish("arrived");
    }
    if (report.hazardId !== null) {
      return finish("hazard");
    }
    // 수동 조타에서 해안은 침로를 다시 잡으라는 신호다. 자동은 항해사가 피해 간다.
    // 첫 걸음부터 막히면 항정도 0이므로, 더 구체적인 육지 쪽을 먼저 본다.
    if (state.steering === "manual" && report.blockedByLand) {
      return finish("blocked");
    }
    if (report.distanceNm === 0) {
      return finish("stuck");
    }

    if (destination !== null) {
      const rangeNm = haversineNm(state.position, destination);
      if (rangeNm < bestRangeNm) {
        bestRangeNm = rangeNm;
        beatingDays = 0;
      } else {
        beatingDays += 1;
        if (beatingDays >= BEATING_DAYS_LIMIT) {
          return finish("beating");
        }
      }
    }

    if (!startedShort && supplyDays(state) <= options.supplyDaysFloor) {
      return finish("supply");
    }

    const fresh = report.warnings.filter((warning) => !seenWarnings.has(warning));
    fresh.forEach((warning) => seenWarnings.add(warning));
    if (fresh.length > 0) {
      return finish("warning");
    }
  }

  return finish("max-days");
}
