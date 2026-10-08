import { lerp, smoothstep } from '../geo/geo.utils'

/**
 * 값 잡음(value noise). 난수처럼 보이지만 **난수가 아니다** — 같은 입력이면 항상
 * 같은 값이다. 바람이 저장된 격자 없이 위치·날짜의 함수로 나오는 근거가 이것이다
 * (SHAPE W6, D1).
 *
 * `rng/`에 두는 이유: 이것은 바람 규칙이 아니라 난수 생성기와 같은 부류의
 * 수학 기반이다. `wind/`에 있으면 안에 든 상수가 풍계 튜닝 값으로 오해된다.
 */

/** 비트를 고르게 섞는 혼합 상수. 값 자체에 의미는 없고 서로 소인 것이 전부다. */
const MIX_X = 0x27d4eb2d
const MIX_Y = 0x85ebca6b
const MIX_Z = 0xc2b2ae35
const MIX_A = 0x2c1b3c6d
const MIX_B = 0x297a2d39
/** 상위 비트를 하위로 접어 내리는 자리수. */
const SHIFT_HIGH = 15
const SHIFT_MID = 12
/** 2^32. 부호 없는 32비트를 0~1로 옮긴다. */
const UINT32_SPAN = 4294967296

function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, MIX_X) ^ Math.imul(y | 0, MIX_Y) ^ Math.imul(z | 0, MIX_Z)
  h = Math.imul(h ^ (h >>> SHIFT_HIGH), MIX_A) >>> 0
  h = Math.imul(h ^ (h >>> SHIFT_MID), MIX_B) >>> 0
  return ((h ^ (h >>> SHIFT_HIGH)) >>> 0) / UINT32_SPAN
}

/** 공간·시간에 대해 매끄럽게 변하는 결정론적 잡음. 같은 입력이면 항상 같은 값. */
export function smoothNoise(x: number, y: number, t: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const t0 = Math.floor(t)
  const fx = smoothstep(x - x0)
  const fy = smoothstep(y - y0)
  const ft = smoothstep(t - t0)

  const corner = (dx: number, dy: number, dt: number): number => hash3(x0 + dx, y0 + dy, t0 + dt)

  const near = lerp(
    lerp(corner(0, 0, 0), corner(1, 0, 0), fx),
    lerp(corner(0, 1, 0), corner(1, 1, 0), fx),
    fy,
  )
  const far = lerp(
    lerp(corner(0, 0, 1), corner(1, 0, 1), fx),
    lerp(corner(0, 1, 1), corner(1, 1, 1), fx),
    fy,
  )
  return lerp(near, far, ft)
}
