import type { Facing, PixelSprite } from './map-art.types'

const OUTLINE = '#10161e'
const cache = new Map<string, HTMLCanvasElement>()

/**
 * 픽셀 스프라이트를 캔버스로 굽는다. 둘레에 1픽셀 테두리를 둘러 어느 지형 위에서도 읽히게 한다.
 *
 * 같은 이름·같은 방향은 한 번만 굽는다. 왼쪽은 오른쪽 그림을 좌우로 뒤집은 것이다.
 */
export function bakeSprite(name: string, sprite: PixelSprite, facing: Facing): HTMLCanvasElement {
  const key = `${name}:${facing}`
  const hit = cache.get(key)
  if (hit !== undefined) {
    return hit
  }
  const height = sprite.rows.length
  const width = Math.max(...sprite.rows.map((row) => row.length))
  const canvas = document.createElement('canvas')
  canvas.width = width + 2
  canvas.height = height + 2
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('2d context unavailable')
  }
  const at = (x: number, y: number): string | undefined => {
    const row = sprite.rows[y]
    const column = facing === 'left' ? width - 1 - x : x
    const char = row?.[column]
    return char === undefined || char === '.' ? undefined : char
  }
  for (let y = -1; y <= height; y += 1) {
    for (let x = -1; x <= width; x += 1) {
      const char = at(x, y)
      if (char !== undefined) {
        ctx.fillStyle = sprite.palette[char] ?? OUTLINE
      } else if (
        at(x - 1, y) !== undefined ||
        at(x + 1, y) !== undefined ||
        at(x, y - 1) !== undefined ||
        at(x, y + 1) !== undefined
      ) {
        ctx.fillStyle = OUTLINE
      } else {
        continue
      }
      ctx.fillRect(x + 1, y + 1, 1, 1)
    }
  }
  cache.set(key, canvas)
  return canvas
}

/**
 * 구운 스프라이트를 칸 한가운데에 픽셀이 뭉개지지 않게 키워 그린다.
 *
 * @param scale 칸 한 변에 대한 스프라이트 폭의 비. 1이면 칸을 꽉 채운다.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  tile: number,
  scale: number,
): void {
  const pixel = Math.max(1, Math.floor((tile * scale) / sprite.width))
  const width = sprite.width * pixel
  const height = sprite.height * pixel
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    sprite,
    Math.round(centerX - width / 2),
    Math.round(centerY - height / 2),
    width,
    height,
  )
}
