import { HOURS_PER_DAY } from '../../sim/calendar/calendar'
import { currentAt } from '../../sim/current/current'
import type { LatLon } from '../../sim/geo/geo.types'
import { toRadians } from '../../sim/geo/geo.utils'
import { headingOf } from '../grid/direction'
import type { Direction } from '../grid/direction.types'
import type { Cell, WorldGrid } from '../grid/world-grid.types'
import type { DriftResult, EastNorth } from './drift.types'

export const NO_DRIFT: EastNorth = { east: 0, north: 0 }

/** 방위의 단위 벡터. 메르카토르라 격자 방향이 곧 진방위다 (R1). */
function unit(headingDeg: number): EastNorth {
  return { east: Math.sin(toRadians(headingDeg)), north: Math.cos(toRadians(headingDeg)) }
}

/** 그 지점의 해류(노트). 시뮬의 해류를 그대로 쓴다 (R7). */
export function currentKnots(position: LatLon): EastNorth {
  const current = currentAt(position)
  const dir = unit(current.toDeg)
  return { east: current.speedKnots * dir.east, north: current.speedKnots * dir.north }
}

/** 해류 중 그 방향과 나란한 몫(노트). 전진을 돕거나 막는다. */
export function currentAlongKnots(current: EastNorth, dir: Direction): number {
  const u = unit(headingOf(dir))
  return current.east * u.east + current.north * u.north
}

/**
 * 한 칸을 가는 동안 옆으로 밀린 거리(해리).
 *
 * 나란한 몫은 이미 전진 속도에 들어갔으므로 수직인 몫만 센다 — 둘 다 세면 해류를 두 번
 * 먹인다. 태킹의 지그재그는 양 현이 상쇄되어 옆으로 쌓이지 않는다 (R13).
 */
export function crossDriftNm(current: EastNorth, dir: Direction, hours: number): EastNorth {
  const u = unit(headingOf(dir))
  const along = current.east * u.east + current.north * u.north
  return {
    east: (current.east - along * u.east) * hours,
    north: (current.north - along * u.north) * hours,
  }
}

/** 그 자리에 떠 있는 동안 해류 전체에 밀린 거리(해리). */
export function idleDriftNm(current: EastNorth, hours: number): EastNorth {
  return { east: current.east * hours, north: current.north * hours }
}

export function addDrift(a: EastNorth, b: EastNorth): EastNorth {
  return { east: a.east + b.east, north: a.north + b.north }
}

/**
 * 칸 안 위치가 경계를 넘으면 옆 칸으로 민다.
 *
 * 밀려 갈 칸이 바다가 아니면 그 성분을 버린다 — 배는 해안을 따라 붙어 있을 뿐 좌초하지 않는다.
 * 좌초는 트러블(P3)의 몫이다.
 */
export function resolveDrift(grid: WorldGrid, start: Cell, offsetNm: EastNorth): DriftResult {
  let cell = start
  let { east, north } = offsetNm
  const pushedThrough: Cell[] = []
  // 축을 하나씩 본다. 대각선 칸이 뭍이어도 한 축은 바다일 수 있다.
  for (;;) {
    const side = grid.stepNm(cell, 'e')
    const half = side / 2
    const dx = crosses(east, half) ? Math.sign(east) : 0
    const dy = dx !== 0 || !crosses(north, half) ? 0 : -Math.sign(north)
    if (dx === 0 && dy === 0) {
      return { cell, offsetNm: { east, north }, pushedThrough }
    }
    const next = { x: (cell.x + dx + grid.width) % grid.width, y: cell.y + dy }
    if (grid.terrainAt(next) !== 'sea') {
      if (dx !== 0) {
        east = 0
      } else {
        north = 0
      }
      continue
    }
    cell = next
    east -= dx * side
    north += dy * side
    pushedThrough.push(cell)
  }
}

/** 칸 안 위치가 경계를 넘었는가. 경계는 [-절반, 절반)이다. */
function crosses(offset: number, half: number): boolean {
  return offset >= half || offset < -half
}

/** 하루 해류로 밀리는 해리. 화면 표시용. */
export function dailyDriftNm(current: EastNorth): number {
  return Math.hypot(current.east, current.north) * HOURS_PER_DAY
}
