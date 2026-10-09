import { findPort, PORTS, PORT_ANCHORAGES } from '../../content/ports'
import { LANGUAGE_LABELS } from '../../content/content.types'
import { findShipClass } from '../../content/ships'
import { TERRAIN_ZONES } from '../../content/game/terrain-zones'
import { LAND_POLYGONS } from '../../content/world-land'
import { HOURS_PER_DAY, toDayNumber } from '../../sim/calendar/calendar'
import { WORLD_LAND_CELLS_PER_DEGREE } from '../../sim/map/land-mask.const'
import { createTileMap } from '../../sim/map/tile-map'
import { spawnEncounters } from '../encounter/encounter'
import { actEncounters, canStrike, kindOf } from '../encounter/pursuit'
import { payRansom } from '../combat/ransom'
import { fightRound } from '../combat/combat'
import { COMBAT } from '../../content/game/combat.tuning'
import { PROVISION } from '../../content/game/provisions.tuning'
import { cellsInSight, createExploredMap, isInSight, sightRadiusNm } from '../fog/fog'
import { DIRECTIONS } from '../grid/direction'
import { createWorldGrid } from '../grid/world-grid'
import type { Cell, WorldGrid } from '../grid/world-grid.types'
import type { Encounter } from '../encounter/encounter.types'
import type { CombatEvent } from '../combat/combat.types'
import { regionKey, regionOf, sameRegion } from '../region/region'
import { canEnter, passageToward, waterRatio } from '../travel/travel'
import {
  NO_DRIFT,
  addDrift,
  crossDriftNm,
  currentKnots,
  idleDriftNm,
  resolveDrift,
} from '../travel/drift'
import type { EastNorth } from '../travel/drift.types'
import { consumeDay, createSupplies, settleProvisions, trimProvisions } from '../supplies/supplies'
import type { Provisioned } from '../supplies/supplies.types'
import { buyGoods, knownLanguages, sellGoods, speaksAt } from '../trade/trade'
import type { Mount, Passage } from '../travel/travel.types'
import type { Direction } from '../grid/direction.types'
import type { Command, RunConfig, RunEvent, RunState } from './run.types'

const PLAYER_ID = 'player'

/** 출발할 때의 뱃머리. 리스본 정박지는 대서양을 향해 열려 있다. */
const INITIAL_FACING: Direction = 'w'

/**
 * 말이 통하는 항구에서 그 해역의 조우를 소문으로 듣는다 (R74). 말을 모르면 듣지 못한다.
 *
 * 그 항구의 영역에 있는 조우를 들은 때의 자리로 적는다. 같은 영역의 옛 소문은 새 소문으로 바꾼다 —
 * 다시 들르면 소식이 새로워진다. 런 상태에서만 나오므로 재현된다 (R8).
 */
function hearRumors(run: RunState, portId: string, events: RunEvent[]): void {
  const cell = run.grid.cellOfPort(portId)
  if (cell === null || !speaksAt(portId, knownLanguages(run.config))) {
    return
  }
  const region = regionOf(cell)
  const heard = run.encounters
    .filter((encounter) => encounter.crew > 0 && sameRegion(regionOf(encounter.cell), region))
    .filter((encounter) => !run.sighted.has(encounter.id))
    .map((encounter) => ({
      encounterId: encounter.id,
      kind: encounter.kind,
      crew: encounter.crew,
      cell: encounter.cell,
      portId,
    }))
  run.rumors = [
    ...run.rumors.filter((rumor) => !sameRegion(regionOf(rumor.cell), region)),
    ...heard,
  ]
  events.push({ type: 'rumor', portId, count: heard.length })
}

/** 시뮬 해안선에서 게임 격자를 만든다. 무겁지 않지만 런마다 새로 만들 이유도 없다. */
export function createWorld(): WorldGrid {
  const landMap = createTileMap({
    polygons: LAND_POLYGONS,
    cellsPerDegree: WORLD_LAND_CELLS_PER_DEGREE,
    navigableAnchorages: PORT_ANCHORAGES,
  })
  return createWorldGrid({
    landMap,
    zones: TERRAIN_ZONES,
    anchorages: PORTS.map((port) => ({ id: port.id, anchorage: port.anchorage })),
  })
}

export function createRun(config: RunConfig, grid: WorldGrid = createWorld()): RunState {
  const shipClass = findShipClass(config.shipClassId)
  if (shipClass === undefined) {
    throw new Error(`unknown ship class: ${config.shipClassId}`)
  }
  const cell = grid.cellOfPort(config.startPortId)
  if (findPort(config.startPortId) === undefined || cell === null) {
    throw new Error(`unknown port: ${config.startPortId}`)
  }
  const region = regionOf(cell)
  const supplies = createSupplies(shipClass, config.patronGold ?? 0)
  const run: RunState = {
    config,
    grid,
    shipClass,
    elapsedHours: 0,
    player: {
      id: PLAYER_ID,
      cell,
      conveyance: 'ship',
      facing: INITIAL_FACING,
      driftNm: NO_DRIFT,
    },
    supplies,
    ended: null,
    crewAtStart: supplies.crew,
    defeated: 0,
    dockedPorts: new Set([config.startPortId]),
    berth: null,
    party: null,
    region,
    explored: createExploredMap(grid),
    encounters: spawnEncounters(grid, config.seed, region),
    sighted: new Set(),
    rumors: [],
    visitedRegions: new Set([regionKey(region)]),
    commands: [],
  }
  for (const portId of config.knownPortIds ?? []) {
    const portCell = grid.cellOfPort(portId)
    if (portCell !== null) {
      run.explored.reveal(cellsInSight(grid, portCell, sightRadiusNm('ship')))
    }
  }
  hearRumors(run, config.startPortId, [])
  lookAround(run, [])
  return run
}

/**
 * 명령 하나를 처리한다. 상태를 제자리에서 바꾸고 이벤트를 돌려준다.
 *
 * 거절되거나 막힌 명령은 시간을 쓰지 않고 로그에도 남지 않는다 — 원본에서 벽에
 * 부딪힌 걸음이 턴을 쓰지 않는 것과 같다. 입력 실수로 날을 잃게 하지 않는다.
 */
export function applyCommand(run: RunState, command: Command): RunEvent[] {
  const events: RunEvent[] = []
  if (run.ended !== null) {
    events.push({ type: 'rejected', command: command.type, reason: '원정이 끝났다' })
    return events
  }
  const dayBefore = currentDay(run)
  const startHours = run.elapsedHours
  const accepted = resolveCommand(run, command, events)
  if (!accepted) {
    return events
  }
  run.commands.push(command)
  events.push(
    ...actEncounters(
      {
        grid: run.grid,
        target: run.player,
        startHours,
        nowHours: run.elapsedHours,
        dayNumberAt: (hours) =>
          toDayNumber(run.config.startDate) + Math.floor(hours / HOURS_PER_DAY),
        fallbackShip: run.shipClass,
        engage: (foe) =>
          run.ended === null && force(run).crew > 0 && run.supplies.hull > 0
            ? { hours: COMBAT.roundHours, events: fight(run, foe, false) }
            : null,
      },
      run.encounters,
    ),
  )
  run.encounters = run.encounters.filter((encounter) => encounter.crew > 0)
  run.rumors = run.rumors.filter((rumor) =>
    run.encounters.some((encounter) => encounter.id === rumor.encounterId),
  )
  concludeIfEnded(run, events)
  lookAround(run, events)
  const dayAfter = currentDay(run)
  for (let day = dayBefore + 1; day <= dayAfter && run.ended === null; day += 1) {
    passDay(run, day, events)
  }
  return events
}

/**
 * 날이 바뀐다. 하루치를 먹고, 정박 중이면 다시 채운다.
 *
 * 소모는 칸마다가 아니라 날마다다 — 시뮬의 하루 단위(T1)와 같은 경계에서 일어난다.
 * 한 명령이 며칠을 건너면 그 날 수만큼 돈다.
 */
function passDay(run: RunState, day: number, events: RunEvent[]): void {
  events.push({ type: 'day-start', day })
  const { party } = run
  const groups: [Provisioned, number, boolean][] =
    party === null
      ? [[run.supplies, waterRatioOf(run), false]]
      : [
          [party, waterRatioOf(run), true],
          [run.supplies, 1, false],
        ]
  for (const [group, ratio, ashore] of groups) {
    const ration = consumeDay(group, ratio)
    if (ration.starving || ration.thirsty) {
      events.push({ type: 'ration', ashore, ...ration })
    }
  }
  // 하선 중에는 지킴이가 있을 때만 배를 채운다. 아무도 없는 배에 날마다 금화를 쓰지 않는다.
  const keptBerth = run.supplies.crew > 0 ? (run.berth?.portId ?? null) : null
  const portId = dockedPortId(run) ?? keptBerth
  if (portId !== null) {
    restock(run, portId, events)
  }
  concludeIfEnded(run, events)
}

/**
 * 항구에서 식량·물을 화물이 남긴 자리까지 맞춘다 (R21·R53). 바뀐 것이 없으면 알리지 않는다 —
 * 정박한 채 날이 바뀔 때마다 같은 줄이 쌓이지 않게.
 */
function restock(run: RunState, portId: string, events: RunEvent[]): void {
  const settled = settleProvisions(run.supplies)
  if (settled.food !== 0 || settled.water !== 0 || settled.short) {
    events.push({ type: 'resupply', portId, ...settled })
  }
}

/**
 * 선원이나 선체가 바닥났으면 원정을 끝낸다. 이미 끝났으면 아무것도 하지 않는다.
 *
 * 뭍 무리만 전멸했고 배에 선원이 남았으면 끝이 아니다 — 지킴이가 배에서 원정을 잇는다 (R70).
 */
function concludeIfEnded(run: RunState, events: RunEvent[]): void {
  if (run.ended !== null) {
    return
  }
  const { party, berth } = run
  if (party !== null && party.crew <= 0 && berth !== null && run.supplies.crew > 0) {
    run.party = null
    run.berth = null
    run.player.cell = berth.cell
    run.player.conveyance = 'ship'
    run.player.driftNm = NO_DRIFT
    events.push({ type: 'party-lost', portId: berth.portId })
  }
  // 선원을 먼저 본다. 한 합에 선원과 선체가 함께 바닥나면 crew-lost다 — 옛 로그의 끝을 바꾸지 않는다.
  const end = totalCrew(run) <= 0 ? 'crew-lost' : run.supplies.hull <= 0 ? 'hull-lost' : null
  if (end !== null) {
    run.ended = end
    events.push({ type: 'ended', reason: end })
  }
}

/** 원정의 선원 전체. 배를 지키는 선원과 뭍 무리를 더한다. */
export function totalCrew(run: RunState): number {
  return run.supplies.crew + (run.party?.crew ?? 0)
}

/** 플레이어가 이끄는 무리. 뭍에 있으면 뭍 무리, 배에 있으면 배의 선원이다. 싸우고 내주는 것은 이 무리다. */
export function force(run: RunState): Provisioned & { hull?: number } {
  return run.party ?? run.supplies
}

/**
 * 조우 하나와 한 합을 치른다. 사람 무리가 쓰러지거나 물러나면 노획을 거둔다 (R64).
 *
 * 노획은 처음 머릿수에 비례한다 — 물러난 무리도 짐을 버리고 달아난다. 쓰러뜨릴 때만 주면
 * 퇴각(R46)이 먼저 오는 탓에 노획은 거의 일어나지 않는다.
 */
function fight(run: RunState, foe: Encounter, initiated: boolean): CombatEvent[] {
  const events = fightRound({
    seed: run.config.seed,
    supplies: force(run),
    conveyance: run.player.conveyance,
    foe,
    initiated,
  })
  const beaten = events.some((event) => event.type === 'defeated' || event.type === 'routed')
  if (beaten) {
    run.defeated += 1
    if (kindOf(foe).carriesGold) {
      const gold = foe.crewAtStart * COMBAT.plunderGold
      run.supplies.gold += gold
      events.push({ type: 'plunder', encounterId: foe.id, kind: foe.kind, gold })
    }
  }
  return events
}

/** 플레이어에게 바로 덤빌 수 있는 조우가 옆에 있는가. */
function engaged(run: RunState): boolean {
  return run.encounters.some((encounter) => canStrike(run.grid, encounter, run.player.cell))
}

/**
 * 지금 자리의 물 소모 배율. 날이 바뀌는 순간 선 지형과 탈것으로 정한다 — 그날 어디를 지났는지는 보지 않는다.
 * 소모가 날 경계에서만 일어나는 것(T1)과 같은 축이다.
 */
export function waterRatioOf(run: RunState): number {
  return waterRatio(run.player.conveyance, run.grid.terrainAt(run.player.cell))
}

/** 배에 탄 채 항구 칸에 있으면 그 항구. */
function dockedPortId(run: RunState): string | null {
  return run.player.conveyance === 'ship' ? run.grid.portAt(run.player.cell) : null
}

/** `seed + 명령 로그`에서 런을 다시 만든다 (R8). */
export function replayRun(
  config: RunConfig,
  commands: readonly Command[],
  grid?: WorldGrid,
): RunState {
  const run = createRun(config, grid)
  for (const command of commands) {
    applyCommand(run, command)
  }
  return run
}

/** 출발 후 며칠째인가. 0부터 센다. */
export function currentDay(run: RunState): number {
  return Math.floor(run.elapsedHours / HOURS_PER_DAY)
}

export function dayNumberOf(run: RunState): number {
  return toDayNumber(run.config.startDate) + currentDay(run)
}

/** 지금 자리에서 그 방향으로 하루에 얼마나 나아가는가. 화면의 나침반도 이것을 쓴다. */
export function passageFrom(run: RunState, dir: Direction): Passage {
  const terrain = run.grid.terrainAt(run.player.cell)
  if (terrain === null) {
    return { rangeNm: 0, sailRangeNm: 0, tacking: false }
  }
  return passageToward({
    conveyance: run.player.conveyance,
    terrain,
    position: run.grid.cellCenter(run.player.cell),
    dayNumber: dayNumberOf(run),
    dir,
    shipClass: run.shipClass,
  })
}

export function rangeTowardNm(run: RunState, dir: Direction): number {
  return passageFrom(run, dir).rangeNm
}

/**
 * 지금 자리에서 보이는 칸을 탐사 기록에 더하고, 처음 보이는 조우를 알린다.
 * 하선하면 시야가 좁아진다.
 */
function lookAround(run: RunState, events: RunEvent[]): void {
  const { grid, player } = run
  run.explored.reveal(cellsInSight(grid, player.cell, sightRadiusNm(player.conveyance)))
  for (const encounter of run.encounters) {
    if (run.sighted.has(encounter.id)) {
      continue
    }
    if (isInSight(grid, player.cell, player.conveyance, encounter.cell)) {
      run.sighted.add(encounter.id)
      run.rumors = run.rumors.filter((rumor) => rumor.encounterId !== encounter.id)
      events.push({
        type: 'sighted',
        encounterId: encounter.id,
        kind: encounter.kind,
        crew: encounter.crew,
      })
    }
  }
}

function resolveCommand(run: RunState, command: Command, events: RunEvent[]): boolean {
  switch (command.type) {
    case 'move':
      return move(run, command.dir, events)
    case 'wait': {
      // 다음 날 첫 시각까지 쉰다. 바람은 날마다 바뀌므로 하루를 넘겨야 기다린 의미가 있다.
      // 적이 붙어 있으면 한 합만큼만 — 키 한 번에 하루치 싸움을 다 치르지 않게 한다 (R35).
      const hours = engaged(run)
        ? COMBAT.roundHours
        : (currentDay(run) + 1) * HOURS_PER_DAY - run.elapsedHours
      run.elapsedHours += hours
      if (isAdrift(run)) {
        const current = currentKnots(run.grid.cellCenter(run.player.cell))
        drift(run, idleDriftNm(current, hours), events)
      }
      return true
    }
    case 'disembark':
      return disembark(run, command.mount, command.crew, events)
    case 'embark':
      return embark(run, events)
    case 'hire':
      return hire(run, events)
    case 'tribute':
      return tribute(run, events)
    case 'surrender':
      return surrender(run, events)
    case 'buy':
    case 'sell':
      return trade(run, command, events)
  }
}

function move(run: RunState, dir: Direction, events: RunEvent[]): boolean {
  const { grid, player } = run
  const next = grid.neighbor(player.cell, dir)
  const terrain = next === null ? null : grid.terrainAt(next)
  if (next === null || terrain === null) {
    events.push({ type: 'blocked', actorId: player.id, at: player.cell, reason: 'edge' })
    return false
  }
  if (!canEnter(player.conveyance, terrain)) {
    events.push({ type: 'blocked', actorId: player.id, at: player.cell, reason: 'terrain' })
    return false
  }
  const foe = run.encounters.find((encounter) => sameCell(next, encounter.cell))
  if (foe !== undefined) {
    // 들이받기. 원본 로그라이크의 근접 공격이다 — 조우가 선 칸으로 가려는 것이 곧 공격이다.
    run.elapsedHours += COMBAT.roundHours
    player.facing = dir
    events.push(...fight(run, foe, true))
    run.encounters = run.encounters.filter((encounter) => encounter.crew > 0)
    return true
  }
  const passage = passageFrom(run, dir)
  if (passage.rangeNm <= 0) {
    const reason = passage.sailRangeNm <= 0 ? 'wind' : 'current'
    events.push({ type: 'blocked', actorId: player.id, at: player.cell, reason })
    return false
  }

  const hours = (grid.stepNm(player.cell, dir) / passage.rangeNm) * HOURS_PER_DAY
  const current = player.conveyance === 'ship' ? currentKnots(grid.cellCenter(player.cell)) : null
  const from = player.cell
  run.elapsedHours += hours
  player.facing = dir
  events.push({ type: 'move', actorId: player.id, from, to: next, hours })
  enterCell(run, next, events)
  if (current !== null && isAdrift(run)) {
    drift(run, crossDriftNm(current, dir, hours), events)
  }
  return true
}

/**
 * 배가 해류에 밀리는 상태인가. 정박 중에는 밀리지 않는다 — 시뮬과 같은 규칙이다 (SPEC 6.2).
 */
function isAdrift(run: RunState): boolean {
  return run.player.conveyance === 'ship' && run.grid.portAt(run.player.cell) === null
}

/** 칸 안 위치에 편류를 더하고, 경계를 넘으면 옆 칸으로 민다 (R15). */
function drift(run: RunState, offsetNm: EastNorth, events: RunEvent[]): void {
  const { player, grid } = run
  const result = resolveDrift(grid, player.cell, addDrift(player.driftNm, offsetNm))
  player.driftNm = result.offsetNm
  for (const cell of result.pushedThrough) {
    events.push({ type: 'drift', actorId: player.id, from: player.cell, to: cell })
    enterCell(run, cell, events)
    if (!isAdrift(run)) {
      break
    }
  }
}

/** 칸에 들어선다. 영역이 바뀌면 새 층이고, 배가 항구 칸에 닿으면 정박한다. */
function enterCell(run: RunState, next: Cell, events: RunEvent[]): void {
  const { grid, player } = run
  player.cell = next
  const region = regionOf(next)
  if (!sameRegion(region, run.region)) {
    run.region = region
    const key = regionKey(region)
    if (!run.visitedRegions.has(key)) {
      run.visitedRegions.add(key)
      run.encounters.push(...spawnEncounters(grid, run.config.seed, region))
    }
    events.push({ type: 'region', region })
  }
  const portId = player.conveyance === 'ship' ? grid.portAt(next) : null
  if (portId !== null) {
    player.driftNm = NO_DRIFT
    run.dockedPorts.add(portId)
    hearRumors(run, portId, events)
    events.push({ type: 'dock', portId })
    restock(run, portId, events)
    if (portId === run.config.goalPortId && run.ended === null) {
      run.ended = 'arrived'
      events.push({ type: 'ended', reason: 'arrived' })
    }
  }
}

/**
 * 항구에서 뭍 무리를 내린다. 식량·물은 머릿수만큼 나눠 들고 간다(내림) — 나머지는 배를 지키는 선원의 몫이고
 * 배는 항구에서 보급받는다 (R69). 인원이 없으면 전원이다 (R71).
 */
function disembark(
  run: RunState,
  mount: Mount,
  crew: number | undefined,
  events: RunEvent[],
): boolean {
  const { grid, player } = run
  const portId = grid.portAt(player.cell)
  if (player.conveyance !== 'ship' || portId === null) {
    events.push({
      type: 'rejected',
      command: 'disembark',
      reason: '항구에 정박한 배에서만 내릴 수 있다',
    })
    return false
  }
  const landing = landNeighbor(grid, player.cell)
  if (landing === null) {
    events.push({
      type: 'rejected',
      command: 'disembark',
      reason: '이 항구에는 내릴 뭍이 붙어 있지 않다',
    })
    return false
  }
  const { supplies } = run
  const size = crew ?? supplies.crew
  if (!Number.isInteger(size) || size < 1 || size > supplies.crew) {
    events.push({
      type: 'rejected',
      command: 'disembark',
      reason: `내릴 인원이 맞지 않다 (1~${supplies.crew}명)`,
    })
    return false
  }
  const food = Math.floor((supplies.food * size) / supplies.crew)
  const water = Math.floor((supplies.water * size) / supplies.crew)
  supplies.crew -= size
  supplies.food -= food
  supplies.water -= water
  run.party = { crew: size, food, water, landed: { crew: size, food, water } }
  run.berth = { portId, cell: player.cell }
  player.driftNm = NO_DRIFT
  player.cell = landing
  player.conveyance = mount
  events.push({ type: 'disembark', mount, portId, crew: size })
  return true
}

/**
 * 항구에서 선원을 정원까지 모은다. 한 사람마다 `hireWage`를 내고, 금화가 모자라면 낼 수 있는 만큼만 모은다.
 *
 * 대가는 셋이다 — 금화, 시간, 그리고 보급. 사람이 늘면 백병전에 강해지지만 하루에 먹는 양도 는다 (R47).
 */
function hire(run: RunState, events: RunEvent[]): boolean {
  const portId = dockedPortId(run)
  if (portId === null) {
    events.push({
      type: 'rejected',
      command: 'hire',
      reason: '항구에 정박한 배에서만 사람을 모을 수 있다',
    })
    return false
  }
  if (!speaksAt(portId, knownLanguages(run.config))) {
    const language = findPort(portId)?.language
    events.push({
      type: 'rejected',
      command: 'hire',
      reason: `${language === undefined ? '이 항구의 말' : LANGUAGE_LABELS[language]}를 몰라 사람을 모을 수 없다`,
    })
    return false
  }
  const wanted = run.shipClass.crewMax - run.supplies.crew
  if (wanted <= 0) {
    events.push({ type: 'rejected', command: 'hire', reason: '이미 정원이 찼다' })
    return false
  }
  const hired = Math.min(wanted, Math.floor(run.supplies.gold / PROVISION.hireWage))
  if (hired <= 0) {
    events.push({
      type: 'rejected',
      command: 'hire',
      reason: `금화가 모자라다 (한 명 ${PROVISION.hireWage}두카트)`,
    })
    return false
  }
  const wage = Math.ceil(hired * PROVISION.hireWage)
  run.supplies.crew += hired
  run.supplies.gold -= wage
  run.elapsedHours += PROVISION.hireHours
  events.push({ type: 'hire', portId, hired, wage })
  return true
}

/**
 * 붙은 조우 모두에게 몫을 내주고 놓여난다. 한 합만큼의 시간이 든다.
 *
 * 사람 무리는 머릿수 × `tributeGold`의 몸값을 금화로, 모자라면 화물로 받는다 (R63). 짐승은 머릿수 ×
 * `tributeDays`의 식량을 가져간다. 모두에게 줄 만큼이 없으면 거절한다 — 일부만 달래고 나머지와 싸우는
 * 길은 열지 않는다. 내준 조우는 격자에서 빠지지만 물리친 수에는 세지 않는다 (R48).
 */
function tribute(run: RunState, events: RunEvent[]): boolean {
  const foes = run.encounters.filter((encounter) => canStrike(run.grid, encounter, run.player.cell))
  if (foes.length === 0) {
    events.push({ type: 'rejected', command: 'tribute', reason: '내줄 상대가 붙어 있지 않다' })
    return false
  }
  const demands = foes.map((foe) =>
    kindOf(foe).carriesGold
      ? { foe, food: 0, gold: Math.ceil(foe.crew * COMBAT.tributeGold) }
      : { foe, food: Math.ceil(foe.crew * COMBAT.tributeDays), gold: 0 },
  )
  const food = demands.reduce((sum, demand) => sum + demand.food, 0)
  const gold = demands.reduce((sum, demand) => sum + demand.gold, 0)
  const party = force(run)
  if (food > party.food) {
    events.push({
      type: 'rejected',
      command: 'tribute',
      reason: `내줄 식량이 모자라다 (${food} 필요)`,
    })
    return false
  }
  const ransom = gold > 0 ? payRansom(run.supplies, gold) : null
  if (gold > 0 && ransom === null) {
    events.push({
      type: 'rejected',
      command: 'tribute',
      reason: `몸값이 모자라다 (${gold.toLocaleString()}두카트 — 금화와 화물로)`,
    })
    return false
  }
  party.food -= food
  run.elapsedHours += COMBAT.roundHours
  for (const demand of demands) {
    demand.foe.crew = 0
    events.push({
      type: 'tribute',
      encounterId: demand.foe.id,
      kind: demand.foe.kind,
      food: demand.food,
      gold: demand.gold,
    })
  }
  if (ransom !== null) {
    events.push({ type: 'ransom', ...ransom })
  }
  run.encounters = run.encounters.filter((encounter) => encounter.crew > 0)
  return true
}

/**
 * 배·화물·금화를 넘기고 선원만 산다. 원정은 `surrendered`로 끝난다 (R65).
 *
 * 사람 무리가 붙어 있을 때만 된다 — 늑대는 항복을 받지 않는다. 몸값을 낼 수 있어도 항복할 수 있다.
 */
function surrender(run: RunState, events: RunEvent[]): boolean {
  const captor = run.encounters.some(
    (encounter) => kindOf(encounter).carriesGold && canStrike(run.grid, encounter, run.player.cell),
  )
  if (!captor) {
    events.push({
      type: 'rejected',
      command: 'surrender',
      reason: '항복을 받을 상대가 붙어 있지 않다',
    })
    return false
  }
  const { gold, cargo } = run.supplies
  run.supplies.gold = 0
  run.supplies.cargo = {}
  run.elapsedHours += COMBAT.roundHours
  run.ended = 'surrendered'
  events.push({ type: 'surrender', gold, cargo }, { type: 'ended', reason: 'surrendered' })
  return true
}

/**
 * 정박한 항구의 시장에서 화물을 사고판다. 시간이 들지 않는다 (R55).
 *
 * 거래 뒤에는 곧바로 식량·물을 맞춘다 — 화물을 사면 밀려난 식량·물을 되팔고, 팔면 빈 자리를 채운다 (R53).
 */
function trade(
  run: RunState,
  command: Extract<Command, { type: 'buy' | 'sell' }>,
  events: RunEvent[],
): boolean {
  const portId = dockedPortId(run)
  if (portId === null) {
    events.push({
      type: 'rejected',
      command: command.type,
      reason: '항구에 정박한 배에서만 사고팔 수 있다',
    })
    return false
  }
  const deal = command.type === 'buy' ? buyGoods : sellGoods
  const result = deal(
    run.supplies,
    portId,
    command.goodId,
    command.tons,
    knownLanguages(run.config),
  )
  if (!result.ok) {
    events.push({ type: 'rejected', command: command.type, reason: result.reason })
    return false
  }
  events.push({
    type: 'trade',
    portId,
    side: command.type,
    goodId: command.goodId,
    tons: result.tons,
    gold: result.gold,
  })
  restock(run, portId, events)
  return true
}

function embark(run: RunState, events: RunEvent[]): boolean {
  const { grid, player, berth } = run
  if (player.conveyance === 'ship' || berth === null) {
    events.push({
      type: 'rejected',
      command: 'embark',
      reason: '뭍에 있을 때만 배에 오를 수 있다',
    })
    return false
  }
  if (!DIRECTIONS.some((dir) => sameCell(grid.neighbor(player.cell, dir), berth.cell))) {
    events.push({
      type: 'rejected',
      command: 'embark',
      reason: '배를 둔 항구 바로 옆에서만 오를 수 있다',
    })
    return false
  }
  player.cell = berth.cell
  player.conveyance = 'ship'
  player.driftNm = NO_DRIFT
  run.berth = null
  const { party } = run
  if (party !== null) {
    run.supplies.crew += party.crew
    run.supplies.food += party.food
    run.supplies.water += party.water
    run.party = null
  }
  events.push({ type: 'embark', portId: berth.portId })
  // 넘치는 몫만 되판다. 모자란 몫까지 사면 올림이 한 번 더 생겨 뭍 무리를 나누기 전의 로그가
  // 금화 한 닢 다르게 되살아난다 (R71). 전원 하선이었으면 배가 비어 있어 넘칠 일이 없다.
  const trimmed = trimProvisions(run.supplies)
  if (trimmed.food !== 0 || trimmed.water !== 0) {
    events.push({ type: 'resupply', portId: berth.portId, ...trimmed })
  }
  return true
}

/** 하선할 뭍 칸. 방향 순서가 고정이라 같은 항구에서는 늘 같은 칸에 내린다 (R8). */
function landNeighbor(grid: WorldGrid, cell: Cell): Cell | null {
  for (const dir of DIRECTIONS) {
    const next = grid.neighbor(cell, dir)
    const terrain = next === null ? null : grid.terrainAt(next)
    if (next !== null && terrain !== null && terrain !== 'sea') {
      return next
    }
  }
  return null
}

function sameCell(a: Cell | null, b: Cell): boolean {
  return a !== null && a.x === b.x && a.y === b.y
}
