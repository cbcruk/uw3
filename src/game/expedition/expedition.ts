import { PORTS } from "../../content/ports";
import { createRng, hashString } from "../../sim/rng/rng";
import { currentDay } from "../run/run";
import type { RunConfig, RunState } from "../run/run.types";
import type { Contract, MetaState, RunRecord } from "./expedition.types";

/** 계약에 쓰는 선형. 원정마다 같은 배로 떠난다 — 배를 고르는 것은 교역이 들어온 뒤다. */
const EXPEDITION_SHIP = "caravela-redonda";
/** 계약의 해. 바람 표가 이 해를 기준으로 짜여 있다 (시뮬 SPEC 9). */
const EXPEDITION_YEAR = 1502;
const MONTHS_PER_YEAR = 12;
const DAILY_SALT = "daily";

/**
 * 시드에서 계약을 뽑는다. 출발 항구·목표 항구·출항 달이 갈린다.
 *
 * 달이 바뀌면 바람이 바뀐다 — 같은 리스본 → 앙그라도 3월과 8월은 다른 원정이다.
 * 목표는 출발과 다른 항구다.
 */
export function contractFor(seed: number): Contract {
  const rng = createRng(seed);
  const start = rng.pick(PORTS);
  const goal = rng.pick(PORTS.filter((port) => port.id !== start.id));
  return {
    startPortId: start.id,
    goalPortId: goal.id,
    startDate: { year: EXPEDITION_YEAR, month: rng.int(1, MONTHS_PER_YEAR + 1), day: 1 },
  };
}

/** 날짜의 데일리 키. 현실 달력의 날짜다(게임 날짜가 아니다). */
export function dailyKey(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * 오늘의 원정. 시드는 날짜에서만 나온다 — 같은 날이면 누구나 같은 계약, 같은 바다다.
 *
 * 메타를 넘기지 않는다. 아는 항구가 많은 사람이 유리하면 비교가 안 된다 (§0 경계).
 */
export function dailyConfig(key: string): RunConfig {
  return configFor(hashString(`${DAILY_SALT}:${key}`), []);
}

/** 자유 원정. 메타의 아는 항구를 들고 간다. */
export function freeConfig(seed: number, meta: MetaState): RunConfig {
  return configFor(seed, meta.knownPortIds);
}

function configFor(seed: number, knownPortIds: readonly string[]): RunConfig {
  const contract = contractFor(seed);
  return {
    seed,
    startDate: contract.startDate,
    startPortId: contract.startPortId,
    goalPortId: contract.goalPortId,
    shipClassId: EXPEDITION_SHIP,
    knownPortIds: [...knownPortIds],
  };
}

/** 끝난 런을 기록으로 접는다. 끝나지 않은 런이면 `null`. */
export function recordOf(run: RunState, daily: string | null): RunRecord | null {
  if (run.ended === null) {
    return null;
  }
  return {
    config: run.config,
    daily,
    outcome: run.ended,
    days: currentDay(run) + 1,
    crewAtStart: run.crewAtStart,
    crewLeft: run.supplies.crew,
    defeated: run.defeated,
    regions: run.visitedRegions.size,
  };
}

export function createMeta(): MetaState {
  return { version: 1, knownPortIds: [], visitedRegions: [], records: [] };
}

/**
 * 끝난 원정을 메타에 더한다. 새 값을 돌려주고 원래 값은 건드리지 않는다.
 *
 * **죽어도 앎은 남는다.** 들어가 본 항구와 영역은 결과와 상관없이 더한다 — 로그라이트의 뜻이 여기 있다.
 */
export function applyRunToMeta(meta: MetaState, run: RunState, record: RunRecord): MetaState {
  return {
    version: 1,
    knownPortIds: union(meta.knownPortIds, run.dockedPorts),
    visitedRegions: union(meta.visitedRegions, run.visitedRegions),
    records: [...meta.records, record],
  };
}

/**
 * 리더보드 순서. 도착한 원정이 먼저, 그 안에서는 짧은 날수, 그다음 많이 남긴 선원.
 *
 * 점수 공식을 만들지 않았다. 가중치를 정할 근거가 없고, 세 기준은 서로 바꿔 쓸 수 없다.
 */
export function compareRecords(a: RunRecord, b: RunRecord): number {
  const arrived = Number(b.outcome === "arrived") - Number(a.outcome === "arrived");
  if (arrived !== 0) {
    return arrived;
  }
  if (a.outcome === "arrived") {
    return a.days - b.days || b.crewLeft - a.crewLeft;
  }
  return b.regions - a.regions || b.days - a.days;
}

function union(base: readonly string[], extra: Iterable<string>): string[] {
  return [...new Set([...base, ...extra])].sort();
}
