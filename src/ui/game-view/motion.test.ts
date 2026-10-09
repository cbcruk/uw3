import { describe, expect, it } from 'vite-plus/test'
import { createRun, createWorld } from '../../game/run/run'
import type { RunEvent, RunState } from '../../game/run/run.types'
import { GRID } from '../../content/game/grid.tuning'
import {
  FLOAT_MS,
  MOVE_MS,
  SHAKE_MS,
  SLIDE_MS,
  VANISH_MS,
  motionOf,
  poseAt,
  snapshotOf,
} from './motion'

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
    expect(motion?.floaters).toEqual([
      { at: run.player.cell, onPlayer: true, text: '-2', tone: 'bad' },
    ])
    const pose = motion === null ? null : poseAt(motion, run, 30)
    expect(pose?.shake).not.toEqual({ x: 0, y: 0 })
    expect(motion === null ? null : poseAt(motion, run, FLOAT_MS)).toBeNull()
  })

  it('영역이 바뀌었으면 미끄러지지 않고 옛 영역을 나간 쪽으로 밀어낸다', () => {
    const run = freshRun()
    const from = { rx: run.region.rx - 1, ry: run.region.ry }
    const before = { ...snapshotOf(run), region: from }
    run.player.cell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const motion = motionOf(before, run, [], 0)
    expect(motion?.slide).toEqual({ from, dx: 1, dy: 0 })
    const pose = motion === null ? null : poseAt(motion, run, SLIDE_MS / 2)
    expect(pose?.player).toEqual(run.player.cell)
    expect(pose?.slide?.t).toBeGreaterThan(0)
    expect(pose?.slide?.t).toBeLessThan(1)
    expect(motion === null ? null : poseAt(motion, run, SLIDE_MS)).toBeNull()
  })

  it('경도가 한 바퀴 돌아 맨 동쪽에서 맨 서쪽 영역으로 넘어가도 동쪽으로 민다', () => {
    const run = freshRun()
    const columns = Math.ceil(run.grid.width / GRID.regionCols)
    run.region = { rx: 0, ry: run.region.ry }
    const before = { ...snapshotOf(run), region: { rx: columns - 1, ry: run.region.ry } }
    expect(motionOf(before, run, [], 0)?.slide).toMatchObject({ dx: 1, dy: 0 })
  })

  it('반대로 맨 서쪽에서 맨 동쪽 영역으로 넘어가면 서쪽으로 민다', () => {
    const run = freshRun()
    const columns = Math.ceil(run.grid.width / GRID.regionCols)
    run.region = { rx: columns - 1, ry: run.region.ry }
    const before = { ...snapshotOf(run), region: { rx: 0, ry: run.region.ry } }
    expect(motionOf(before, run, [], 0)?.slide).toMatchObject({ dx: -1, dy: 0 })
  })

  it('대각선으로 넘어가면 두 축으로 민다', () => {
    const run = freshRun()
    const before = { ...snapshotOf(run), region: { rx: run.region.rx + 1, ry: run.region.ry + 1 } }
    expect(motionOf(before, run, [], 0)?.slide).toMatchObject({ dx: -1, dy: -1 })
  })

  it('이웃하지 않은 영역으로 옮겨졌으면 밀지 않는다', () => {
    const run = freshRun()
    const before = { ...snapshotOf(run), region: { rx: run.region.rx + 3, ry: run.region.ry } }
    expect(motionOf(before, run, [], 0)).toBeNull()
  })

  it('쫓아와 붙은 뒤 사라진 조우는 마지막으로 옮겨 간 칸에서 흐려진다', () => {
    const run = freshRun()
    const start = { x: run.player.cell.x + 3, y: run.player.cell.y }
    const end = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const before = {
      ...snapshotOf(run),
      encounters: new Map([['pirate-test', start]]),
      kinds: new Map([['pirate-test', 'pirate' as const]]),
    }
    const moved: RunEvent = { type: 'move', actorId: 'pirate-test', from: start, to: end, hours: 1 }
    expect(motionOf(before, run, [moved], 0)?.vanishing).toEqual([{ kind: 'pirate', at: end }])
  })

  it('같은 영역에서 사라진 조우는 있던 칸에서 흐려지며 가라앉는다', () => {
    const run = freshRun()
    const foeCell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const before = {
      ...snapshotOf(run),
      encounters: new Map([['pirate-test', foeCell]]),
      kinds: new Map([['pirate-test', 'pirate' as const]]),
    }
    const motion = motionOf(before, run, [], 0)
    expect(motion?.vanishing).toEqual([{ kind: 'pirate', at: foeCell }])
    const early = motion === null ? null : poseAt(motion, run, VANISH_MS / 4)
    const late = motion === null ? null : poseAt(motion, run, (VANISH_MS * 3) / 4)
    expect(late?.vanishing[0]?.alpha).toBeLessThan(early?.vanishing[0]?.alpha ?? 0)
    expect(late?.vanishing[0]?.sink).toBeGreaterThan(early?.vanishing[0]?.sink ?? 0)
    expect(motion === null ? null : poseAt(motion, run, VANISH_MS)).toBeNull()
  })

  it('영역이 바뀌어 남은 조우는 흐려지지 않는다', () => {
    const run = freshRun()
    const before = {
      ...snapshotOf(run),
      region: { rx: run.region.rx - 1, ry: run.region.ry },
      encounters: new Map([['pirate-test', run.player.cell]]),
      kinds: new Map([['pirate-test', 'pirate' as const]]),
    }
    expect(motionOf(before, run, [], 0)?.vanishing).toEqual([])
  })

  it('쓰러진 상대의 손실은 사라지기 전 칸에 노랗게 뜬다', () => {
    const run = freshRun()
    const foeCell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const before = { ...snapshotOf(run), encounters: new Map([['pirate-test', foeCell]]) }
    const motion = motionOf(before, run, [combat(0, 3)], 0)
    expect(motion?.floaters).toEqual([{ at: foeCell, onPlayer: false, text: '-3', tone: 'good' }])
  })

  it('미끄러지는 배의 손실 숫자는 배를 따라간다', () => {
    const run = freshRun()
    const before = snapshotOf(run)
    run.player.cell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const motion = motionOf(before, run, [combat(1, 0)], 0)
    const pose = motion === null ? null : poseAt(motion, run, MOVE_MS / 2)
    expect(pose?.floaters[0]?.at).toEqual(pose?.player)
  })

  it('프레임 시각이 키보다 일러도 출발 칸을 넘어 뒤로 가지 않는다', () => {
    const run = freshRun()
    const before = snapshotOf(run)
    run.player.cell = { x: run.player.cell.x + 1, y: run.player.cell.y }
    const motion = motionOf(before, run, [combat(1, 0)], 100)
    const pose = motion === null ? null : poseAt(motion, run, 90)
    expect(pose?.player).toEqual(before.player)
    expect(Math.abs(pose?.shake.x ?? 0)).toBeLessThanOrEqual(0.12)
    expect(motion === null ? null : poseAt(motion, run, 100 + SHAKE_MS)?.shake).toEqual({
      x: 0,
      y: 0,
    })
  })
})
