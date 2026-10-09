import type { EncounterKindId } from '../../content/game/game-content.types'
import { GRID } from '../../content/game/grid.tuning'
import { headingOf } from '../../game/grid/direction'
import { isInSight } from '../../game/fog/fog'
import type { Cell } from '../../game/grid/world-grid.types'
import type { RunState } from '../../game/run/run.types'
import { bakeSprite, drawSprite } from './map-art/pixel-sprite'
import { PIRATE_SHIP, PLAYER_SHIP, drawShip } from './map-art/ship-art'
import { SPRITES } from './map-art/sprites'
import { terrainTile } from './map-art/terrain-tiles'
import { directionToward, facingOf, tileKeyOf } from './map-art/map-art.utils'
import type { Point, Pose } from './motion.types'

/** 소문으로만 아는 조우의 불투명도. 보이는 조우와 갈라 보이게 흐리게 둔다. */
const RUMOR_ALPHA = 0.45
const VOID = '#060a10'
/** 본 적은 있지만 지금은 안 보이는 칸에 덮는 색. 원본의 "기억한 타일"이다. */
const FOG_DIM = 'rgba(8, 14, 24, 0.55)'
const MIN_TILE = 4
/** 머릿수 딱지를 붙일 만큼 칸이 큰가. 작으면 숫자가 그림을 가린다. */
const BADGE_MIN_TILE = 14
const SPRITE_SCALE = 0.9
const PORT_SCALE = 0.85
const BERTH_SCALE = 0.75
const DOCKED_OFFSET = 0.3

interface Frame {
  ctx: CanvasRenderingContext2D
  tile: number
  originX: number
  originY: number
  x0: number
  y0: number
}

/**
 * 영역 한 장을 2편 지도처럼 그린다 — 16×16 픽셀 타일, 모래톱 두른 해안, 붉은 지붕 항구.
 *
 * 안개 규칙은 그대로다: 탐사하지 않은 칸은 비우고, 본 적만 있는 칸은 어둡게 덮고,
 * 조우는 지금 보이는 것만 그린다.
 *
 * @param pose 연출 중의 자세(`motion.ts`). 플레이어와 조우를 칸 사이에 그리고, 화면을 흔들고, 손실 숫자를 띄운다.
 *   없으면 런 상태 그대로 그린다. 무엇을 그릴지(안개·시야)는 언제나 런 상태가 정한다.
 */
export function drawRegion(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  run: RunState,
  pose?: Pose,
): void {
  const { grid, region, player, berth } = run
  const x0 = region.rx * GRID.regionCols
  const y0 = region.ry * GRID.regionRows
  const rows = Math.min(GRID.regionRows, grid.height - y0)
  const cols = GRID.regionCols

  const ratio = window.devicePixelRatio || 1
  const box = canvas.getBoundingClientRect()
  const tile = Math.max(MIN_TILE, Math.floor(Math.min(box.width / cols, box.height / rows)))
  canvas.width = Math.round(box.width * ratio)
  canvas.height = Math.round(box.height * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = VOID
  ctx.fillRect(0, 0, box.width, box.height)
  if (pose !== undefined) {
    ctx.translate(pose.shake.x * tile, pose.shake.y * tile)
  }

  const frame: Frame = {
    ctx,
    tile,
    originX: Math.floor((box.width - tile * cols) / 2),
    originY: Math.floor((box.height - tile * rows) / 2),
    x0,
    y0,
  }
  const seen = (cell: Cell): boolean => isInSight(grid, player.cell, player.conveyance, cell)

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = { x: x0 + x, y: y0 + y }
      const key = run.explored.has(cell) ? tileKeyOf(grid, cell) : null
      if (key === null) {
        continue
      }
      const left = frame.originX + x * tile
      const top = frame.originY + y * tile
      ctx.drawImage(terrainTile(key), left, top, tile, tile)
      if (grid.portAt(cell) !== null) {
        const [cx, cy] = center(frame, cell)
        drawSprite(ctx, bakeSprite('port', SPRITES.port, 'right'), cx, cy, tile, PORT_SCALE)
      }
      if (!seen(cell)) {
        ctx.fillStyle = FOG_DIM
        ctx.fillRect(left, top, tile, tile)
      }
    }
  }

  // 소문은 들은 자리에 흐리게 그린다. 지금 보이는 칸이면 진짜가 거기 있든 없든 소문은 그리지 않는다.
  for (const rumor of run.rumors) {
    const { cell } = rumor
    if (!inFrame(frame, cell, cols, rows) || seen(cell)) {
      continue
    }
    const [cx, cy] = center(frame, cell)
    ctx.save()
    ctx.globalAlpha = RUMOR_ALPHA
    if (sailsKind(rumor.kind)) {
      drawShip(ctx, cx, cy, tile, headingOf('e'), PIRATE_SHIP)
    } else {
      drawSprite(
        ctx,
        bakeSprite(rumor.kind, SPRITES[rumor.kind], 'right'),
        cx,
        cy,
        tile,
        SPRITE_SCALE,
      )
    }
    ctx.restore()
    if (tile >= BADGE_MIN_TILE) {
      drawBadge(frame, cell, `?${rumor.crew}`)
    }
  }

  for (const encounter of run.encounters) {
    const { cell } = encounter
    if (!inFrame(frame, cell, cols, rows) || !seen(cell)) {
      continue
    }
    const shown = pose?.encounters.get(encounter.id) ?? cell
    const [cx, cy] = at(frame, shown)
    const toward = directionToward(cell, player.cell) ?? 'e'
    if (sailsKind(encounter.kind)) {
      drawShip(ctx, cx, cy, tile, headingOf(toward), PIRATE_SHIP)
    } else {
      const sprite = bakeSprite(encounter.kind, SPRITES[encounter.kind], facingOf(toward))
      drawSprite(ctx, sprite, cx, cy, tile, SPRITE_SCALE)
    }
    if (tile >= BADGE_MIN_TILE) {
      drawBadge(frame, shown, String(encounter.crew))
    }
  }

  if (berth !== null && inFrame(frame, berth.cell, cols, rows)) {
    const [cx, cy] = center(frame, berth.cell)
    drawDocked(ctx, cx, cy, tile)
  }

  // 칸 안 위치(해류가 쌓은 편류)만큼 어긋나게 그린다. 칸 경계를 넘기 전에 밀리는 것이 보인다.
  const side = grid.stepNm(player.cell, 'e')
  const body = pose?.player ?? player.cell
  const px = frame.originX + (body.x - x0 + 0.5 + player.driftNm.east / side) * tile
  const py = frame.originY + (body.y - y0 + 0.5 - player.driftNm.north / side) * tile
  if (player.conveyance === 'ship' && grid.portAt(player.cell) !== null) {
    drawDocked(ctx, px, py, tile)
  } else if (player.conveyance === 'ship') {
    drawShip(ctx, px, py, tile, headingOf(player.facing), PLAYER_SHIP)
  } else {
    const mount = player.conveyance
    drawSprite(
      ctx,
      bakeSprite(mount, SPRITES[mount], facingOf(player.facing)),
      px,
      py,
      tile,
      SPRITE_SCALE,
    )
  }

  for (const floater of pose?.floaters ?? []) {
    drawFloater(frame, floater.at, floater.text, floater.tone, floater.rise, floater.alpha)
  }
}

/** 손실 숫자를 칸 위로 띄운다. 나쁜 숫자는 붉게, 좋은 숫자는 노랗게. */
function drawFloater(
  frame: Frame,
  cell: Point,
  text: string,
  tone: 'bad' | 'good',
  rise: number,
  alpha: number,
): void {
  const { ctx, tile } = frame
  const [cx, cy] = at(frame, cell)
  const size = Math.max(10, Math.floor(tile * 0.55))
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `bold ${size}px ui-monospace, Menlo, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(8, 12, 18, 0.9)'
  const y = cy - tile * (0.4 + rise)
  ctx.strokeText(text, cx, y)
  ctx.fillStyle = tone === 'bad' ? '#ff7a6a' : '#ffd36a'
  ctx.fillText(text, cx, y)
  ctx.restore()
}

/** 소수 칸 좌표의 화면 위치. 연출 중에는 칸 사이에 있다. */
function at(frame: Frame, point: Point): [number, number] {
  return [
    frame.originX + (point.x - frame.x0 + 0.5) * frame.tile,
    frame.originY + (point.y - frame.y0 + 0.5) * frame.tile,
  ]
}

/** 정박한 배는 작게 잔교 옆에 둔다. 항구 그림을 덮으면 어디에 들어왔는지 안 보인다. */
function drawDocked(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number): void {
  const offset = tile * DOCKED_OFFSET
  drawShip(ctx, x - offset, y + offset, tile * BERTH_SCALE, headingOf('w'), PLAYER_SHIP)
}

function center(frame: Frame, cell: Cell): [number, number] {
  return [
    frame.originX + (cell.x - frame.x0 + 0.5) * frame.tile,
    frame.originY + (cell.y - frame.y0 + 0.5) * frame.tile,
  ]
}

function inFrame(frame: Frame, cell: Cell, cols: number, rows: number): boolean {
  return (
    cell.x >= frame.x0 && cell.x < frame.x0 + cols && cell.y >= frame.y0 && cell.y < frame.y0 + rows
  )
}

/** 칸 오른쪽 위에 머릿수를 붙인다. 붙기 전에 싸울지 피할지 정하라고 보여 준다. */
function drawBadge(frame: Frame, cell: Point, text: string): void {
  const { ctx, tile } = frame
  const size = Math.max(8, Math.floor(tile * 0.42))
  ctx.font = `bold ${size}px ui-monospace, Menlo, monospace`
  const width = ctx.measureText(text).width + 4
  const right = frame.originX + (cell.x - frame.x0 + 1) * tile + width / 3
  const top = frame.originY + (cell.y - frame.y0) * tile - size / 3
  ctx.fillStyle = 'rgba(16, 22, 30, 0.85)'
  ctx.fillRect(right - width, top, width, size + 2)
  ctx.fillStyle = '#f0a090'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(text, right - 2, top + 1)
}

/** 배를 타는 조우인가. 해적과 해적 선단은 배로, 나머지는 스프라이트로 그린다. */
function sailsKind(kind: EncounterKindId): kind is 'pirate' | 'corsairs' {
  return kind === 'pirate' || kind === 'corsairs'
}
