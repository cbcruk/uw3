import { ENCOUNTER_KINDS } from '../../content/game/encounter-kinds'
import type { EncounterKind } from '../../content/game/game-content.types'
import { findShipClass } from '../../content/ships'
import { HOURS_PER_DAY } from '../../sim/calendar/calendar'
import { COMBAT } from '../../content/game/combat.tuning'
import { isWithinNm, sightRadiusNm } from '../fog/fog'
import { DIRECTIONS } from '../grid/direction'
import type { Direction } from '../grid/direction.types'
import type { ShipClass } from '../../sim/ship/ship.types'
import type { Cell, WorldGrid } from '../grid/world-grid.types'
import { passageToward } from '../travel/travel'
import type { Conveyance } from '../travel/travel.types'
import { fits, nearPort } from './encounter'
import type { Encounter } from './encounter.types'
import type { CombatEvent } from '../combat/combat.types'
import type { PursuitContext, PursuitEvent } from './pursuit.types'

interface Step {
  dir: Direction
  to: Cell
  conveyance: Conveyance
  hours: number
  distance: number
}

/**
 * 플레이어의 명령이 흘려보낸 시간 동안 조우들을 움직인다.
 *
 * 원본의 에너지 스케줄러다. 다음 행동 시각이 가장 이른 조우부터 한 칸씩 움직이고,
 * 그 칸에 걸린 시간만큼 뒤로 미룬다. 같은 시각이면 id 순서다 (R8 재현).
 * 플레이어를 보는 조우만 움직인다 — 보지 못하는 조우는 제자리에 머문다 (R28).
 *
 * 플레이어는 명령 하나를 통째로 먼저 마치고, 조우는 그 끝 위치를 겨눈다.
 * 한 칸 안에서의 동시 움직임은 없다 — 로그라이크의 차례 문법이다.
 */
export function actEncounters<E = CombatEvent>(
  context: PursuitContext<E>,
  encounters: Encounter[],
): (PursuitEvent | E)[] {
  const events: (PursuitEvent | E)[] = []
  for (const encounter of encounters) {
    if (!encounter.chasing) {
      encounter.nextActHours = Math.max(encounter.nextActHours, context.startHours)
    }
  }

  for (;;) {
    const actor = nextActor(context, encounters)
    if (actor === null) {
      break
    }
    if (!actor.chasing) {
      actor.chasing = true
      events.push({ type: 'chase', encounterId: actor.id, kind: actor.kind })
    }
    if (context.engage !== undefined && canStrike(context.grid, actor, context.target.cell)) {
      const round = context.engage(actor)
      if (round === null) {
        break
      }
      events.push(...round.events)
      actor.nextActHours += round.hours
      continue
    }
    const step = bestStep(context, encounters, actor)
    if (step === null) {
      // 다가설 길이 없다(무풍·역류·지형). 바람이 바뀌는 다음 날까지 기다린다.
      actor.nextActHours = (Math.floor(actor.nextActHours / HOURS_PER_DAY) + 1) * HOURS_PER_DAY
      continue
    }
    events.push({
      type: 'encounter-move',
      encounterId: actor.id,
      from: actor.cell,
      to: step.to,
      hours: step.hours,
    })
    actor.cell = step.to
    actor.conveyance = step.conveyance
    actor.nextActHours += step.hours
    if (adjacent(context.grid, actor.cell, context.target.cell)) {
      events.push({ type: 'engaged', encounterId: actor.id, kind: actor.kind })
    }
  }

  for (const encounter of encounters) {
    if (
      encounter.chasing &&
      encounter.crew > 0 &&
      (!sees(context, encounter) || !willing(context, encounter))
    ) {
      encounter.chasing = false
      events.push({ type: 'evaded', encounterId: encounter.id, kind: encounter.kind })
    }
  }
  return events
}

/** 칸 거리. 대각선도 한 걸음이다(체비쇼프). 경도는 순환한다. */
export function cellDistance(grid: WorldGrid, a: Cell, b: Cell): number {
  const rawDx = Math.abs(a.x - b.x)
  return Math.max(Math.min(rawDx, grid.width - rawDx), Math.abs(a.y - b.y))
}

export function adjacent(grid: WorldGrid, a: Cell, b: Cell): boolean {
  return cellDistance(grid, a, b) <= 1
}

/**
 * 이 조우가 그 칸의 상대와 맞붙을 수 있는가. 바로 옆이어야 하고, 상대가 선 지형에 설 수 있어야 한다 —
 * 해적은 해안의 기병을 칠 수 없고, 늑대는 배를 칠 수 없다 (R34).
 */
export function canStrike(grid: WorldGrid, encounter: Encounter, target: Cell): boolean {
  return (
    encounter.crew > 0 &&
    adjacent(grid, encounter.cell, target) &&
    fits(kindOf(encounter), grid.terrainAt(target))
  )
}

export function kindOf(encounter: Encounter): EncounterKind {
  const kind = ENCOUNTER_KINDS.find((entry) => entry.id === encounter.kind)
  if (kind === undefined) {
    throw new Error(`unknown encounter kind: ${encounter.kind}`)
  }
  return kind
}

/**
 * 조우가 플레이어를 보는가. 알아채는 거리는 시야보다 짧고, 한 번 쫓기 시작하면 시야 끝까지 놓치지 않는다 (R45).
 * 그래서 먼저 본 쪽이 피할 수 있고, 붙잡힌 뒤에는 시야 밖으로 벗어나야 따돌린다.
 */
/**
 * 이 조우가 플레이어에게 덤비려 하는가 (R80).
 *
 * 사람 무리는 머릿수가 플레이어 무리의 `chaseOdds`배 이상일 때만 쫓고 덮친다. 이미 맞붙은 조우(`rounds` > 0)는
 * 플레이어가 먼저 들이받았더라도 끝까지 싸운다. 짐승은 따지지 않는다.
 */
function willing(context: PursuitContext<unknown>, encounter: Encounter): boolean {
  const { crew } = context.target
  return crew === undefined || willingAgainst(encounter, crew)
}

/**
 * 이 조우가 머릿수 `crew`의 무리에게 덤비려 하는가 (R80). 런이 붙은 조우를 가릴 때도 쓴다.
 *
 * @param crew 플레이어가 지금 이끄는 무리(배의 선원이나 뭍 무리)의 머릿수.
 */
export function willingAgainst(encounter: Encounter, crew: number): boolean {
  return (
    encounter.rounds > 0 ||
    !kindOf(encounter).carriesGold ||
    encounter.crew >= crew * COMBAT.chaseOdds
  )
}

function sees(context: PursuitContext<unknown>, encounter: Encounter): boolean {
  const sightNm = sightRadiusNm(encounter.conveyance)
  const radiusNm = encounter.chasing ? sightNm : sightNm * COMBAT.noticeRatio
  return isWithinNm(context.grid, encounter.cell, context.target.cell, radiusNm)
}

/**
 * 지금 시각까지 움직일 차례가 남은, 플레이어를 보는 조우 중 가장 이른 것.
 * 붙은 조우는 싸울 수 있을 때(`engage`)만 차례를 받는다. 쓰러진 조우는 받지 않는다.
 */
function nextActor(
  context: PursuitContext<unknown>,
  encounters: readonly Encounter[],
): Encounter | null {
  let best: Encounter | null = null
  for (const encounter of encounters) {
    if (
      encounter.crew <= 0 ||
      encounter.nextActHours > context.nowHours ||
      (adjacent(context.grid, encounter.cell, context.target.cell) &&
        (context.engage === undefined ||
          !canStrike(context.grid, encounter, context.target.cell))) ||
      !sees(context, encounter) ||
      !willing(context, encounter)
    ) {
      continue
    }
    if (
      best === null ||
      encounter.nextActHours < best.nextActHours ||
      (encounter.nextActHours === best.nextActHours && encounter.id < best.id)
    ) {
      best = encounter
    }
  }
  return best
}

/**
 * 플레이어에게 가장 가까워지는 한 칸. 거리가 줄지 않으면 움직이지 않는다 — 제자리 맴돌기를 막는다.
 * 같은 거리면 더 빨리 닿는 칸, 그래도 같으면 방향 순서다.
 */
function bestStep(
  context: PursuitContext<unknown>,
  encounters: readonly Encounter[],
  actor: Encounter,
): Step | null {
  const { grid, target } = context
  const kind = kindOf(actor)
  const shipClass =
    (kind.shipClassId === undefined ? undefined : findShipClass(kind.shipClassId)) ??
    context.fallbackShip
  const here = cellDistance(grid, actor.cell, target.cell)
  const hereEuclid = euclid(grid, actor.cell, target.cell)
  let best: Step | null = null

  for (const dir of DIRECTIONS) {
    const to = grid.neighbor(actor.cell, dir)
    if (to === null || !fits(kind, grid.terrainAt(to)) || nearPort(grid, to)) {
      continue
    }
    if (
      sameCell(to, target.cell) ||
      encounters.some((other) => other.crew > 0 && sameCell(other.cell, to))
    ) {
      continue
    }
    const distance = cellDistance(grid, to, target.cell)
    if (distance > here || euclid(grid, to, target.cell) >= hereEuclid) {
      continue
    }
    const fastest = fastestConveyance(context, kind, actor.cell, dir, shipClass, actor.nextActHours)
    if (fastest === null) {
      continue
    }
    const hours = (grid.stepNm(actor.cell, dir) / fastest.rangeNm) * HOURS_PER_DAY
    const step: Step = { dir, to, conveyance: fastest.conveyance, hours, distance }
    if (
      best === null ||
      step.distance < best.distance ||
      (step.distance === best.distance && step.hours < best.hours)
    ) {
      best = step
    }
  }
  return best
}

function fastestConveyance(
  context: PursuitContext<unknown>,
  kind: EncounterKind,
  from: Cell,
  dir: Direction,
  shipClass: ShipClass,
  atHours: number,
): { conveyance: Conveyance; rangeNm: number } | null {
  const { grid } = context
  const terrain = grid.terrainAt(from)
  if (terrain === null) {
    return null
  }
  let best: { conveyance: Conveyance; rangeNm: number } | null = null
  for (const conveyance of kind.conveyances) {
    const { rangeNm } = passageToward({
      conveyance,
      terrain,
      position: grid.cellCenter(from),
      dayNumber: context.dayNumberAt(atHours),
      dir,
      shipClass,
    })
    if (rangeNm > 0 && (best === null || rangeNm > best.rangeNm)) {
      best = { conveyance, rangeNm }
    }
  }
  return best
}

function euclid(grid: WorldGrid, a: Cell, b: Cell): number {
  const rawDx = Math.abs(a.x - b.x)
  return Math.hypot(Math.min(rawDx, grid.width - rawDx), a.y - b.y)
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y
}
