import type { MapPalette } from './map-view.types'

export const MAP_PALETTE: MapPalette = {
  fog: '#05090f',
  sea: '#123049',
  land: '#4a5340',
  coast: '#727a5c',
  grid: '#ffffff10',
  track: '#e8c88866',
  ship: '#f5e6c8',
  port: '#e0a83c',
  wind: '#7fb3d5',
  destination: '#8fd6a0',
  equator: '#ffffff22',
  current: '#4fa3c7',
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  headingDeg: number,
  size: number,
  color: string,
): void {
  const radians = ((headingDeg - 90) * Math.PI) / 180
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(radians)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(-size * 0.7, size * 0.62)
  ctx.lineTo(-size * 0.35, 0)
  ctx.lineTo(-size * 0.7, -size * 0.62)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
