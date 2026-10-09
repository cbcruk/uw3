import { describe, expect, it } from 'vite-plus/test'
import { COMBAT } from '../../content/game/combat.tuning'
import { GOOD_BASE_PRICE } from '../../content/game/trade.tuning'
import { MOUNT } from '../../content/game/mounts.tuning'
import { PROVISION } from '../../content/game/provisions.tuning'
import { findShipClass } from '../../content/ships'
import { toDayNumber } from '../../sim/calendar/calendar'
import type { ShipClass } from '../../sim/ship/ship.types'
import { regionKey, regionOf } from '../region/region'
import { isInSight } from '../fog/fog'
import { DIRECTIONS } from '../grid/direction'
import { dailyRangeNm, passageToward, waterRatio } from '../travel/travel'
import { applyCommand, createRun, createWorld, currentDay, rangeTowardNm, replayRun } from './run'
import type { Cell } from '../grid/world-grid.types'
import type { Command, RunConfig, RunEvent } from './run.types'
import type { Provisioned } from '../supplies/supplies.types'

const grid = createWorld()

const CONFIG: RunConfig = {
  seed: 7,
  startDate: { year: 1502, month: 3, day: 14 },
  startPortId: 'lisboa',
  shipClassId: 'caravela-redonda',
}

function eventsOf<T extends RunEvent['type']>(
  events: readonly RunEvent[],
  type: T,
): Extract<RunEvent, { type: T }>[] {
  return events.filter((e): e is Extract<RunEvent, { type: T }> => e.type === type)
}

describe('배의 하루 행정 — 시뮬의 바람과 돛을 그대로 쓴다', () => {
  const shipClass = findShipClass(CONFIG.shipClassId) as ShipClass
  const dayNumber = toDayNumber(CONFIG.startDate)

  it('편서풍대에서 서쪽은 태킹이라 동쪽보다 훨씬 느리다', () => {
    const position = { lat: 40, lon: -30 }
    const passage = (dir: 'w' | 'e') =>
      passageToward({ conveyance: 'ship', terrain: 'sea', position, dayNumber, dir, shipClass })
    expect(passage('w').tacking).toBe(true)
    expect(passage('e').tacking).toBe(false)
    expect(passage('w').rangeNm).toBeGreaterThan(0)
    expect(passage('w').rangeNm).toBeLessThan(passage('e').rangeNm / 2)
  })

  it('바람이 있으면 바다에서 막힌 방향이 없다 — 폭 1칸 수로에서도 갇히지 않는다', () => {
    const position = { lat: 38.7, lon: -9.4 }
    for (const dir of DIRECTIONS) {
      const range = dailyRangeNm({
        conveyance: 'ship',
        terrain: 'sea',
        position,
        dayNumber,
        dir,
        shipClass,
      })
      expect(range).toBeGreaterThan(0)
    }
  })

  it('라틴돛이 사각돛보다 역풍에 강하다', () => {
    const latina = findShipClass('caravela-latina') as ShipClass
    const base = {
      conveyance: 'ship' as const,
      terrain: 'sea' as const,
      position: { lat: 40, lon: -30 },
      dayNumber,
      dir: 'w' as const,
    }
    expect(dailyRangeNm({ ...base, shipClass: latina })).toBeGreaterThan(
      dailyRangeNm({ ...base, shipClass }),
    )
  })

  it('무역풍대에서는 서쪽이 빠르다', () => {
    const position = { lat: 18, lon: -35 }
    const west = dailyRangeNm({
      conveyance: 'ship',
      terrain: 'sea',
      position,
      dayNumber,
      dir: 'w',
      shipClass,
    })
    expect(west).toBeGreaterThan(MOUNT.horseGrassland)
  })

  it('배는 뭍으로, 말은 바다로 못 간다', () => {
    const base = { position: { lat: 40, lon: -4 }, dayNumber, dir: 'e' as const, shipClass }
    expect(dailyRangeNm({ ...base, conveyance: 'ship', terrain: 'grassland' })).toBe(0)
    expect(dailyRangeNm({ ...base, conveyance: 'horse', terrain: 'sea' })).toBe(0)
  })
})

describe('런 — 방향키 한 번이 한 칸', () => {
  it('리스본에 정박한 배로 시작한다', () => {
    const run = createRun(CONFIG, grid)
    expect(run.player.conveyance).toBe('ship')
    expect(grid.portAt(run.player.cell)).toBe('lisboa')
  })

  it('한 번에 정확히 한 칸 가고, 그 칸을 지나는 시간만큼 흐른다', () => {
    const run = createRun(CONFIG, grid)
    const start = run.player.cell
    const events = applyCommand(run, { type: 'move', dir: 's' })
    const moves = eventsOf(events, 'move')
    expect(moves).toHaveLength(1)
    expect(run.player.cell).toEqual({ x: start.x, y: start.y + 1 })
    const expected = (grid.stepNm(start, 's') / rangeTowardNm(createRun(CONFIG, grid), 's')) * 24
    expect(run.elapsedHours).toBeCloseTo(expected, 9)
    expect(moves[0]?.hours).toBeCloseTo(expected, 9)
  })

  it('뱃머리는 움직인 방향을 향하고, 막히거나 기다려도 그대로다', () => {
    const run = createRun(CONFIG, grid)
    expect(eventsOf(applyCommand(run, { type: 'move', dir: 'ne' }), 'blocked')).toHaveLength(1)
    expect(run.player.facing).toBe('w')
    applyCommand(run, { type: 'move', dir: 's' })
    expect(run.player.facing).toBe('s')
    applyCommand(run, { type: 'wait' })
    expect(run.player.facing).toBe('s')
    applyCommand(run, { type: 'move', dir: 'sw' })
    expect(run.player.facing).toBe('sw')
  })

  it('배로 뭍을 향하면 막히고 시간이 흐르지 않는다', () => {
    const run = createRun(CONFIG, grid)
    const start = run.player.cell
    const events = applyCommand(run, { type: 'move', dir: 'ne' })
    expect(eventsOf(events, 'blocked')[0]?.reason).toBe('terrain')
    expect(run.player.cell).toEqual(start)
    expect(run.elapsedHours).toBe(0)
    expect(run.commands).toHaveLength(0)
  })

  it('3월 리스본에서 서쪽은 막히지 않지만 남쪽보다 두 배 가까이 걸린다', () => {
    const west = eventsOf(applyCommand(createRun(CONFIG, grid), { type: 'move', dir: 'w' }), 'move')
    const south = eventsOf(
      applyCommand(createRun(CONFIG, grid), { type: 'move', dir: 's' }),
      'move',
    )
    expect(west).toHaveLength(1)
    expect(west[0]?.hours).toBeGreaterThan((south[0]?.hours ?? 0) * 1.5)
  })

  it('기다리면 다음 날로 넘어간다', () => {
    const run = createRun(CONFIG, grid)
    applyCommand(run, { type: 'move', dir: 's' })
    const events = applyCommand(run, { type: 'wait' })
    expect(currentDay(run)).toBe(1)
    expect(run.elapsedHours).toBe(24)
    expect(eventsOf(events, 'day-start')[0]?.day).toBe(1)
  })

  it('배는 한 칸에 몇 시간, 말은 반나절 가까이 걸린다', () => {
    const run = createRun(CONFIG, grid)
    const sailHours = eventsOf(applyCommand(run, { type: 'move', dir: 's' }), 'move')[0]?.hours
    applyCommand(run, { type: 'move', dir: 'n' })
    applyCommand(run, { type: 'disembark', mount: 'horse' })
    const rideHours = eventsOf(applyCommand(run, { type: 'move', dir: 'e' }), 'move')[0]?.hours
    expect(sailHours).toBeLessThan(4)
    expect(rideHours).toBeGreaterThan(8)
  })

  it('바다에서는 내릴 수 없다', () => {
    const run = createRun(CONFIG, grid)
    applyCommand(run, { type: 'move', dir: 's' })
    const events = applyCommand(run, { type: 'disembark', mount: 'horse' })
    expect(eventsOf(events, 'rejected')).toHaveLength(1)
    expect(run.commands).toHaveLength(1)
  })

  it('항구에서 말로 내려 뭍을 가고, 배를 둔 항구로 돌아와 다시 오른다', () => {
    const run = createRun(CONFIG, grid)
    const port = run.player.cell
    applyCommand(run, { type: 'disembark', mount: 'horse' })
    expect(run.player.conveyance).toBe('horse')
    expect(grid.terrainAt(run.player.cell)).toBe('grassland')
    expect(run.berth?.portId).toBe('lisboa')

    const ashore = run.player.cell
    applyCommand(run, { type: 'move', dir: 'e' })
    applyCommand(run, { type: 'move', dir: 'e' })
    expect(eventsOf(applyCommand(run, { type: 'embark' }), 'rejected')).toHaveLength(1)

    applyCommand(run, { type: 'move', dir: 'w' })
    applyCommand(run, { type: 'move', dir: 'w' })
    expect(run.player.cell).toEqual(ashore)
    expect(eventsOf(applyCommand(run, { type: 'embark' }), 'embark')[0]?.portId).toBe('lisboa')
    expect(run.player.cell).toEqual(port)
    expect(run.berth).toBeNull()
  })

  it('사막에 내린 원정은 날이 바뀔 때 탈것에 따라 물을 더 마신다', () => {
    const atArguim = (mount: 'horse' | 'camel') => {
      const run = createRun({ ...CONFIG, startPortId: 'arguim' }, grid)
      applyCommand(run, { type: 'disembark', mount })
      expect(grid.terrainAt(run.player.cell)).toBe('desert')
      const party = run.party as Provisioned
      const { food, water, crew } = party
      applyCommand(run, { type: 'wait' })
      return { food: food - party.food, water: water - party.water, crew }
    }
    const camel = atArguim('camel')
    const horse = atArguim('horse')
    expect(camel.food).toBe(camel.crew)
    expect(camel.water).toBe(Math.ceil(camel.crew * waterRatio('camel', 'desert')))
    expect(horse.water).toBe(Math.ceil(horse.crew * waterRatio('horse', 'desert')))
    expect(horse.water).toBeGreaterThan(camel.water)
  })

  it('말은 바다로 못 간다', () => {
    const run = createRun(CONFIG, grid)
    applyCommand(run, { type: 'disembark', mount: 'horse' })
    const ashore = run.player.cell
    const toSea = (['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const).find((dir) => {
      const next = grid.neighbor(ashore, dir)
      return next !== null && grid.terrainAt(next) === 'sea'
    })
    expect(toSea).toBeDefined()
    const events = applyCommand(run, { type: 'move', dir: toSea ?? 'w' })
    expect(eventsOf(events, 'blocked')[0]?.reason).toBe('terrain')
  })

  it('영역 경계를 넘으면 새 층에 들어선다', () => {
    const run = createRun(CONFIG, grid)
    const start = regionKey(run.region)
    const entered: RunEvent[] = []
    for (let step = 0; step < 60 && entered.length === 0; step += 1) {
      entered.push(...eventsOf(applyCommand(run, { type: 'move', dir: 's' }), 'region'))
    }
    expect(entered).toHaveLength(1)
    expect(regionKey(run.region)).not.toBe(start)
    expect(run.visitedRegions.size).toBe(2)
  })

  it('seed와 명령 로그로 같은 런이 다시 나온다', () => {
    const commands: Command[] = [
      { type: 'move', dir: 's' },
      { type: 'move', dir: 's' },
      { type: 'wait' },
      { type: 'move', dir: 'w' },
      { type: 'move', dir: 'sw' },
      { type: 'move', dir: 's' },
    ]
    const run = createRun(CONFIG, grid)
    for (const command of commands) {
      applyCommand(run, command)
    }
    const again = replayRun(CONFIG, run.commands, grid)
    expect(again.player).toEqual(run.player)
    expect(again.elapsedHours).toBe(run.elapsedHours)
    expect(again.visitedRegions).toEqual(run.visitedRegions)
  })
})

describe('원정의 보급 — 날이 바뀔 때 먹고, 항구에서 채운다', () => {
  /** 리스본에서 항구가 아닌 바다 칸에 닿을 때까지 나간다. */
  function runAtSea() {
    const run = createRun(CONFIG, grid)
    for (const dir of DIRECTIONS) {
      applyCommand(run, { type: 'move', dir })
      if (grid.portAt(run.player.cell) === null) {
        return run
      }
    }
    throw new Error('리스본에서 나갈 바다가 없다')
  }

  it('바다에서 하루를 넘기면 선원 수만큼 줄어든다', () => {
    const run = runAtSea()
    const { crew, food, water } = run.supplies
    const events = applyCommand(run, { type: 'wait' })
    expect(eventsOf(events, 'day-start')).toHaveLength(1)
    expect(run.supplies.food).toBe(food - crew)
    expect(run.supplies.water).toBe(water - crew)
  })

  it('항구에서 기다리면 먹은 만큼 다시 채운다', () => {
    const run = createRun(CONFIG, grid)
    applyCommand(run, { type: 'wait' })
    expect(run.supplies.food).toBe(run.supplies.capacity)
  })

  it('보급이 바닥난 채 선원을 다 잃으면 런이 끝나고 더 이상 명령을 받지 않는다', () => {
    const run = runAtSea()
    Object.assign(run.supplies, { crew: 1, food: 0, water: 0 })
    const events = applyCommand(run, { type: 'wait' })
    expect(eventsOf(events, 'ration')).toEqual([
      { type: 'ration', ashore: false, lost: 1, starving: true, thirsty: true },
    ])
    expect(eventsOf(events, 'ended')).toEqual([{ type: 'ended', reason: 'crew-lost' }])
    expect(run.ended).toBe('crew-lost')

    const commandsBefore = run.commands.length
    const after = applyCommand(run, { type: 'wait' })
    expect(eventsOf(after, 'rejected')).toHaveLength(1)
    expect(run.commands).toHaveLength(commandsBefore)
  })
})

describe('런의 조우 — 처음 들어간 영역에만 생기고, 처음 보일 때 알린다', () => {
  it('출발 영역의 조우는 런을 만들 때 놓인다', () => {
    const run = createRun(CONFIG, grid)
    expect(run.encounters.every((e) => regionKey(regionOf(e.cell)) === regionKey(run.region))).toBe(
      true,
    )
  })

  it('다시 들어간 영역에는 조우를 더 놓지 않는다', () => {
    const run = createRun(CONFIG, grid)
    const start = run.region
    for (let i = 0; i < 200 && run.visitedRegions.size < 2; i += 1) {
      applyCommand(run, { type: 'move', dir: 's' })
    }
    expect(run.visitedRegions.size).toBe(2)
    const total = run.encounters.length
    for (let i = 0; i < 200 && regionKey(run.region) !== regionKey(start); i += 1) {
      applyCommand(run, { type: 'move', dir: 'n' })
    }
    expect(regionKey(run.region)).toBe(regionKey(start))
    expect(run.encounters).toHaveLength(total)
  })

  it('조우는 보일 때 한 번만 알리고, 재현하면 같은 조우를 같은 순서로 본다', () => {
    const run = createRun(CONFIG, grid)
    const sighted: string[] = []
    for (let i = 0; i < 60; i += 1) {
      const events = applyCommand(run, { type: 'move', dir: i % 2 === 0 ? 's' : 'sw' })
      sighted.push(...eventsOf(events, 'sighted').map((e) => e.encounterId))
    }
    expect(sighted.length).toBeGreaterThan(0)
    expect(new Set(sighted).size).toBe(sighted.length)
    expect([...run.sighted]).toEqual(expect.arrayContaining(sighted))

    const replayed = replayRun(CONFIG, run.commands, grid)
    expect(replayed.encounters).toEqual(run.encounters)
    expect(replayed.sighted).toEqual(run.sighted)
  })
})

describe('런의 추격 — 플레이어의 명령이 흘린 시간만큼 조우가 움직인다', () => {
  /** 대양 한복판에 놓은 배와, 같은 줄 `dx`칸 옆의 해적 하나. */
  function seaRunWithPirate(dx: number) {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    run.encounters = [
      {
        id: 'pirate-test',
        kind: 'pirate',
        cell: { x: run.player.cell.x + dx, y: run.player.cell.y },
        crew: 30,
        crewAtStart: 30,
        conveyance: 'ship',
        nextActHours: 0,
        rounds: 0,
        chasing: false,
      },
    ]
    return run
  }

  it('조우가 선 칸으로 가려 하면 들이받는다 — 한 합을 치르고 그만큼 시간이 흐른다', () => {
    const run = seaRunWithPirate(1)
    const hours = run.elapsedHours
    const crew = run.supplies.crew
    const events = applyCommand(run, { type: 'move', dir: 'e' })
    const [round] = eventsOf(events, 'combat')
    expect(round).toMatchObject({ encounterId: 'pirate-test', initiated: true })
    expect(run.elapsedHours).toBe(hours + COMBAT.roundHours)
    expect(run.supplies.crew).toBeLessThanOrEqual(crew)
    expect(run.player.cell).not.toEqual(run.encounters[0]?.cell)
  })

  it('기다리는 동안 보이는 해적이 따라와 붙는다', () => {
    const run = seaRunWithPirate(-3)
    const events = applyCommand(run, { type: 'wait' })
    expect(eventsOf(events, 'chase')).toHaveLength(1)
    expect(eventsOf(events, 'engaged')).toHaveLength(1)
  })
})

describe('전투 — 붙으면 양쪽이 머릿수를 잃는다', () => {
  function seaRunNextTo(crew: number) {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    run.encounters = [
      {
        id: 'pirate-test',
        kind: 'pirate',
        cell: { x: run.player.cell.x + 1, y: run.player.cell.y },
        crew,
        crewAtStart: crew,
        conveyance: 'ship',
        nextActHours: 0,
        rounds: 0,
        chasing: false,
      },
    ]
    return run
  }

  it('적이 붙어 있으면 기다리기는 하루가 아니라 한 합이다', () => {
    const run = seaRunNextTo(30)
    const before = run.elapsedHours
    const events = applyCommand(run, { type: 'wait' })
    expect(run.elapsedHours - before).toBe(COMBAT.roundHours)
    expect(eventsOf(events, 'combat').length).toBeGreaterThan(0)
    expect(eventsOf(events, 'combat').every((e) => !e.initiated)).toBe(true)
  })

  it('작은 무리는 들이받아 물리치고, 물리친 조우는 격자에서 사라진다', () => {
    const run = seaRunNextTo(2)
    let defeated = false
    for (let i = 0; i < 10 && !defeated; i += 1) {
      const events = applyCommand(run, { type: 'move', dir: 'e' })
      defeated = [...eventsOf(events, 'defeated'), ...eventsOf(events, 'routed')].length > 0
    }
    expect(defeated).toBe(true)
    expect(run.encounters).toHaveLength(0)
  })

  it('물리친 해적은 처음 머릿수만큼 노획을 남긴다 — 물러나도 남긴다', () => {
    const run = seaRunNextTo(20)
    const gold = run.supplies.gold
    let plunder: RunEvent[] = []
    for (let i = 0; i < 20 && plunder.length === 0; i += 1) {
      plunder = eventsOf(applyCommand(run, { type: 'move', dir: 'e' }), 'plunder')
    }
    expect(plunder).toEqual([
      {
        type: 'plunder',
        encounterId: 'pirate-test',
        kind: 'pirate',
        gold: 20 * COMBAT.plunderGold,
      },
    ])
    expect(run.supplies.gold).toBe(gold + 20 * COMBAT.plunderGold)
    expect(run.defeated).toBe(1)
  })

  it('큰 해적에게 선원이나 선체를 다 잃으면 원정이 끝난다', () => {
    const run = seaRunNextTo(400)
    let ended = false
    for (let i = 0; i < 100 && !ended; i += 1) {
      ended = eventsOf(applyCommand(run, { type: 'wait' }), 'ended').length > 0
    }
    expect(ended).toBe(true)
    expect(run.ended === 'crew-lost' || run.ended === 'hull-lost').toBe(true)
    expect(eventsOf(applyCommand(run, { type: 'wait' }), 'rejected')).toHaveLength(1)
  })

  it('같은 시드·같은 명령이면 같은 전투 결과다', () => {
    const play = () => {
      const run = seaRunNextTo(30)
      for (let i = 0; i < 5; i += 1) {
        applyCommand(run, { type: 'move', dir: 'e' })
      }
      return { supplies: run.supplies, encounters: run.encounters }
    }
    expect(play()).toEqual(play())
  })
})

describe('선원 고용 — 항구에서 정원까지 채운다', () => {
  it('정박 중에는 정원까지 모으고 시간이 흐른다. 이미 차 있으면 거절한다', () => {
    const run = createRun(CONFIG, grid)
    const hours = run.elapsedHours
    const events = applyCommand(run, { type: 'hire' })
    const hire = eventsOf(events, 'hire')[0]
    expect(hire?.hired).toBeGreaterThan(0)
    expect(hire?.wage).toBe((hire?.hired ?? 0) * PROVISION.hireWage)
    expect(run.supplies.crew).toBe(run.shipClass.crewMax)
    expect(run.elapsedHours).toBe(hours + PROVISION.hireHours)
    expect(eventsOf(applyCommand(run, { type: 'hire' }), 'rejected')).toHaveLength(1)
  })

  it('금화가 모자라면 낼 수 있는 만큼만 모으고, 한 명도 못 내면 거절한다', () => {
    const run = createRun(CONFIG, grid)
    run.supplies.gold = PROVISION.hireWage * 3
    expect(eventsOf(applyCommand(run, { type: 'hire' }), 'hire')[0]?.hired).toBe(3)
    expect(run.supplies.gold).toBe(0)
    expect(eventsOf(applyCommand(run, { type: 'hire' }), 'rejected')).toHaveLength(1)
  })

  it('바다에서는 모을 수 없다', () => {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    expect(eventsOf(applyCommand(run, { type: 'hire' }), 'rejected')).toHaveLength(1)
  })
})

describe('내주기 — 몸값을 주고 붙은 조우에게서 놓여난다', () => {
  function seaRunNextTo(crew: number, kind: 'pirate' | 'beast' = 'pirate') {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    run.encounters = [
      {
        id: `${kind}-test`,
        kind,
        cell: { x: run.player.cell.x + 1, y: run.player.cell.y },
        crew,
        crewAtStart: crew,
        conveyance: 'ship',
        nextActHours: 0,
        rounds: 0,
        chasing: true,
      },
    ]
    return run
  }

  it('해적은 머릿수만큼 금화를 받고 사라지며, 물리친 수에는 들지 않는다', () => {
    const run = seaRunNextTo(40)
    const { gold, food, water, crew } = run.supplies
    const hours = run.elapsedHours
    const events = applyCommand(run, { type: 'tribute' })
    const ransom = 40 * COMBAT.tributeGold
    expect(eventsOf(events, 'tribute')).toEqual([
      { type: 'tribute', encounterId: 'pirate-test', kind: 'pirate', food: 0, gold: ransom },
    ])
    expect(eventsOf(events, 'ransom')).toEqual([{ type: 'ransom', gold: ransom, cargo: {} }])
    expect(run.supplies).toMatchObject({ gold: gold - ransom, food, water, crew })
    expect(run.elapsedHours).toBe(hours + COMBAT.roundHours)
    expect(run.encounters).toHaveLength(0)
    expect(run.defeated).toBe(0)
    expect(eventsOf(events, 'combat')).toHaveLength(0)
  })

  it('금화가 모자라면 비싼 화물부터 기준값으로 쳐서 채운다', () => {
    const run = seaRunNextTo(40)
    run.supplies.gold = 100
    run.supplies.cargo = { salt: 30, sugar: 10 }
    const events = applyCommand(run, { type: 'tribute' })
    const ransom = eventsOf(events, 'ransom')[0]
    expect(ransom?.gold).toBe(100)
    const owed = 40 * COMBAT.tributeGold - 100
    const sugarTons = Math.ceil(owed / GOOD_BASE_PRICE.sugar)
    expect(ransom?.cargo).toEqual({ sugar: sugarTons })
    expect(run.supplies.gold).toBe(0)
    expect(run.supplies.cargo).toEqual({ salt: 30, sugar: 10 - sugarTons })
  })

  it('늑대는 금화가 아니라 식량을 가져간다', () => {
    const run = seaRunNextTo(10, 'beast')
    run.player.conveyance = 'horse'
    const cell = grid.cellOf({ lat: 40, lon: -4 }) as Cell
    run.player.cell = cell
    const foe = run.encounters[0]
    if (foe !== undefined) {
      foe.cell = { x: cell.x + 1, y: cell.y }
      foe.conveyance = 'horse'
    }
    const { gold, food } = run.supplies
    applyCommand(run, { type: 'tribute' })
    const share = Math.ceil(10 * COMBAT.tributeDays)
    expect(run.supplies).toMatchObject({ gold, food: food - share })
  })

  it('금화와 화물을 합쳐도 모자라면 거절하고 시간도 흐르지 않는다', () => {
    const run = seaRunNextTo(400)
    const hours = run.elapsedHours
    const gold = run.supplies.gold
    const events = applyCommand(run, { type: 'tribute' })
    expect(eventsOf(events, 'rejected')).toHaveLength(1)
    expect(run.elapsedHours).toBe(hours)
    expect(run.supplies.gold).toBe(gold)
    expect(run.encounters).toHaveLength(1)
  })

  it('붙은 상대가 없으면 거절한다', () => {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    run.encounters = []
    expect(eventsOf(applyCommand(run, { type: 'tribute' }), 'rejected')).toHaveLength(1)
  })

  it('항복하면 금화·화물을 넘기고 선원은 산 채로 원정이 끝난다', () => {
    const run = seaRunNextTo(400)
    run.supplies.cargo = { sugar: 10 }
    const { gold, crew } = run.supplies
    const events = applyCommand(run, { type: 'surrender' })
    expect(eventsOf(events, 'surrender')).toEqual([
      { type: 'surrender', gold, cargo: { sugar: 10 } },
    ])
    expect(run.ended).toBe('surrendered')
    expect(run.supplies).toMatchObject({ gold: 0, cargo: {}, crew })
    expect(eventsOf(events, 'combat')).toHaveLength(0)
    expect(eventsOf(applyCommand(run, { type: 'wait' }), 'rejected')).toHaveLength(1)
  })

  it('붙은 사람 무리가 없으면 항복을 받지 않는다', () => {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    run.encounters = []
    expect(eventsOf(applyCommand(run, { type: 'surrender' }), 'rejected')).toHaveLength(1)
    expect(run.ended).toBeNull()
  })
})

describe('뭍 무리 — 하선한 인원만 뭍에서 먹고 싸운다', () => {
  function ashore(crew?: number) {
    const run = createRun(CONFIG, grid)
    const before = { ...run.supplies }
    const events = applyCommand(run, { type: 'disembark', mount: 'horse', crew })
    return { run, before, events }
  }

  it('내린 인원이 머릿수만큼 식량·물을 나눠 들고, 나머지는 배를 지킨다', () => {
    const { run, before, events } = ashore(10)
    const food = Math.floor((before.food * 10) / before.crew)
    expect(eventsOf(events, 'disembark')[0]?.crew).toBe(10)
    expect(run.party).toEqual({
      crew: 10,
      food,
      water: food,
      landed: { crew: 10, food, water: food },
    })
    expect(run.supplies).toMatchObject({ crew: before.crew - 10, food: before.food - food })
  })

  it('인원이 없는 옛 하선 명령은 전원 하선으로 읽힌다', () => {
    const { run, before } = ashore()
    expect(run.party?.crew).toBe(before.crew)
    expect(run.supplies.crew).toBe(0)
    expect(run.ended).toBeNull()
    const gold = run.supplies.gold
    applyCommand(run, { type: 'wait' })
    expect(run.supplies.gold).toBe(gold)
  })

  it('맞지 않는 인원은 거절하고 시간도 흐르지 않는다', () => {
    for (const crew of [0, 1.5, 999]) {
      const { run, events } = ashore(crew)
      expect(eventsOf(events, 'rejected')).toHaveLength(1)
      expect(run.party).toBeNull()
      expect(run.commands).toHaveLength(0)
    }
  })

  it('날이 바뀌면 뭍 무리는 들고 간 것을 먹고, 배는 항구에서 다시 채운다', () => {
    const { run } = ashore(10)
    const party = run.party as Provisioned
    const partyFood = party.food
    applyCommand(run, { type: 'wait' })
    expect(party.food).toBe(partyFood - 10)
    expect(run.supplies.food).toBe(run.supplies.capacity)
  })

  it('배에 오르면 뭍 무리가 합쳐지고, 넘치는 식량·물은 그 자리에서 되판다 — 곧바로 떠나도 상한 안이다', () => {
    const { run, before } = ashore(10)
    applyCommand(run, { type: 'wait' })
    const gold = run.supplies.gold
    const events = applyCommand(run, { type: 'embark' })
    expect(run.party).toBeNull()
    expect(run.supplies.crew).toBe(before.crew)
    expect(run.supplies.food).toBe(run.supplies.capacity)
    expect(run.supplies.water).toBe(run.supplies.capacity)
    expect(eventsOf(events, 'resupply')[0]?.gold).toBe(run.supplies.gold - gold)
    expect(run.supplies.gold).toBeGreaterThan(gold)
  })

  it('뭍에서 늑대에게 내주는 식량은 뭍 무리의 것이다', () => {
    const { run } = ashore(10)
    const party = run.party as Provisioned
    const shipFood = run.supplies.food
    const partyFood = party.food
    run.encounters = [
      {
        id: 'beast-test',
        kind: 'beast',
        cell: { x: run.player.cell.x + 1, y: run.player.cell.y },
        crew: 6,
        crewAtStart: 6,
        conveyance: 'horse',
        nextActHours: 0,
        rounds: 0,
        chasing: true,
      },
    ]
    applyCommand(run, { type: 'tribute' })
    expect(party.food).toBe(partyFood - Math.ceil(6 * COMBAT.tributeDays))
    expect(run.supplies.food).toBe(shipFood)
  })

  it('뭍 무리가 굶으면 뭍의 일로 알린다', () => {
    const { run } = ashore(10)
    Object.assign(run.party as Provisioned, { food: 0 })
    const ration = eventsOf(applyCommand(run, { type: 'wait' }), 'ration')
    expect(ration).toHaveLength(1)
    expect(ration[0]).toMatchObject({ ashore: true, starving: true, thirsty: false })
  })

  it('한 합에 선원과 선체가 함께 바닥나면 crew-lost다', () => {
    const run = createRun(CONFIG, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    Object.assign(run.supplies, { crew: 1, hull: 1 })
    run.encounters = [
      {
        id: 'pirate-test',
        kind: 'pirate',
        cell: { x: run.player.cell.x + 1, y: run.player.cell.y },
        crew: 400,
        crewAtStart: 400,
        conveyance: 'ship',
        nextActHours: 0,
        rounds: 0,
        chasing: true,
      },
    ]
    applyCommand(run, { type: 'wait' })
    expect(run.supplies).toMatchObject({ crew: 0, hull: 0 })
    expect(run.ended).toBe('crew-lost')
  })

  it('뭍에서 싸우는 것은 뭍 무리뿐이다', () => {
    const { run } = ashore(10)
    const keepers = run.supplies.crew
    run.encounters = [
      {
        id: 'bandit-test',
        kind: 'bandit',
        cell: { x: run.player.cell.x + 1, y: run.player.cell.y },
        crew: 30,
        crewAtStart: 30,
        conveyance: 'horse',
        nextActHours: 0,
        rounds: 0,
        chasing: true,
      },
    ]
    applyCommand(run, { type: 'wait' })
    expect(run.party?.crew).toBeLessThan(10)
    expect(run.supplies.crew).toBe(keepers)
  })

  it('뭍 무리가 전멸하면 지킴이가 배에서 원정을 잇고, 지킴이가 없으면 끝난다', () => {
    const { run } = ashore(10)
    const port = grid.cellOfPort('lisboa') as Cell
    const party = run.party as Provisioned
    Object.assign(party, { crew: 1, food: 0, water: 0 })
    const events = applyCommand(run, { type: 'wait' })
    expect(eventsOf(events, 'party-lost')).toEqual([{ type: 'party-lost', portId: 'lisboa' }])
    expect(run.ended).toBeNull()
    expect(run.player).toMatchObject({ cell: port, conveyance: 'ship' })
    expect(run.party).toBeNull()

    const alone = ashore().run
    Object.assign(alone.party as Provisioned, { crew: 1, food: 0, water: 0 })
    applyCommand(alone, { type: 'wait' })
    expect(alone.ended).toBe('crew-lost')
  })
})

describe('어학 — 말이 통하는 항구에서 사람을 모으고 소문을 듣는다', () => {
  function rumoredRun(startPortId = 'lisboa', languages: RunConfig['languages'] = []) {
    for (let seed = 1; seed < 200; seed += 1) {
      const run = createRun({ ...CONFIG, seed, startPortId, languages }, grid)
      if (run.rumors.length > 0) {
        return run
      }
    }
    throw new Error('소문이 있는 시드를 찾지 못했다')
  }

  it('말이 통하는 출발 항구에서는 그 해역의 보이지 않는 조우를 들은 자리 그대로 안다', () => {
    const run = rumoredRun()
    const port = grid.cellOfPort('lisboa') as Cell
    for (const rumor of run.rumors) {
      const encounter = run.encounters.find((e) => e.id === rumor.encounterId)
      expect(encounter?.cell).toEqual(rumor.cell)
      expect(run.sighted.has(rumor.encounterId)).toBe(false)
      expect(regionKey(regionOf(rumor.cell))).toBe(regionKey(regionOf(port)))
    }
  })

  it('말을 모르는 항구에서는 소문을 듣지 못하고, 배우면 듣는다', () => {
    const deaf = createRun({ ...CONFIG, startPortId: 'malaga' }, grid)
    expect(deaf.rumors).toEqual([])
    expect(() => rumoredRun('malaga', ['castilian'])).not.toThrow()
  })

  it('소문의 자리는 조우가 움직여도 따라가지 않고, 직접 보면 지운다', () => {
    const run = rumoredRun()
    const rumor = run.rumors[0] as (typeof run.rumors)[number]
    const encounter = run.encounters.find((e) => e.id === rumor.encounterId)
    if (encounter === undefined) {
      throw new Error('소문의 조우가 없다')
    }
    const heardAt = rumor.cell
    encounter.cell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    expect(run.rumors[0]?.cell).toEqual(heardAt)
    applyCommand(run, { type: 'wait' })
    expect(run.rumors.some((r) => r.encounterId === encounter.id)).toBe(false)
  })

  it('다시 들으면 그 영역의 옛 소문을 새 소문으로 바꾼다', () => {
    const run = rumoredRun()
    const rumor = run.rumors[0] as (typeof run.rumors)[number]
    const encounter = run.encounters.find((e) => e.id === rumor.encounterId)
    if (encounter === undefined) {
      throw new Error('소문의 조우가 없다')
    }
    const moved = { x: encounter.cell.x, y: encounter.cell.y + 1 }
    encounter.cell = moved
    applyCommand(run, { type: 'move', dir: 's' })
    applyCommand(run, { type: 'move', dir: 'n' })
    const heard = run.rumors.find((r) => r.encounterId === encounter.id)
    expect(run.rumors.filter((r) => r.encounterId === encounter.id).length).toBeLessThanOrEqual(1)
    if (heard !== undefined) {
      expect(heard.cell).toEqual(encounter.cell)
      expect(heard.cell).not.toEqual(rumor.cell)
    }
  })

  it('조우가 격자에서 빠지면 보지 않았어도 소문을 지운다', () => {
    const run = rumoredRun()
    const rumor = run.rumors[0] as (typeof run.rumors)[number]
    const encounter = run.encounters.find((e) => e.id === rumor.encounterId)
    if (encounter === undefined) {
      throw new Error('소문의 조우가 없다')
    }
    encounter.crew = 0
    applyCommand(run, { type: 'wait' })
    expect(run.sighted.has(encounter.id)).toBe(false)
    expect(run.rumors.some((r) => r.encounterId === encounter.id)).toBe(false)
  })

  it('지금 보이는 조우는 소문으로 세지 않는다', () => {
    const run = rumoredRun()
    for (const rumor of run.rumors) {
      expect(isInSight(grid, run.player.cell, 'ship', rumor.cell)).toBe(false)
    }
  })

  it('말이 통하는 항구에 다시 들어가면 소문을 새로 듣는다', () => {
    const run = createRun(CONFIG, grid)
    applyCommand(run, { type: 'move', dir: 's' })
    const events = applyCommand(run, { type: 'move', dir: 'n' })
    expect(eventsOf(events, 'dock')[0]?.portId).toBe('lisboa')
    expect(eventsOf(events, 'rumor')).toEqual([
      { type: 'rumor', portId: 'lisboa', count: run.rumors.length },
    ])
  })

  it('말을 모르는 항구에서는 선원을 모을 수 없고, 배우면 모은다', () => {
    const deaf = createRun({ ...CONFIG, startPortId: 'malaga' }, grid)
    const crew = deaf.supplies.crew
    const rejected = eventsOf(applyCommand(deaf, { type: 'hire' }), 'rejected')
    expect(rejected[0]?.reason).toContain('카스티야어')
    expect(deaf.supplies.crew).toBe(crew)
    const fluent = createRun({ ...CONFIG, startPortId: 'malaga', languages: ['castilian'] }, grid)
    expect(eventsOf(applyCommand(fluent, { type: 'hire' }), 'hire')).toHaveLength(1)
  })
})

describe('교역 — 화물과 식량·물이 한 적재량을 나눠 쓴다', () => {
  const lisbonGood = 'salt' as const
  const angraOnly = 'woad' as const

  it('산 화물만큼 식량·물이 밀려나 되팔리고, 시간은 흐르지 않는다', () => {
    const run = createRun(CONFIG, grid)
    const hours = run.elapsedHours
    const gold = run.supplies.gold
    const events = applyCommand(run, { type: 'buy', goodId: lisbonGood, tons: 30 })
    const trade = eventsOf(events, 'trade')[0]
    expect(trade).toMatchObject({ side: 'buy', goodId: lisbonGood, tons: 30 })
    expect(run.supplies.cargo[lisbonGood]).toBe(30)
    expect(run.supplies.food).toBe(run.supplies.capacity * (2 / 3))
    expect(run.supplies.water).toBe(run.supplies.food)
    const resupply = eventsOf(events, 'resupply')[0]
    expect(resupply?.food).toBeLessThan(0)
    expect(resupply?.gold).toBeGreaterThan(0)
    expect(run.supplies.gold).toBe(gold + (trade?.gold ?? 0) + (resupply?.gold ?? 0))
    expect(run.elapsedHours).toBe(hours)
    expect(run.commands).toHaveLength(1)
  })

  it('산지가 아닌 품목은 살 수 없고, 바다에서는 사고팔 수 없다', () => {
    const run = createRun(CONFIG, grid)
    expect(
      eventsOf(applyCommand(run, { type: 'buy', goodId: angraOnly, tons: 10 }), 'rejected'),
    ).toHaveLength(1)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    expect(
      eventsOf(applyCommand(run, { type: 'buy', goodId: lisbonGood, tons: 10 }), 'rejected'),
    ).toHaveLength(1)
    expect(run.commands).toHaveLength(0)
  })

  it('팔면 빈 자리만큼 식량·물을 다시 사서 채운다', () => {
    const run = createRun(CONFIG, grid)
    applyCommand(run, { type: 'buy', goodId: lisbonGood, tons: 30 })
    applyCommand(run, { type: 'sell', goodId: lisbonGood, tons: 30 })
    expect(run.supplies.cargo).toEqual({})
    expect(run.supplies.food).toBe(run.supplies.capacity)
    expect(run.supplies.water).toBe(run.supplies.capacity)
  })

  it('같은 항구에서 사고팔기를 되풀이해도 금화가 늘지 않는다', () => {
    const run = createRun(CONFIG, grid)
    const gold = run.supplies.gold
    for (let round = 0; round < 5; round += 1) {
      applyCommand(run, { type: 'buy', goodId: lisbonGood, tons: 30 })
      applyCommand(run, { type: 'sell', goodId: lisbonGood, tons: 30 })
    }
    expect(run.supplies.gold).toBeLessThanOrEqual(gold)
  })

  it('같은 시드·같은 명령이면 같은 금화와 화물이다', () => {
    const commands: Command[] = [
      { type: 'buy', goodId: lisbonGood, tons: 20 },
      { type: 'buy', goodId: 'olive-oil', tons: 5 },
      { type: 'wait' },
      { type: 'sell', goodId: lisbonGood, tons: 7 },
      { type: 'hire' },
    ]
    const run = replayRun(CONFIG, commands, grid)
    const again = replayRun(CONFIG, commands, grid)
    expect(again.supplies).toEqual(run.supplies)
    expect(run.supplies.cargo).toEqual({ salt: 13, 'olive-oil': 5 })
  })
})
