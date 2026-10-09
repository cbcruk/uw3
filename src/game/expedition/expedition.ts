import { PORTS } from '../../content/ports'
import { findShipClass } from '../../content/ships'
import { DEFAULT_EXPEDITION_SHIP, EXPEDITION_SHIPS } from '../../content/game/expedition-ships'
import { createRng, hashString } from '../../sim/rng/rng'
import { currentDay, totalCrew } from '../run/run'
import type { RunConfig, RunState } from '../run/run.types'
import {
  addLanguageDocks,
  fameEarned,
  languageDocksOf,
  learnedLanguages,
  patronGoldFor,
} from '../fame/fame'
import type { Contract, MetaState, MetaStateV1, RunRecord, ShipChoice } from './expedition.types'

/** 계약의 해. 바람 표가 이 해를 기준으로 짜여 있다 (시뮬 SPEC 9). */
const EXPEDITION_YEAR = 1502
const MONTHS_PER_YEAR = 12
const DAILY_SALT = 'daily'

/**
 * 시드에서 계약을 뽑는다. 출발 항구·목표 항구·출항 달이 갈린다.
 *
 * 달이 바뀌면 바람이 바뀐다 — 같은 리스본 → 앙그라도 3월과 8월은 다른 원정이다.
 * 목표는 출발과 다른 항구다.
 */
export function contractFor(seed: number): Contract {
  const rng = createRng(seed)
  const start = rng.pick(PORTS)
  const goal = rng.pick(PORTS.filter((port) => port.id !== start.id))
  return {
    startPortId: start.id,
    goalPortId: goal.id,
    startDate: { year: EXPEDITION_YEAR, month: rng.int(1, MONTHS_PER_YEAR + 1), day: 1 },
  }
}

/** 날짜의 데일리 키. 현실 달력의 날짜다(게임 날짜가 아니다). */
export function dailyKey(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/**
 * 오늘의 원정. 시드는 날짜에서만 나온다 — 같은 날이면 누구나 같은 계약, 같은 바다다.
 *
 * 메타를 넘기지 않는다. 아는 항구가 많은 사람이 유리하면 비교가 안 된다 (§0 경계).
 */
export function dailyConfig(key: string): RunConfig {
  return configFor(hashString(`${DAILY_SALT}:${key}`), {
    shipClassId: DEFAULT_EXPEDITION_SHIP,
    knownPortIds: [],
    patronGold: 0,
    languages: [],
  })
}

/**
 * 자유 원정. 메타가 주는 몫 셋을 들고 간다 — 아는 항구, 명성의 후원금, 배운 말.
 * 메타가 런을 바꾸는 통로는 이 설정뿐이다 (R40).
 *
 * 고른 선형도 여기서만 넘긴다. 명성이 아직 열지 않은 선형이면 예외다 — 런은 명성을 모른다 (R57).
 */
export function freeConfig(
  seed: number,
  meta: MetaState,
  shipClassId: string = DEFAULT_EXPEDITION_SHIP,
): RunConfig {
  if (
    !shipChoices(meta.fame).some((choice) => choice.open && choice.shipClass.id === shipClassId)
  ) {
    throw new Error(`ship class not open: ${shipClassId}`)
  }
  return configFor(seed, {
    shipClassId,
    knownPortIds: [...meta.knownPortIds],
    patronGold: patronGoldFor(meta.fame),
    languages: learnedLanguages(meta.languageDocks),
  })
}

/** 원정에 고를 수 있는 선형과, 이 명성으로 열렸는가. 표의 순서 그대로다. */
export function shipChoices(fame: number): ShipChoice[] {
  return EXPEDITION_SHIPS.flatMap(({ shipClassId, minFame }) => {
    const shipClass = findShipClass(shipClassId)
    return shipClass === undefined ? [] : [{ shipClass, minFame, open: fame >= minFame }]
  })
}

function configFor(
  seed: number,
  chosen: Required<Pick<RunConfig, 'shipClassId' | 'knownPortIds' | 'patronGold' | 'languages'>>,
): RunConfig {
  const contract = contractFor(seed)
  return {
    seed,
    startDate: contract.startDate,
    startPortId: contract.startPortId,
    goalPortId: contract.goalPortId,
    ...chosen,
  }
}

/** 끝난 런을 기록으로 접는다. 끝나지 않은 런이면 `null`. */
export function recordOf(run: RunState, daily: string | null): RunRecord | null {
  if (run.ended === null) {
    return null
  }
  return {
    config: run.config,
    daily,
    outcome: run.ended,
    days: currentDay(run) + 1,
    crewAtStart: run.crewAtStart,
    crewLeft: totalCrew(run),
    defeated: run.defeated,
    regions: run.visitedRegions.size,
    gold: run.supplies.gold,
  }
}

export function createMeta(): MetaState {
  return {
    version: 2,
    knownPortIds: [],
    visitedRegions: [],
    records: [],
    fame: 0,
    languageDocks: {},
  }
}

/**
 * 옛 메타를 지금 형식으로 올린다. 명성과 어학은 0에서 시작한다 —
 * 옛 기록으로 거슬러 셈하지 않는다. 옛 기록에는 물리친 수·들른 항구가 다 남아 있지 않다.
 */
export function migrateMeta(meta: MetaState | MetaStateV1): MetaState {
  if (meta.version === 2) {
    return meta
  }
  return { ...meta, version: 2, fame: 0, languageDocks: {} }
}

/**
 * 끝난 원정을 메타에 더한다. 새 값을 돌려주고 원래 값은 건드리지 않는다.
 *
 * **죽어도 앎은 남는다.** 들어가 본 항구와 영역, 그 항구들의 말은 결과와 상관없이 더한다 —
 * 로그라이트의 뜻이 여기 있다. 명성은 결과에 따라 다르게 번다(`fameEarned`).
 */
export function applyRunToMeta(meta: MetaState, run: RunState, record: RunRecord): MetaState {
  const fame = fameEarned(run, meta.knownPortIds).total
  return {
    version: 2,
    knownPortIds: union(meta.knownPortIds, run.dockedPorts),
    visitedRegions: union(meta.visitedRegions, run.visitedRegions),
    records: [...meta.records, { ...record, fame }],
    fame: meta.fame + fame,
    languageDocks: addLanguageDocks(meta.languageDocks, languageDocksOf(run)),
  }
}

/**
 * 리더보드 순서. 도착한 원정이 먼저, 그 안에서는 짧은 날수, 그다음 많이 남긴 선원, 마지막으로 금화.
 * 도착 못 한 원정은 많이 들른 영역, 그다음 항복(살아 돌아옴), 오래 버틴 날 순이다 (R66).
 *
 * 점수 공식을 만들지 않았다. 가중치를 정할 근거가 없고, 기준들은 서로 바꿔 쓸 수 없다.
 * 금화가 날수보다 뒤인 것은 일부러다 — 값이 변하지 않아(R54) 두 항구를 오가면 금화는 얼마든지 불어난다.
 * 그 대가가 날수라서 순위를 사는 길이 되지 않는다 (R56).
 */
export function compareRecords(a: RunRecord, b: RunRecord): number {
  const arrived = Number(b.outcome === 'arrived') - Number(a.outcome === 'arrived')
  if (arrived !== 0) {
    return arrived
  }
  if (a.outcome === 'arrived') {
    return a.days - b.days || b.crewLeft - a.crewLeft || goldOf(b) - goldOf(a)
  }
  const survived = Number(b.outcome === 'surrendered') - Number(a.outcome === 'surrendered')
  return b.regions - a.regions || survived || b.days - a.days || goldOf(b) - goldOf(a)
}

function goldOf(record: RunRecord): number {
  return record.gold ?? 0
}

function union(base: readonly string[], extra: Iterable<string>): string[] {
  return [...new Set([...base, ...extra])].sort()
}
