import type { Terrain } from '../../../game/grid/world-grid.types'
import type { TileKey } from './map-art.types'
import { tileCacheKey } from './map-art.utils'

/** 타일 한 장의 픽셀 수. 2편의 지도 타일처럼 16×16으로 그리고 화면 칸 크기로 키운다. */
export const TILE_PX = 16

const BEACH_PX = 2
const LCG_MUL = 1103515245
const LCG_ADD = 12345
const UINT32 = 2 ** 32

interface TerrainPalette {
  base: string
  dark: string
  light: string
}

/** 2편의 밝은 지도 빛. 바다는 파랗고, 초지는 푸르고, 사막은 모래빛이다. */
const PALETTE: Readonly<Record<Terrain, TerrainPalette>> = {
  sea: { base: '#2a58a8', dark: '#22488e', light: '#6c9ade' },
  grassland: { base: '#4a8c3c', dark: '#356a2c', light: '#6aac52' },
  desert: { base: '#d2b06a', dark: '#b48c48', light: '#e8cc8a' },
}
const SHALLOW: TerrainPalette = { base: '#3a74c0', dark: '#2f62a8', light: '#86b6ea' }
const BEACH = '#e6d6a0'
const FOAM = '#d8ecf8'
const TREE = '#2a5422'

const cache = new Map<string, HTMLCanvasElement>()

/** 타일을 굽는다. 같은 키는 한 번만 굽는다. */
export function terrainTile(key: TileKey): HTMLCanvasElement {
  const cacheKey = tileCacheKey(key)
  const hit = cache.get(cacheKey)
  if (hit !== undefined) {
    return hit
  }
  const canvas = document.createElement('canvas')
  canvas.width = TILE_PX
  canvas.height = TILE_PX
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('2d context unavailable')
  }
  const random = lcg(hashKey(cacheKey))
  if (key.terrain === 'sea') {
    paintSea(ctx, key.shallow ? SHALLOW : PALETTE.sea, random)
  } else {
    paintLand(ctx, key, random)
  }
  cache.set(cacheKey, canvas)
  return canvas
}

/** 물결: 짧은 ‿ 무늬 두세 개. 2편 바다의 반짝이는 줄무늬다. */
function paintSea(
  ctx: CanvasRenderingContext2D,
  palette: TerrainPalette,
  random: () => number,
): void {
  fill(ctx, palette.base, 0, 0, TILE_PX, TILE_PX)
  const waves = 2 + Math.floor(random() * 2)
  for (let i = 0; i < waves; i += 1) {
    const x = Math.floor(random() * (TILE_PX - 4))
    const y = 2 + Math.floor(random() * (TILE_PX - 4))
    fill(ctx, palette.light, x, y, 1, 1)
    fill(ctx, palette.light, x + 1, y + 1, 2, 1)
    fill(ctx, palette.light, x + 3, y, 1, 1)
    fill(ctx, palette.dark, x + 1, y + 2, 2, 1)
  }
}

function paintLand(ctx: CanvasRenderingContext2D, key: TileKey, random: () => number): void {
  const palette = PALETTE[key.terrain]
  fill(ctx, palette.base, 0, 0, TILE_PX, TILE_PX)
  const specks = 6 + Math.floor(random() * 4)
  for (let i = 0; i < specks; i += 1) {
    const x = Math.floor(random() * TILE_PX)
    const y = Math.floor(random() * TILE_PX)
    fill(ctx, random() < 0.5 ? palette.dark : palette.light, x, y, 1, 1)
  }
  if (key.terrain === 'grassland' && key.variant === 0) {
    paintTree(ctx, 5 + Math.floor(random() * 6), 4 + Math.floor(random() * 6), palette)
  }
  if (key.terrain === 'desert') {
    // 사구: 비스듬한 그늘 한 줄
    const y = 4 + Math.floor(random() * 8)
    const x = Math.floor(random() * 6)
    fill(ctx, palette.dark, x, y, 5, 1)
    fill(ctx, palette.light, x + 1, y - 1, 4, 1)
  }
  paintCoast(ctx, key)
}

function paintTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: TerrainPalette,
): void {
  fill(ctx, TREE, x, y + 1, 4, 3)
  fill(ctx, TREE, x + 1, y, 2, 1)
  fill(ctx, palette.light, x + 1, y + 1, 1, 1)
  fill(ctx, '#5a3a20', x + 1, y + 4, 2, 1)
}

/** 바다에 닿은 변에 모래톱과 물거품을 두른다. 해안선이 칸 경계에서 또렷해진다. */
function paintCoast(ctx: CanvasRenderingContext2D, key: TileKey): void {
  const { n, e, s, w } = key.coast
  const edge = TILE_PX - BEACH_PX
  if (n) {
    fill(ctx, BEACH, 0, 0, TILE_PX, BEACH_PX)
    fill(ctx, FOAM, 0, 0, TILE_PX, 1)
  }
  if (s) {
    fill(ctx, BEACH, 0, edge, TILE_PX, BEACH_PX)
    fill(ctx, FOAM, 0, TILE_PX - 1, TILE_PX, 1)
  }
  if (w) {
    fill(ctx, BEACH, 0, 0, BEACH_PX, TILE_PX)
    fill(ctx, FOAM, 0, 0, 1, TILE_PX)
  }
  if (e) {
    fill(ctx, BEACH, edge, 0, BEACH_PX, TILE_PX)
    fill(ctx, FOAM, TILE_PX - 1, 0, 1, TILE_PX)
  }
}

function fill(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

/** 타일 무늬용 작은 난수. 게임의 결정성과 무관하다 — 그림만 정한다. */
function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, LCG_MUL) + LCG_ADD) >>> 0
    return state / UINT32
  }
}

function hashKey(text: string): number {
  let hash = 0
  for (const char of text) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
  }
  return hash
}
