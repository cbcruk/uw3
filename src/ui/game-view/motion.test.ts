import { describe, expect, it } from 'vite-plus/test'
import { createRun, createWorld } from '../../game/run/run'
import type { RunEvent, RunState } from '../../game/run/run.types'
import { FLOAT_MS, MOVE_MS, motionOf, poseAt, snapshotOf } from './motion'

const grid = createWorld()

function freshRun(): RunState {
  return createRun(
    {
      seed: 1,
      startDate: { year: 1502, month: 3, day: 14 },
      startPortId: 'lisboa',
      shipClassId: 'caravela-redonda',
    },
    grid,
  )
}

const combat = (crewLost: number, foeLost: number): RunEvent => ({
  type: 'combat',
  encounterId: 'pirate-test',
  kind: 'pirate',
  initiated: true,
  crewLost,
  hullLost: 0,
  foeLost,
  foeLeft: 10,
})

describe('연출 — 그림만 따라잡는다 (R52)', () => {
  it('움직이지도 싸우지도 않았으면 연출이 없다', () => {
    const run = freshRun()
    expect(motionOf(snapshotOf(run), run, [], 0)).toBeNull()
  })

  it('한 칸 움직이면 출발 칸에서 시작해 도착 칸에서 끝난다', () => {
    const run = freshRun()
    const before = snapshotOf(run)
    run.player.cell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const motion = motionOf(before, run, [], 1000)
    expect(motion).not.toBeNull()
    if (motion === null) {
      return
    }
    expect(poseAt(motion, run, 1000)?.player).toEqual(before.player)
    const mid = poseAt(motion, run, 1000 + MOVE_MS / 2)?.player.x ?? 0
    expect(mid).toBeGreaterThan(before.player.x)
    expect(mid).toBeLessThan(run.player.cell.x)
    expect(poseAt(motion, run, 1000 + MOVE_MS)).toBeNull()
  })

  it('멀리 옮겨졌으면 미끄러지지 않고 바로 옮긴다', () => {
    const run = freshRun()
    const before = snapshotOf(run)
    run.player.cell = { x: run.player.cell.x + 30, y: run.player.cell.y }
    expect(motionOf(before, run, [], 0)).toBeNull()
  })

  it('한 합의 손실은 숫자로 떠오르고 화면이 흔들린다', () => {
    const run = freshRun()
    const motion = motionOf(snapshotOf(run), run, [combat(2, 0)], 0)
    expect(motion?.floaters).toEqual([{ at: run.player.cell, text: '-2', tone: 'bad' }])
    const pose = motion === null ? null : poseAt(motion, run, 30)
    expect(pose?.shake).not.toEqual({ x: 0, y: 0 })
    expect(motion === null ? null : poseAt(motion, run, FLOAT_MS)).toBeNull()
  })
})
