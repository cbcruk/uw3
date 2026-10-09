import { GOODS } from '../../content/game/goods'
import { dailyConfig, recordOf } from '../expedition/expedition'
import { DIRECTIONS } from '../grid/direction'
import type { WorldGrid } from '../grid/world-grid.types'
import { applyCommand, createRun } from '../run/run'
import type { Command, RunState } from '../run/run.types'
import type { Submission, Verdict } from './submission.types'

const DAILY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/
/**
 * 받을 명령 수의 상한. 규칙이 아니라 받는 쪽을 지키는 문이다 — 항구에서 기다리기만 해도
 * 원정은 오래 이어지므로, 끝없는 로그로 검증기를 붙잡아 두지 못하게 한다. 정직한 원정은 수천 줄이다.
 */
export const MAX_COMMANDS = 50_000
type BareCommand = Extract<
  Command,
  { type: 'wait' | 'embark' | 'hire' | 'repair' | 'tribute' | 'surrender' }
>
const BARE_COMMANDS: readonly BareCommand['type'][] = [
  'wait',
  'embark',
  'hire',
  'repair',
  'tribute',
  'surrender',
]

/** 끝난 데일리 원정을 제출 형식으로 접는다. 끝나지 않았거나 데일리가 아니면 `null`. */
export function submissionOf(
  run: RunState,
  daily: string | null,
  rules: string,
): Submission | null {
  if (run.ended === null || daily === null) {
    return null
  }
  return { rules, daily, commands: [...run.commands] }
}

/**
 * 데일리 기록을 다시 돌려 검증한다. 낸 쪽이 적은 결과는 믿지 않는다 (R8).
 *
 * 설정은 날짜 키로 다시 만든다(R41). 명령을 하나씩 돌리며, 받아들여지지 않는 명령이 있거나
 * 원정이 끝난 뒤에 명령이 남으면 받지 않는다 — 같은 판을 가리키는 로그가 하나뿐이어야 기록이 겹치지 않는다.
 *
 * @param input 받은 그대로의 값. 모양부터 본다.
 * @param rules 받는 쪽의 규칙 버전. 낸 쪽과 다르면 돌리지 않는다.
 * @param grid 여러 기록을 볼 때 한 번 만든 격자를 넘긴다. 없으면 새로 만든다.
 */
export function verifySubmission(input: unknown, rules: string, grid?: WorldGrid): Verdict {
  const submission = parseSubmission(input)
  if (submission === null) {
    return { ok: false, reason: 'malformed' }
  }
  if (submission.rules !== rules) {
    return { ok: false, reason: 'rules' }
  }
  if (submission.commands.length > MAX_COMMANDS) {
    return { ok: false, reason: 'too-long' }
  }
  try {
    return replay(submission, grid)
  } catch {
    // 규칙 코드가 던지면 우리 쪽 결함이지만, 검증기는 멈추지 않고 받지 않는다.
    return { ok: false, reason: 'rejected' }
  }
}

function replay(submission: Submission, grid: WorldGrid | undefined): Verdict {
  const run = createRun(dailyConfig(submission.daily), grid)
  for (const command of submission.commands) {
    if (run.ended !== null) {
      return { ok: false, reason: 'trailing' }
    }
    const accepted = run.commands.length
    applyCommand(run, command)
    if (run.commands.length === accepted) {
      return { ok: false, reason: 'rejected' }
    }
  }
  const record = recordOf(run, submission.daily)
  return record === null ? { ok: false, reason: 'unfinished' } : { ok: true, record }
}

/** 받은 값을 제출 형식으로 좁힌다. 한 군데라도 어긋나면 `null`. */
export function parseSubmission(input: unknown): Submission | null {
  if (!isObject(input) || typeof input['rules'] !== 'string' || !isDailyKey(input['daily'])) {
    return null
  }
  const raw = input['commands']
  if (!Array.isArray(raw)) {
    return null
  }
  const commands: Command[] = []
  for (const value of raw) {
    const command = parseCommand(value)
    if (command === null) {
      return null
    }
    commands.push(command)
  }
  return { rules: input['rules'], daily: input['daily'], commands }
}

function parseCommand(value: unknown): Command | null {
  if (!isObject(value) || typeof value['type'] !== 'string') {
    return null
  }
  const type = value['type']
  const bare = BARE_COMMANDS.find((candidate) => candidate === type)
  if (bare !== undefined) {
    return { type: bare }
  }
  if (type === 'move') {
    const dir = DIRECTIONS.find((candidate) => candidate === value['dir'])
    return dir === undefined ? null : { type, dir }
  }
  if (type === 'disembark') {
    const mount = value['mount']
    const crew = value['crew']
    if (mount !== 'horse' && mount !== 'camel') {
      return null
    }
    if (crew === undefined) {
      return { type, mount }
    }
    return isCount(crew) ? { type, mount, crew } : null
  }
  if (type === 'buy' || type === 'sell') {
    const good = GOODS.find((candidate) => candidate.id === value['goodId'])
    const tons = value['tons']
    return good === undefined || !isCount(tons) ? null : { type, goodId: good.id, tons }
  }
  return null
}

/** 실제 달력에 있는 날짜의 키인가. `2026-02-30` 같은 것은 막는다. */
function isDailyKey(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  const match = DAILY_KEY.exec(value)
  if (match === null) {
    return false
  }
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
