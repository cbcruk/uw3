import { describe, expect, it } from 'vite-plus/test'
import { PORTS } from '../../content/ports'
import { DIRECTIONS, opposite } from '../grid/direction'
import type { Cell } from '../grid/world-grid.types'
import { applyCommand, createRun, createWorld } from '../run/run'
import type { RunConfig } from '../run/run.types'
import {
  applyRunToMeta,
  compareRecords,
  contractFor,
  createMeta,
  dailyConfig,
  dailyKey,
  freeConfig,
  migrateMeta,
  recordOf,
  shipChoices,
} from './expedition'
import type { MetaStateV1, RunRecord } from './expedition.types'
import { FAME } from '../../content/game/fame.tuning'
import { TRADE } from '../../content/game/trade.tuning'

const grid = createWorld()

describe('계약 — 시드에서 출발·목표·달이 갈린다', () => {
  it('목표는 출발과 다른 항구이고, 같은 시드면 같은 계약이다', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const contract = contractFor(seed)
      expect(contract.goalPortId).not.toBe(contract.startPortId)
      expect(PORTS.map((port) => port.id)).toContain(contract.goalPortId)
      expect(contractFor(seed)).toEqual(contract)
    }
  })

  it('모든 항구가 출발과 목표로 뽑힌다 — 남쪽 항로의 항구도 계약에 든다', () => {
    const starts = new Set<string>()
    const goals = new Set<string>()
    for (let seed = 0; seed < 500; seed += 1) {
      const contract = contractFor(seed)
      starts.add(contract.startPortId)
      goals.add(contract.goalPortId)
    }
    const ids = PORTS.map((port) => port.id)
    expect([...starts].sort()).toEqual([...ids].sort())
    expect([...goals].sort()).toEqual([...ids].sort())
    expect(ids).toEqual(
      expect.arrayContaining(['funchal', 'las-palmas', 'arguim', 'ribeira-grande']),
    )
  })

  it('데일리는 날짜에서만 나오고 메타를 들고 가지 않는다', () => {
    expect(dailyKey(new Date(Date.UTC(2026, 9, 8, 23)))).toBe('2026-10-08')
    expect(dailyConfig('2026-10-08')).toEqual(dailyConfig('2026-10-08'))
    expect(dailyConfig('2026-10-08').seed).not.toBe(dailyConfig('2026-10-09').seed)
    expect(dailyConfig('2026-10-08').knownPortIds).toEqual([])
  })

  it('자유 원정은 메타의 아는 항구를 들고 가고, 그 둘레가 처음부터 보인다', () => {
    const meta = { ...createMeta(), knownPortIds: ['angra'] }
    const config = freeConfig(3, meta)
    expect(config.knownPortIds).toEqual(['angra'])
    const run = createRun(config, grid)
    expect(run.explored.has(grid.cellOfPort('angra') as Cell)).toBe(true)
  })
})

describe('배 고르기 — 명성이 선형을 연다', () => {
  it('처음에는 두 카라벨만 열려 있고, 명성이 문턱을 넘으면 나우가 열린다', () => {
    const open = (fame: number): string[] =>
      shipChoices(fame)
        .filter((choice) => choice.open)
        .map((choice) => choice.shipClass.id)
    expect(open(0)).toEqual(['caravela-latina', 'caravela-redonda'])
    expect(open(FAME.nauFame)).toContain('nau')
  })

  it('고른 선형은 설정으로만 넘어가고, 그 배의 제원으로 출항한다', () => {
    const meta = { ...createMeta(), fame: FAME.nauFame }
    const config = freeConfig(3, meta, 'nau')
    expect(config.shipClassId).toBe('nau')
    expect(contractFor(3)).toMatchObject({ startPortId: config.startPortId })
    const run = createRun(config, grid)
    expect(run.supplies.holdTons).toBe(220)
    expect(run.supplies.crew).toBe(55)
  })

  it('열리지 않은 선형은 고를 수 없고, 데일리는 명성과 무관하게 혼합 카라벨이다', () => {
    expect(() => freeConfig(3, createMeta(), 'nau')).toThrow()
    expect(() => freeConfig(3, createMeta(), 'galeao')).toThrow()
    expect(dailyConfig('2026-10-08').shipClassId).toBe('caravela-redonda')
  })
})

describe('원정의 끝 — 목표 항구에 배로 들어오면 성공이다', () => {
  const CONFIG: RunConfig = {
    seed: 7,
    startDate: { year: 1502, month: 3, day: 14 },
    startPortId: 'lisboa',
    goalPortId: 'lisboa',
    shipClassId: 'caravela-redonda',
  }

  it('출항했다가 목표 항구로 돌아오면 arrived로 끝나고, 기록과 메타가 만들어진다', () => {
    const run = createRun(CONFIG, grid)
    expect(recordOf(run, null)).toBeNull()
    let arrived = false
    for (const dir of DIRECTIONS) {
      if (arrived) {
        break
      }
      applyCommand(run, { type: 'move', dir })
      if (grid.portAt(run.player.cell) === null) {
        const events = applyCommand(run, { type: 'move', dir: opposite(dir) })
        arrived = events.some((e) => e.type === 'ended' && e.reason === 'arrived')
      }
    }
    expect(arrived).toBe(true)
    expect(run.ended).toBe('arrived')

    const record = recordOf(run, '2026-10-08') as RunRecord
    expect(record).toMatchObject({
      outcome: 'arrived',
      daily: '2026-10-08',
      crewLeft: run.supplies.crew,
    })
    const meta = applyRunToMeta(createMeta(), run, record)
    expect(meta.knownPortIds).toEqual(['lisboa'])
    // 도착 몫 + 처음 들어간 리스본의 몫. 출항 금화보다 늘지 않았으니 이익 몫은 없다.
    const fame = FAME.fameArrived + FAME.fameDiscovery
    expect(meta.records).toEqual([{ ...record, fame }])
    expect(meta.fame).toBe(fame)
    expect(meta.languageDocks).toEqual({ portuguese: 1 })
  })
})

describe('리더보드 순서 — 도착 > 짧은 날수 > 남긴 선원', () => {
  const base: RunRecord = {
    config: {
      seed: 1,
      startDate: { year: 1502, month: 1, day: 1 },
      startPortId: 'lisboa',
      shipClassId: 'x',
    },
    daily: null,
    outcome: 'arrived',
    days: 10,
    crewAtStart: 32,
    crewLeft: 30,
    defeated: 0,
    regions: 2,
  }

  it('도착한 원정이 먼저이고, 그 안에서는 빠른 쪽, 같으면 선원을 많이 남긴 쪽', () => {
    const lost = { ...base, outcome: 'crew-lost' as const, days: 3, regions: 9 }
    const slow = { ...base, days: 12 }
    const fewer = { ...base, crewLeft: 10 }
    const sorted = [lost, slow, fewer, base].sort(compareRecords)
    expect(sorted).toEqual([base, fewer, slow, lost])
  })

  it('금화는 날수·선원이 같을 때만 순서를 가른다', () => {
    const rich = { ...base, gold: 5000 }
    const richButSlow = { ...base, days: 11, gold: 99999 }
    const poor = { ...base, gold: 100 }
    expect([poor, richButSlow, rich].sort(compareRecords)).toEqual([rich, poor, richButSlow])
  })

  it('항복은 들른 영역이 같을 때만 전멸보다 위다 — 일찍 항복해 순위를 사지 못한다', () => {
    const sunk = { ...base, outcome: 'hull-lost' as const, days: 40, regions: 3 }
    const yielded = { ...base, outcome: 'surrendered' as const, days: 5, regions: 3 }
    const yieldedEarly = { ...base, outcome: 'surrendered' as const, days: 2, regions: 1 }
    expect([yieldedEarly, sunk, yielded].sort(compareRecords)).toEqual([
      yielded,
      sunk,
      yieldedEarly,
    ])
  })

  it('뭍에서 끝난 원정의 남은 선원은 배 지킴이와 뭍 무리를 더한 것이다', () => {
    const run = createRun(freeConfig(11, createMeta()), grid)
    run.party = { crew: 5, food: 0, water: 0 }
    run.supplies.crew = 7
    run.ended = 'surrendered'
    expect(recordOf(run, null)?.crewLeft).toBe(12)
  })

  it('항복한 원정은 죽은 원정처럼 도착·이익의 명성을 받지 않는다', () => {
    const run = createRun(freeConfig(11, createMeta()), grid)
    run.defeated = 1
    run.ended = 'surrendered'
    run.supplies.gold += 5000
    const meta = applyRunToMeta(createMeta(), run, recordOf(run, null) as RunRecord)
    expect(meta.fame).toBe(FAME.fameDefeated + FAME.fameDiscovery)
  })
})

describe('명성·어학 — 끝난 원정에서만 쌓이고, 설정을 거쳐 다음 원정에 닿는다', () => {
  const seasoned = {
    ...createMeta(),
    fame: 300,
    languageDocks: { castilian: FAME.languageDocksToLearn, arabic: 1, portuguese: 9 },
  }

  it('같은 시드라도 메타가 다르면 다른 설정이고, 데일리는 메타와 무관하게 같다', () => {
    const fresh = freeConfig(11, createMeta())
    const veteran = freeConfig(11, seasoned)
    expect(fresh).not.toEqual(veteran)
    expect(veteran.patronGold).toBe(300 * FAME.patronGoldPerFame)
    expect(veteran.languages).toEqual(['castilian'])
    expect(fresh).toMatchObject({ patronGold: 0, languages: [] })
    expect(dailyConfig('2026-10-08')).toMatchObject({ patronGold: 0, languages: [] })
  })

  it('후원금은 출항 금화에 더해지고 상한이 있다', () => {
    const run = createRun(freeConfig(11, seasoned), grid)
    expect(run.supplies.gold).toBe(TRADE.startGold + 300 * FAME.patronGoldPerFame)
    const legend = freeConfig(11, { ...createMeta(), fame: 1_000_000 })
    expect(legend.patronGold).toBe(FAME.patronGoldMax)
  })

  it('죽은 원정도 물리친 조우와 처음 들어간 항구의 명성은 남긴다', () => {
    const run = createRun(freeConfig(11, createMeta()), grid)
    run.defeated = 2
    run.ended = 'crew-lost'
    run.supplies.gold += 5000
    const record = recordOf(run, null) as RunRecord
    const meta = applyRunToMeta(createMeta(), run, record)
    expect(meta.fame).toBe(2 * FAME.fameDefeated + FAME.fameDiscovery)
  })

  it('옛 메타(버전 1)를 읽으면 명성·어학이 0인 버전 2가 된다', () => {
    const old: MetaStateV1 = {
      version: 1,
      knownPortIds: ['angra'],
      visitedRegions: ['1,2'],
      records: [],
    }
    expect(migrateMeta(old)).toEqual({
      ...old,
      version: 2,
      fame: 0,
      languageDocks: {},
    })
    const current = createMeta()
    expect(migrateMeta(current)).toBe(current)
  })
})
