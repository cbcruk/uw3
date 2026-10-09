import type { RunEvent, RunState } from '../../game/run/run.types'
import type { Floater, Motion, Point, Pose, Snapshot } from './motion.types'

/** 칸 사이를 미끄러지는 시간(ms). 키를 누르고 있어도 따라올 만큼 짧게 둔다. */
export const MOVE_MS = 140
/** 한 합에 화면이 흔들리는 시간(ms). */
export const SHAKE_MS = 220
/** 손실 숫자가 떠올라 사라지는 시간(ms). */
export const FLOAT_MS = 700
/** 흔들림의 폭(칸 비율). */
const SHAKE_AMPLITUDE = 0.12
/** 흔들림이 한 번 오가는 각속도(rad/ms). 220ms에 서너 번 흔들린다. */
const SHAKE_RATE = 0.09
/** 세로 흔들림은 가로보다 조금 빠르고 절반만 흔들린다 — 같은 박자면 대각선으로만 떨린다. */
const SHAKE_Y_RATE = 1.3
const SHAKE_Y_SHARE = 0.5
/** 숫자가 떠오르는 높이(칸). */
const FLOAT_RISE = 0.8
/** 이보다 멀리 움직였으면 미끄러지지 않고 바로 옮긴다 — 경도가 한 바퀴 돈 칸이나 항구로 돌아간 뭍 무리. */
const MAX_GLIDE_CELLS = 4

/** 명령을 적용하기 직전의 위치를 잡아 둔다. */
export function snapshotOf(run: RunState): Snapshot {
  return {
    region: run.region,
    player: { ...run.player.cell },
    encounters: new Map(run.encounters.map((encounter) => [encounter.id, { ...encounter.cell }])),
  }
}

/**
 * 명령 하나가 만든 연출. 영역이 바뀌었으면 미끄러지지 않는다 — 화면 전체가 다음 영역으로 바뀐다.
 *
 * 떠오르는 숫자는 한 합(`combat`)마다 하나씩이다. 잃은 선원과 선체는 플레이어 칸에, 상대가 잃은 머릿수는 상대 칸에 띄운다.
 */
export function motionOf(
  from: Snapshot,
  run: RunState,
  events: readonly RunEvent[],
  now: number,
): Motion | null {
  const floaters: Floater[] = []
  for (const event of events) {
    if (event.type !== 'combat') {
      continue
    }
    const foe =
      run.encounters.find((encounter) => encounter.id === event.encounterId)?.cell ??
      from.encounters.get(event.encounterId)
    if (event.crewLost > 0) {
      floaters.push({
        at: run.player.cell,
        onPlayer: true,
        text: `-${event.crewLost}`,
        tone: 'bad',
      })
    }
    if (event.hullLost > 0) {
      floaters.push({
        at: run.player.cell,
        onPlayer: true,
        text: `선체 -${event.hullLost}`,
        tone: 'bad',
      })
    }
    if (event.foeLost > 0 && foe !== undefined) {
      floaters.push({ at: foe, onPlayer: false, text: `-${event.foeLost}`, tone: 'good' })
    }
  }
  const sameRegion = from.region.rx === run.region.rx && from.region.ry === run.region.ry
  const moved =
    sameRegion &&
    (glides(from.player, run.player.cell) ||
      run.encounters.some((encounter) => {
        const before = from.encounters.get(encounter.id)
        return before !== undefined && glides(before, encounter.cell)
      }))
  if (!moved && floaters.length === 0) {
    return null
  }
  return {
    from: sameRegion ? from : snapshotOf(run),
    startedAt: now,
    floaters,
    shake: floaters.length > 0,
  }
}

/** 시각 `now`의 자세. 연출이 끝났으면 `null`이다 — 그때는 런 상태 그대로 그린다. */
export function poseAt(motion: Motion, run: RunState, now: number): Pose | null {
  // 프레임의 시각은 키를 누른 시각보다 이를 수 있다. 음수면 배가 뒤로 밀리고 흔들림이 커진다.
  const elapsed = Math.max(0, now - motion.startedAt)
  const total = Math.max(
    MOVE_MS,
    motion.shake ? SHAKE_MS : 0,
    motion.floaters.length > 0 ? FLOAT_MS : 0,
  )
  if (elapsed >= total) {
    return null
  }
  const t = easeOut(Math.min(1, elapsed / MOVE_MS))
  const encounters = new Map<string, Point>()
  for (const encounter of run.encounters) {
    const before = motion.from.encounters.get(encounter.id)
    encounters.set(encounter.id, between(before, encounter.cell, t))
  }
  const shaking = motion.shake && elapsed < SHAKE_MS
  const decay = 1 - elapsed / SHAKE_MS
  const float = Math.min(1, elapsed / FLOAT_MS)
  const player = between(motion.from.player, run.player.cell, t)
  return {
    player,
    encounters,
    shake: shaking
      ? {
          x: Math.sin(elapsed * SHAKE_RATE) * SHAKE_AMPLITUDE * decay,
          y:
            Math.cos(elapsed * SHAKE_RATE * SHAKE_Y_RATE) * SHAKE_AMPLITUDE * decay * SHAKE_Y_SHARE,
        }
      : { x: 0, y: 0 },
    floaters: motion.floaters.map((floater) => ({
      ...floater,
      at: floater.onPlayer ? player : floater.at,
      rise: float * FLOAT_RISE,
      alpha: 1 - float * float,
    })),
  }
}

function glides(from: Point, to: Point): boolean {
  const distance = Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y))
  return distance > 0 && distance <= MAX_GLIDE_CELLS
}

function between(from: Point | undefined, to: Point, t: number): Point {
  if (from === undefined || !glides(from, to)) {
    return { ...to }
  }
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}
