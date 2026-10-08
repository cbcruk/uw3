import { ENCOUNTER_KINDS } from '../../content/game/encounter-kinds'
import type { EncounterKindId } from '../../content/game/game-content.types'
import { findPort } from '../../content/ports'
import { HOURS_PER_DAY } from '../../sim/calendar/calendar'
import type { Direction } from '../../game/grid/direction.types'
import type { Command, RunEvent } from '../../game/run/run.types'
import type { ExpeditionEnd } from '../../game/supplies/supplies.types'
import type { Conveyance } from '../../game/travel/travel.types'
import type { LogLine } from './game-view.types'

const ARROW_KEYS: Readonly<Record<string, Direction>> = {
  ArrowUp: 'n',
  ArrowDown: 's',
  ArrowLeft: 'w',
  ArrowRight: 'e',
}

/** 대각선은 방향키로 못 낸다. 로그라이크 관례대로 vi 키(y u b n)와 숫자패드를 받는다. */
const DIAGONAL_KEYS: Readonly<Record<string, Direction>> = {
  y: 'nw',
  u: 'ne',
  b: 'sw',
  n: 'se',
}

const NUMPAD_CODES: Readonly<Record<string, Direction>> = {
  Numpad8: 'n',
  Numpad9: 'ne',
  Numpad6: 'e',
  Numpad3: 'se',
  Numpad2: 's',
  Numpad1: 'sw',
  Numpad4: 'w',
  Numpad7: 'nw',
}

export function commandForKey(key: string, code: string): Command | null {
  const dir = ARROW_KEYS[key] ?? NUMPAD_CODES[code] ?? DIAGONAL_KEYS[key.toLowerCase()]
  if (dir !== undefined) {
    return { type: 'move', dir }
  }
  switch (key.toLowerCase()) {
    case '.':
    case 'z':
      return { type: 'wait' }
    case 'h':
      return { type: 'disembark', mount: 'horse' }
    case 'c':
      return { type: 'disembark', mount: 'camel' }
    case 'e':
      return { type: 'embark' }
    case 'r':
      return { type: 'hire' }
    case 't':
      return { type: 'tribute' }
    default:
      return code === 'Numpad5' ? { type: 'wait' } : null
  }
}

export const CONVEYANCE_LABEL: Readonly<Record<Conveyance, string>> = {
  ship: '배',
  horse: '말',
  camel: '낙타',
}

export const DIRECTION_LABEL: Readonly<Record<Direction, string>> = {
  n: '북',
  ne: '북동',
  e: '동',
  se: '남동',
  s: '남',
  sw: '남서',
  w: '서',
  nw: '북서',
}

export function encounterName(kind: EncounterKindId): string {
  return ENCOUNTER_KINDS.find((entry) => entry.id === kind)?.name ?? kind
}

const HANGUL_FIRST = 0xac00
const HANGUL_LAST = 0xd7a3
const HANGUL_FINALS = 28

/**
 * 받침에 맞는 조사를 붙인다. "해적선이", "도적떼가".
 *
 * @param withFinal 받침이 있을 때의 조사 ("이", "을").
 * @param withoutFinal 받침이 없을 때의 조사 ("가", "를").
 */
export function withParticle(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1)
  const hasFinal =
    code >= HANGUL_FIRST && code <= HANGUL_LAST && (code - HANGUL_FIRST) % HANGUL_FINALS !== 0
  return `${word}${hasFinal ? withFinal : withoutFinal}`
}

function subject(kind: EncounterKindId): string {
  return withParticle(encounterName(kind), '이', '가')
}

export const END_LABEL: Readonly<Record<ExpeditionEnd, string>> = {
  arrived: '목표 항구에 닿았다',
  'crew-lost': '선원을 모두 잃었다',
  'hull-lost': '배가 가라앉았다',
}

function portName(portId: string): string {
  return findPort(portId)?.name ?? portId
}

/** 로그에 남길 사건만 글로 바꾼다. 한 칸 이동은 너무 잦아서 남기지 않는다. */
export function describeEvent(event: RunEvent): LogLine | null {
  switch (event.type) {
    case 'blocked':
      if (event.reason === 'wind') {
        return { text: '바람이 없어 나아갈 수 없다. 기다려야 한다', tone: 'warn' }
      }
      if (event.reason === 'current') {
        return { text: '역류가 돛보다 세다. 그쪽으로는 나아가지 못한다', tone: 'warn' }
      }
      return {
        text: event.reason === 'edge' ? '지도의 끝이다' : '그쪽으로는 갈 수 없다',
        tone: 'warn',
      }
    case 'region':
      return { text: `새 해역에 들어섰다 (${event.region.rx}, ${event.region.ry})`, tone: 'good' }
    case 'dock':
      return { text: `${portName(event.portId)}에 입항했다`, tone: 'good' }
    case 'disembark':
      return {
        text: `${portName(event.portId)}에 배를 두고 ${CONVEYANCE_LABEL[event.mount]}을 탔다`,
        tone: 'info',
      }
    case 'embark':
      return { text: `${portName(event.portId)}에서 배에 올랐다`, tone: 'info' }
    case 'rejected':
      return { text: event.reason, tone: 'warn' }
    case 'day-start':
      return { text: `${event.day + 1}일째`, tone: 'info' }
    case 'ration':
      return { text: describeRation(event), tone: 'bad' }
    case 'resupply':
      return { text: '식량과 물을 가득 채웠다', tone: 'info' }
    case 'ended':
      return {
        text: `원정이 끝났다 — ${END_LABEL[event.reason]}`,
        tone: event.reason === 'arrived' ? 'good' : 'bad',
      }
    case 'sighted':
      return { text: `${subject(event.kind)} 보인다 (약 ${event.crew}명)`, tone: 'warn' }
    case 'chase':
      return { text: `${subject(event.kind)} 이쪽으로 향한다`, tone: 'warn' }
    case 'engaged':
      return { text: `${subject(event.kind)} 바로 옆까지 붙었다`, tone: 'bad' }
    case 'evaded':
      return {
        text: `${withParticle(encounterName(event.kind), '을', '를')} 따돌렸다`,
        tone: 'good',
      }
    case 'combat':
      return { text: describeCombat(event), tone: event.crewLost > event.foeLost ? 'bad' : 'warn' }
    case 'routed':
      return {
        text: `${withParticle(encounterName(event.kind), '이', '가')} ${event.fled}명을 남기고 물러났다`,
        tone: 'good',
      }
    case 'hire':
      return { text: `${portName(event.portId)}에서 선원 ${event.hired}명을 모았다`, tone: 'info' }
    case 'tribute':
      return {
        text: `${withParticle(encounterName(event.kind), '이', '가')} ${describeTribute(event)} 받고 떠났다`,
        tone: 'warn',
      }
    case 'defeated':
      return {
        text: `${withParticle(encounterName(event.kind), '을', '를')} 물리쳤다`,
        tone: 'good',
      }
    case 'move':
    case 'drift':
    case 'encounter-move':
      return null
  }
}

function describeCombat(event: Extract<RunEvent, { type: 'combat' }>): string {
  const name = encounterName(event.kind)
  const opening = event.initiated
    ? `${withParticle(name, '을', '를')} 덮쳤다`
    : `${withParticle(name, '이', '가')} 덮쳐 왔다`
  const hull = event.hullLost > 0 ? ` · 선체 -${event.hullLost}` : ''
  return `${opening} — 우리 -${event.crewLost}명${hull} · 적 -${event.foeLost}명 (남은 적 ${event.foeLeft})`
}

function describeTribute(event: Extract<RunEvent, { type: 'tribute' }>): string {
  return event.water > 0 ? `식량 ${event.food} · 물 ${event.water}을` : `식량 ${event.food}을`
}

function describeRation(event: Extract<RunEvent, { type: 'ration' }>): string {
  const lacking = [event.starving ? '식량' : null, event.thirsty ? '물' : null]
    .filter((item) => item !== null)
    .join('과 ')
  return `${lacking}이 떨어졌다. 선원 ${event.lost}명을 잃었다`
}

/** 한 명령 동안 해류에 밀린 칸 수를 한 줄로. 칸마다 남기면 로그가 해류로 뒤덮인다. */
export function describeDrift(events: readonly RunEvent[]): LogLine | null {
  const count = events.filter((e) => e.type === 'drift').length
  return count > 0 ? { text: `해류에 밀려 ${count}칸 떠내려갔다`, tone: 'warn' } : null
}

/** 한 칸에 걸리는 시간. 갈 수 없으면 `null`. */
export function hoursPerCell(stepNm: number, rangeNm: number): number | null {
  return rangeNm > 0 ? (stepNm / rangeNm) * HOURS_PER_DAY : null
}
