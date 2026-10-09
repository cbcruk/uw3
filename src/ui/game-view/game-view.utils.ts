import { ENCOUNTER_KINDS } from '../../content/game/encounter-kinds'
import { GOODS } from '../../content/game/goods'
import type { EncounterKindId, GoodId } from '../../content/game/game-content.types'
import { findPort } from '../../content/ports'
import { HOURS_PER_DAY } from '../../sim/calendar/calendar'
import type { Direction } from '../../game/grid/direction.types'
import type { Command, RunEvent, RunState } from '../../game/run/run.types'
import { cargoGoods, knownLanguages, marketAt } from '../../game/trade/trade'
import type { Cargo, ExpeditionEnd } from '../../game/supplies/supplies.types'
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
    case 'x':
      return { type: 'surrender' }
    default:
      return code === 'Numpad5' ? { type: 'wait' } : null
  }
}

/** 하선 키(h·c)가 내리는 몫. Shift를 누르면 전원이다. 나머지는 배를 지킨다. */
export const SHORE_PARTY_SHARE = 0.5

/**
 * 하선 명령에 인원을 붙인다. 하선이 아니면 그대로 돌려준다.
 *
 * 인원은 키를 누른 순간의 선원으로 정해 명령에 적는다 — 명령 로그만으로 재현되어야 한다 (R8).
 */
export function withShoreParty(command: Command, allHands: boolean, run: RunState): Command {
  if (command.type !== 'disembark') {
    return command
  }
  const crew = run.supplies.crew
  return { ...command, crew: allHands ? crew : Math.max(1, Math.ceil(crew * SHORE_PARTY_SHARE)) }
}

/** 숫자키 한 번에 오가는 화물. 한 톤씩이면 배 한 척을 채우는 데 키를 백 번 눌러야 한다. */
export const TRADE_LOT_TONS = 10

const DIGIT_CODE = /^Digit([1-9])$/

/**
 * 시장의 키. 숫자 N은 시장 목록의 N번째 품목을 한 짐 사고, Shift+숫자 N은 화물 목록의 N번째를 한 짐 판다.
 *
 * 숫자패드는 이동이라 윗줄 숫자(`Digit`)만 받는다. 정박 중이 아니면 `null` — 키가 다른 뜻으로 새지 않게.
 */
export function tradeCommandForKey(code: string, shift: boolean, run: RunState): Command | null {
  const match = DIGIT_CODE.exec(code)
  const portId = run.player.conveyance === 'ship' ? run.grid.portAt(run.player.cell) : null
  if (match === null || portId === null) {
    return null
  }
  const index = Number(match[1]) - 1
  if (shift) {
    const goodId = cargoGoods(run.supplies)[index]
    return goodId === undefined ? null : { type: 'sell', goodId, tons: TRADE_LOT_TONS }
  }
  const line = marketAt(portId, knownLanguages(run.config))[index]
  return line === undefined ? null : { type: 'buy', goodId: line.good.id, tons: TRADE_LOT_TONS }
}

export function goodName(goodId: GoodId): string {
  return GOODS.find((good) => good.id === goodId)?.name ?? goodId
}

/** 부호를 붙인 수. 늘면 `+`, 줄면 `−`. */
export function signed(value: number): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString()}`
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
  surrendered: '배를 넘기고 항복했다',
  captured: '무너져 배를 빼앗겼다',
}

/**
 * 추격에서 잃은 머릿수와 그중 포로. 잃은 것이 없으면 빈 문자열이다.
 *
 * @param verb 포로가 어느 쪽으로 갔는가. 원정이 잡았으면 "사로잡았다", 잡혀 갔으면 "붙잡혀 갔다".
 */
function describePursuit(lost: number, captured: number, verb: string): string {
  if (lost === 0) {
    return ''
  }
  return captured === 0
    ? ` — 추격에서 ${lost}명을 잃었다`
    : ` — 추격에서 ${lost}명을 잃고, 그중 ${captured}명은 ${verb}`
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
        text: `${portName(event.portId)}에 배를 두고 ${event.crew}명이 ${CONVEYANCE_LABEL[event.mount]}을 탔다`,
        tone: 'info',
      }
    case 'party-lost':
      return {
        text: `뭍 무리를 모두 잃었다. ${portName(event.portId)}에서 배를 지키던 선원이 원정을 잇는다`,
        tone: 'bad',
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
      return describeResupply(event)
    case 'trade':
      return {
        text: `${portName(event.portId)}에서 ${goodName(event.goodId)} ${event.tons}톤을 ${event.side === 'buy' ? '샀다' : '팔았다'} (${signed(event.gold)}두카트)`,
        tone: event.side === 'sell' ? 'good' : 'info',
      }
    case 'ended':
      return {
        text: `원정이 끝났다 — ${END_LABEL[event.reason]}`,
        tone: event.reason === 'arrived' ? 'good' : 'bad',
      }
    case 'rumor':
      return {
        text:
          event.count === 0
            ? `${portName(event.portId)}에서 이 바다가 조용하다는 소문을 들었다`
            : `${portName(event.portId)}에서 이 바다의 무리 ${event.count}에 대한 소문을 들었다`,
        tone: 'info',
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
    case 'gave-up':
      return { text: `${subject(event.kind)} 수가 밀려 쫓기를 그만뒀다`, tone: 'good' }
    case 'combat':
      return { text: describeCombat(event), tone: event.crewLost > event.foeLost ? 'bad' : 'warn' }
    case 'routed':
      return {
        text: `${withParticle(encounterName(event.kind), '이', '가')} 무너져 ${event.fled}${event.kind === 'beast' ? '마리' : '명'}이 달아났다${describePursuit(event.lost, event.captured, '사로잡았다')}`,
        tone: 'good',
      }
    case 'broken':
      return {
        text: event.atSea
          ? `${subject(event.kind)} 뱃전을 넘어왔다. 선원이 무너져 배를 빼앗겼다`
          : `무리가 무너져 흩어졌다${describePursuit(event.lost, event.captured, '붙잡혀 갔다')}`,
        tone: 'bad',
      }
    case 'hire':
      return {
        text: `${portName(event.portId)}에서 선원 ${event.hired}명을 모았다 (${signed(-event.wage)}두카트)`,
        tone: 'info',
      }
    case 'tribute':
      return {
        text: `${withParticle(encounterName(event.kind), '이', '가')} ${describeTribute(event)} 받고 떠났다`,
        tone: 'warn',
      }
    case 'ransom':
      return { text: `몸값으로 ${describeLoss(event.gold, event.cargo)}을 내줬다`, tone: 'warn' }
    case 'plunder':
      return {
        text: `${withParticle(encounterName(event.kind), '이', '가')} 남긴 금품 ${signed(event.gold)}두카트를 거뒀다`,
        tone: 'good',
      }
    case 'captives-ransomed':
      return {
        text: `포로 ${event.captives}명을 넘기고 ${signed(event.gold)}두카트를 받았다`,
        tone: 'good',
      }
    case 'surrender':
      return {
        text: `항복했다. ${describeLoss(event.gold, event.cargo)}과 배를 넘기고 선원은 살았다`,
        tone: 'bad',
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

function describeResupply(event: Extract<RunEvent, { type: 'resupply' }>): LogLine {
  const change = `식량 ${signed(event.food)} · 물 ${signed(event.water)} · ${signed(event.gold)}두카트`
  if (event.short) {
    return { text: `금화가 모자라 식량·물을 다 채우지 못했다 (${change})`, tone: 'bad' }
  }
  return { text: `식량·물을 화물이 남긴 자리까지 맞췄다 (${change})`, tone: 'info' }
}

function describeTribute(event: Extract<RunEvent, { type: 'tribute' }>): string {
  return event.gold > 0 ? `몸값 ${event.gold.toLocaleString()}두카트를` : `식량 ${event.food}을`
}

/** 내준 금화와 화물을 한 줄로. "금화 300두카트 · 설탕 10톤". */
function describeLoss(gold: number, cargo: Cargo): string {
  const goods = (Object.entries(cargo) as [GoodId, number][])
    .filter(([, tons]) => tons > 0)
    .map(([goodId, tons]) => `${goodName(goodId)} ${tons}톤`)
  return [`금화 ${gold.toLocaleString()}두카트`, ...goods].join(' · ')
}

function describeRation(event: Extract<RunEvent, { type: 'ration' }>): string {
  const lacking = [event.starving ? '식량' : null, event.thirsty ? '물' : null]
    .filter((item) => item !== null)
    .join('과 ')
  const who = event.ashore ? '뭍 무리' : '배'
  return `${who}의 ${lacking}이 떨어졌다. 선원 ${event.lost}명을 잃었다`
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
