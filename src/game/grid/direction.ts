import type { Direction, GridDelta } from "./direction.types";

export const DIRECTIONS: readonly Direction[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

export const DIRECTION_DELTA: Readonly<Record<Direction, GridDelta>> = {
  n: { dx: 0, dy: -1 },
  ne: { dx: 1, dy: -1 },
  e: { dx: 1, dy: 0 },
  se: { dx: 1, dy: 1 },
  s: { dx: 0, dy: 1 },
  sw: { dx: -1, dy: 1 },
  w: { dx: -1, dy: 0 },
  nw: { dx: -1, dy: -1 },
};

/** 8방위 사이 각도. 정의다 — 360° / 8. */
const OCTANT_DEG = 45;

/**
 * 격자 방향의 진방위.
 *
 * 메르카토르는 등각이라 격자 방향이 곧 실제 방위다 (SPEC-roguelike §1).
 * 위경도 격자였다면 위도마다 달라졌을 값이다.
 */
export function headingOf(dir: Direction): number {
  return DIRECTIONS.indexOf(dir) * OCTANT_DEG;
}

export function isDiagonal(dir: Direction): boolean {
  const { dx, dy } = DIRECTION_DELTA[dir];
  return dx !== 0 && dy !== 0;
}
