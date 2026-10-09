import type { Terrain } from '../../../game/grid/world-grid.types'

/** 바다에 닿은 변. 뭍 칸의 모래톱을 어느 쪽에 그릴지 정한다. */
export interface CoastSides {
  n: boolean
  e: boolean
  s: boolean
  w: boolean
}

/** 타일 한 장을 고르는 데 필요한 것. 같은 키면 같은 그림이라 캐시한다. */
export interface TileKey {
  terrain: Terrain
  /** 무늬 변형 0~3. 칸 좌표에서 정해져 화면을 다시 그려도 같은 무늬다. */
  variant: number
  /** 바다 칸이 뭍에 붙어 있는가 — 얕은 물빛으로 칠한다. */
  shallow: boolean
  coast: CoastSides
}

/** 물결 무늬 두 장 가운데 하나. 화면 시계로 번갈아 그린다 — 게임 상태와 무관하다 (R52). */
export type WavePhase = 0 | 1

/** 픽셀 스프라이트 정의. 행마다 글자 하나가 한 픽셀이고 `.`은 투명이다. */
export interface PixelSprite {
  rows: readonly string[]
  palette: Readonly<Record<string, string>>
}

/** 옆모습 스프라이트가 바라보는 쪽. 2편의 지상 스프라이트처럼 좌우만 뒤집는다. */
export type Facing = 'left' | 'right'
