import type { Cell } from '../grid/world-grid.types'

/**
 * 한 번이라도 본 칸. 원본의 `discovered`에 해당한다.
 *
 * 지금 보이는 칸(`visible`)은 저장하지 않는다 — 위치와 탈것에서 매번 파생된다.
 * 저장하면 재현(R8) 때 두 값이 갈라질 수 있다.
 */
export interface ExploredMap {
  has(cell: Cell): boolean
  /** 새로 본 칸 수를 돌려준다. */
  reveal(cells: readonly Cell[]): number
  count(): number
}
