/** 배의 색. 선체·돛·돛의 문장. */
export interface ShipColors {
  hull: string
  sail: string
  emblem: string
}

export const PLAYER_SHIP: ShipColors = { hull: '#8a5a2b', sail: '#f4ecd8', emblem: '#c83030' }
export const PIRATE_SHIP: ShipColors = { hull: '#6a2a20', sail: '#26262a', emblem: '#e8e0d0' }

const OUTLINE = '#10161e'

/** 위에서 본 선체. 칸 한 변을 1로 둔 좌표이고 뱃머리가 위(-y)다. */
const HULL: readonly (readonly [number, number])[] = [
  [0, -0.46],
  [0.17, -0.16],
  [0.16, 0.34],
  [0, 0.42],
  [-0.16, 0.34],
  [-0.17, -0.16],
]
const MAIN_SAIL = { y: -0.04, half: 0.34, depth: 0.2 }
const FORE_SAIL = { y: 0.26, half: 0.24, depth: 0.14 }

/**
 * 위에서 본 배를 그린다. 뱃머리가 진행 방향이다.
 *
 * 2편의 배 스프라이트는 8방향을 따로 그렸다. 여기서는 그 대신 돌린다 — 메르카토르라 화면의 위가
 * 진북이고 격자 방향이 곧 진방위이므로(R1), 바람과 뱃머리의 각도가 그대로 읽힌다.
 * 돛은 가로로 펼친 사각돛이고, 주돛에 문장(포르투갈의 그리스도 기사단 십자)을 그린다.
 */
export function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  headingDeg: number,
  colors: ShipColors,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((headingDeg * Math.PI) / 180)
  ctx.scale(tile, tile)
  ctx.lineWidth = 1 / tile
  ctx.strokeStyle = OUTLINE

  ctx.beginPath()
  HULL.forEach(([px, py], index) => (index === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)))
  ctx.closePath()
  ctx.fillStyle = colors.hull
  ctx.fill()
  ctx.stroke()

  for (const sail of [FORE_SAIL, MAIN_SAIL]) {
    ctx.beginPath()
    ctx.moveTo(-sail.half, sail.y)
    ctx.quadraticCurveTo(0, sail.y - sail.depth, sail.half, sail.y)
    ctx.lineTo(sail.half, sail.y + sail.depth)
    ctx.quadraticCurveTo(0, sail.y, -sail.half, sail.y + sail.depth)
    ctx.closePath()
    ctx.fillStyle = colors.sail
    ctx.fill()
    ctx.stroke()
  }

  const cross = MAIN_SAIL.depth * 0.45
  const middle = MAIN_SAIL.y + cross * 0.4
  ctx.fillStyle = colors.emblem
  ctx.fillRect(-cross / 3, middle - cross, (cross * 2) / 3, cross * 2)
  ctx.fillRect(-cross, middle - cross / 3, cross * 2, (cross * 2) / 3)
  ctx.restore()
}
