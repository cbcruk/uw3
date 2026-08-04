import { findPort } from "../content/ports";
import { findVoyage } from "../content/voyages";
import { compareToRecord } from "../sim/voyage/logbook";
import type { LatLon } from "../sim/geo/geo.types";
import { DEFAULT_CONFIG, applyAction, createGame } from "../sim/world/world";
import type { Game } from "../sim/world/world.types";
import { SCENARIOS } from "./scenarios";
import type {
  FidelityError,
  Route,
  RouteResult,
  RunOutcome,
  Scenario,
  ScenarioResult,
  Stat,
} from "./harness.types";

/**
 * 한 항해에 허용하는 상한. 이걸 넘으면 "오래 걸렸다"가 아니라 **못 간다**로 본다.
 * 대서양 한 번 건너는 데 필요한 일수보다 넉넉하다.
 */
const MAX_DAYS = 240;
/**
 * `sail` 호출 상한. 구간 항해는 트러블·경고마다 돌아오므로 하루에 여러 번 부를 수
 * 있다. 진행이 없는 채로 도는 것을 막는 안전장치이지 시뮬 규칙이 아니다.
 */
const MAX_SAIL_CALLS = 400;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] as number;
  }
  return (((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2) as number;
}

function statOf(values: readonly number[]): Stat | null {
  if (values.length === 0) {
    return null;
  }
  return { median: median(values), min: Math.min(...values), max: Math.max(...values) };
}

/** 목적지를 걸고 닿을 때까지 항해한다. 닿지 못하면 이유를 돌려준다. */
function sailTo(game: Game, target: LatLon): string | null {
  const accepted = applyAction(game, { type: "set-destination", target });
  // 월드가 거절했다는 것은 그리로 가는 바닷길이 없다는 뜻이다.
  if (game.voyage.destination === null) {
    return `바닷길 없음 (${accepted.entries[0]?.text ?? "목적지 거절"})`;
  }

  for (let call = 0; call < MAX_SAIL_CALLS; call += 1) {
    const before = game.voyage.day;
    const result = applyAction(game, { type: "sail" });

    if (game.ended !== null) {
      return game.ended === "crew-lost" ? "선원 전멸" : "선체 상실";
    }
    // 도착·입항하면 월드가 목적지를 지운다.
    if (game.voyage.destination === null) {
      return null;
    }
    if (game.voyage.day - game.logbook.startDay > MAX_DAYS) {
      return `${MAX_DAYS}일 초과`;
    }
    // 하루도 못 갔으면 같은 명령을 반복해도 결과가 같다.
    if (game.voyage.day === before) {
      return `전진 불가 (${result.passage?.stop ?? "정지"})`;
    }
  }
  return "항해 호출 상한 초과";
}

export function runRoute(voyageId: string, route: Route, seed: number): RunOutcome {
  const voyage = findVoyage(voyageId);
  if (voyage === undefined) {
    throw new Error(`unknown voyage: ${voyageId}`);
  }
  const destination = findPort(voyage.endPortId);
  if (destination === undefined) {
    throw new Error(`unknown port: ${voyage.endPortId}`);
  }

  const game = createGame({
    ...DEFAULT_CONFIG,
    seed,
    startDate: voyage.departure,
    startPortId: voyage.startPortId,
  });
  applyAction(game, { type: "depart" });

  let failure: string | null = null;
  for (const leg of [...route.waypoints, destination.anchorage]) {
    failure = sailTo(game, leg);
    if (failure !== null) {
      break;
    }
  }

  const comparison = compareToRecord(voyage, game.logbook, game.voyage.atPortId);

  return {
    seed,
    arrived: comparison.arrived,
    days: comparison.days,
    distanceNm: comparison.distanceNm,
    detourRatio: comparison.detourRatio,
    southmostLat: comparison.southmostLat,
    stalledDays: comparison.stalledDays,
    hazardDays: game.logbook.hazardDays,
    failure: comparison.arrived ? null : (failure ?? "목적지 미도달"),
  };
}

export function runRouteAcrossSeeds(
  voyageId: string,
  route: Route,
  seeds: readonly number[],
): RouteResult {
  const outcomes = seeds.map((seed) => runRoute(voyageId, route, seed));
  // 통계는 **도달한 시드만**으로 낸다. 못 닿은 항해의 일수를 섞으면
  // "빨리 실패할수록 빠른 항로"가 된다.
  const arrived = outcomes.filter((outcome) => outcome.arrived);

  return {
    route,
    outcomes,
    arrivalRate: outcomes.length === 0 ? 0 : arrived.length / outcomes.length,
    days: statOf(arrived.map((outcome) => outcome.days)),
    distanceNm: statOf(arrived.map((outcome) => outcome.distanceNm)),
    southmostLat: statOf(arrived.map((outcome) => outcome.southmostLat)),
    stalledDays: statOf(arrived.map((outcome) => outcome.stalledDays)),
  };
}

/**
 * 사료 대조. 기준선이 없으면 오차를 **내지 않는다**.
 *
 * 여기서 0이나 추정치를 채우고 싶은 유혹이 가장 크다 — 표에 빈칸이 있으면
 * 미완성으로 보이기 때문이다. 그러나 없는 기준선에 맞춘 오차는 "완벽히 일치"로
 * 읽힌다. 빈칸이 거짓말보다 낫다 (SHAPE G2).
 */
export function fidelityErrorOf(
  referenceDays: number | null,
  simulatedDays: number | null,
): FidelityError {
  if (referenceDays === null) {
    return {
      referenceDays: null,
      simulatedDays,
      absDays: null,
      comparable: false,
      note: "사료 미확인. 대조 불가 — 오차를 내지 않는다 (SHAPE G2)",
    };
  }
  if (simulatedDays === null) {
    return {
      referenceDays,
      simulatedDays: null,
      absDays: null,
      comparable: false,
      note: "시뮬이 목적지에 닿지 못했다. 오차가 아니라 실패다",
    };
  }
  return {
    referenceDays,
    simulatedDays,
    absDays: Math.abs(simulatedDays - referenceDays),
    comparable: true,
    note: "대조 가능",
  };
}

export function runScenario(scenario: Scenario): ScenarioResult {
  const voyage = findVoyage(scenario.voyageId);
  if (voyage === undefined) {
    throw new Error(`unknown voyage: ${scenario.voyageId}`);
  }

  const routes = scenario.routes.map((route) =>
    runRouteAcrossSeeds(scenario.voyageId, route, scenario.seeds),
  );

  const reachable = routes.filter((result) => result.days !== null);
  const fastest = reachable.reduce<RouteResult | null>(
    (best, result) =>
      best === null || (result.days as Stat).median < (best.days as Stat).median ? result : best,
    null,
  );

  const direct = routes.find((result) => result.route.waypoints.length === 0);
  const bestDetour = reachable
    .filter((result) => result.route.waypoints.length > 0)
    .reduce<RouteResult | null>(
      (best, result) =>
        best === null || (result.days as Stat).median < (best.days as Stat).median ? result : best,
      null,
    );

  const detourAdvantageDays =
    direct?.days == null || bestDetour?.days == null
      ? null
      : direct.days.median - bestDetour.days.median;

  return {
    voyageId: scenario.voyageId,
    voyageName: voyage.name,
    lesson: voyage.lesson,
    routes,
    fidelity: fidelityErrorOf(voyage.reference.days, fastest?.days?.median ?? null),
    reference: voyage.reference,
    detourAdvantageDays,
    fastestRouteId: fastest?.route.id ?? null,
  };
}

export function runHarness(scenarios: readonly Scenario[] = SCENARIOS): ScenarioResult[] {
  return scenarios.map(runScenario);
}
