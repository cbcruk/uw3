import { describe, expect, it } from 'vite-plus/test'
import { dailyConfig, recordOf } from '../expedition/expedition'
import { DIRECTIONS } from '../grid/direction'
import { applyCommand, createRun, createWorld } from '../run/run'
import type { RunState } from '../run/run.types'
import { parseSubmission, submissionOf, verifySubmission } from './submission'
import type { Submission } from './submission.types'

const grid = createWorld()
const DAY = '2026-10-10'
const RULES = 'rules-a'
const WAIT_LIMIT = 5000

/** 오늘의 데일리를 바다로 나가 끝날 때까지 기다린다. 굶든 잡히든 끝나기만 하면 된다. */
function finishedDaily(): RunState {
  const run = createRun(dailyConfig(DAY), grid)
  for (const dir of DIRECTIONS) {
    applyCommand(run, { type: 'move', dir })
    if (grid.portAt(run.player.cell) === null) {
      break
    }
  }
  for (let i = 0; i < WAIT_LIMIT && run.ended === null; i += 1) {
    applyCommand(run, { type: 'wait' })
  }
  return run
}

const run = finishedDaily()
const submission = submissionOf(run, DAY, RULES) as Submission

describe('데일리 재현 검증', () => {
  it('끝난 데일리를 다시 돌리면 같은 기록이 나온다', () => {
    expect(run.ended).not.toBeNull()
    const verdict = verifySubmission(JSON.parse(JSON.stringify(submission)), RULES, grid)
    expect(verdict).toEqual({ ok: true, record: recordOf(run, DAY) })
  })

  it('끝나지 않았거나 데일리가 아닌 원정은 낼 것이 없다', () => {
    expect(submissionOf(createRun(dailyConfig(DAY), grid), DAY, RULES)).toBeNull()
    expect(submissionOf(run, null, RULES)).toBeNull()
  })

  it('규칙 버전이 다르면 돌리지 않는다', () => {
    expect(verifySubmission(submission, 'rules-b', grid)).toEqual({ ok: false, reason: 'rules' })
  })

  it('다른 날의 키로 내면 다른 판이라 같은 기록이 나오지 않는다', () => {
    const verdict = verifySubmission({ ...submission, daily: '2026-10-11' }, RULES, grid)
    expect(verdict).not.toEqual({ ok: true, record: recordOf(run, DAY) })
  })

  it('끝난 뒤에 명령이 남으면 받지 않는다', () => {
    const commands = [...submission.commands, { type: 'wait' }]
    expect(verifySubmission({ ...submission, commands }, RULES, grid)).toEqual({
      ok: false,
      reason: 'trailing',
    })
  })

  it('명령이 모자라 끝나지 않으면 받지 않는다', () => {
    const commands = submission.commands.slice(0, -1)
    expect(verifySubmission({ ...submission, commands }, RULES, grid)).toEqual({
      ok: false,
      reason: 'unfinished',
    })
  })

  it('받아들여지지 않는 명령이 섞이면 받지 않는다', () => {
    const commands = [{ type: 'embark' }, ...submission.commands]
    expect(verifySubmission({ ...submission, commands }, RULES, grid)).toEqual({
      ok: false,
      reason: 'rejected',
    })
  })

  it.each([
    ['날짜 키가 달력에 없다', { daily: '2026-02-30' }],
    ['날짜 키의 꼴이 틀렸다', { daily: '2026-1-5' }],
    ['규칙 버전이 문자열이 아니다', { rules: 1 }],
    ['명령이 배열이 아니다', { commands: {} }],
    ['없는 방향', { commands: [{ type: 'move', dir: 'up' }] }],
    ['없는 탈것', { commands: [{ type: 'disembark', mount: 'mule' }] }],
    ['선원 수가 정수가 아니다', { commands: [{ type: 'disembark', mount: 'horse', crew: 1.5 }] }],
    ['없는 품목', { commands: [{ type: 'buy', goodId: 'gold', tons: 1 }] }],
    ['음수 톤', { commands: [{ type: 'sell', goodId: 'salt', tons: -1 }] }],
    ['없는 명령', { commands: [{ type: 'teleport' }] }],
  ])('모양이 틀리면 받지 않는다 — %s', (_, patch) => {
    expect(verifySubmission({ ...submission, ...patch }, RULES, grid)).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })

  it('명령의 남는 필드는 버리고 읽는다', () => {
    const parsed = parseSubmission({
      ...submission,
      commands: [
        { type: 'wait', extra: true },
        { type: 'disembark', mount: 'camel', crew: 3 },
      ],
    })
    expect(parsed?.commands).toEqual([
      { type: 'wait' },
      { type: 'disembark', mount: 'camel', crew: 3 },
    ])
  })
})
