import { GRID } from "../../content/game/grid.tuning";
import { HOURS_PER_DAY, formatGameDate } from "../../sim/calendar/calendar";
import { WIND_REGIME_LABELS, describeWindDirection, windAt } from "../../sim/wind/wind";
import type { Direction } from "../../game/grid/direction.types";
import { applyCommand, createRun, dayNumberOf, rangeTowardNm } from "../../game/run/run";
import { canEnter } from "../../game/travel/travel";
import type { RunConfig, RunState } from "../../game/run/run.types";
import type { LogLine } from "./game-view.types";
import {
  CONVEYANCE_COLOR,
  CONVEYANCE_LABEL,
  DIRECTION_LABEL,
  TERRAIN_STYLE,
  commandForKey,
  describeEvent,
  hoursPerCell,
} from "./game-view.utils";

const CONFIG: RunConfig = {
  seed: 0x5ea1e55,
  startDate: { year: 1502, month: 3, day: 14 },
  startPortId: "lisboa",
  shipClassId: "caravela-redonda",
};

const LOG_LIMIT = 14;

/** 나침반 3×3 칸 배치. 가운데는 자기 자리다. */
const COMPASS_LAYOUT: readonly (Direction | null)[] = [
  "nw",
  "n",
  "ne",
  "w",
  null,
  "e",
  "sw",
  "s",
  "se",
];

/**
 * 로그라이크 화면. 영역 하나를 메르카토르 평면 타일로 그리고, 방향키 한 번에 한 칸 간다.
 *
 * 영역 경계를 넘으면 화면이 통째로 다음 영역으로 바뀐다 — 던전에서 층을 내려가는 것과 같다.
 */
export function mountGame(root: HTMLElement): void {
  const run = createRun(CONFIG);
  const log: LogLine[] = [{ text: "리스본 정박 중. 방향키로 한 칸씩 움직인다", tone: "info" }];

  root.innerHTML = `
    <main class="layout">
      <section class="chart">
        <canvas id="rl-canvas" class="rl-canvas"></canvas>
        <p class="chart__hint">방향키 이동 · y u b n 대각선 · . 기다림(다음 날) · h 말 하선 · c 낙타 하선 · e 승선 · <a href="#sim">시뮬레이터 →</a></p>
      </section>
      <aside class="panel">
        <div id="rl-status" class="hud"></div>
        <div id="rl-compass" class="rl-compass"></div>
        <ul id="rl-log" class="rl-log"></ul>
      </aside>
    </main>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("#rl-canvas");
  const statusRoot = root.querySelector<HTMLElement>("#rl-status");
  const compassRoot = root.querySelector<HTMLElement>("#rl-compass");
  const logRoot = root.querySelector<HTMLElement>("#rl-log");
  if (canvas === null || statusRoot === null || compassRoot === null || logRoot === null) {
    throw new Error("game view markup is incomplete");
  }
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("2d context unavailable");
  }

  const draw = (): void => {
    drawRegion(ctx, canvas, run);
    statusRoot.innerHTML = renderStatus(run);
    compassRoot.innerHTML = renderCompass(run);
    logRoot.innerHTML = log
      .map((line) => `<li class="rl-log__item rl-log__item--${line.tone}">${line.text}</li>`)
      .join("");
  };

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const command = commandForKey(event.key, event.code);
    if (command === null || event.metaKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    for (const runEvent of applyCommand(run, command)) {
      const line = describeEvent(runEvent);
      if (line !== null) {
        log.unshift(line);
      }
    }
    log.length = Math.min(log.length, LOG_LIMIT);
    draw();
  });
  window.addEventListener("resize", draw);
  draw();
}

function drawRegion(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, run: RunState): void {
  const { grid, region, player, berth } = run;
  const x0 = region.rx * GRID.regionCols;
  const y0 = region.ry * GRID.regionRows;
  const rows = Math.min(GRID.regionRows, grid.height - y0);
  const cols = GRID.regionCols;

  const ratio = window.devicePixelRatio || 1;
  const box = canvas.getBoundingClientRect();
  const tile = Math.max(4, Math.floor(Math.min(box.width / cols, box.height / rows)));
  canvas.width = Math.round(box.width * ratio);
  canvas.height = Math.round(box.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#05090f";
  ctx.fillRect(0, 0, box.width, box.height);

  const offsetX = Math.floor((box.width - tile * cols) / 2);
  const offsetY = Math.floor((box.height - tile * rows) / 2);
  ctx.font = `${Math.floor(tile * 0.8)}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const glyph = (cx: number, cy: number, text: string, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillText(text, offsetX + (cx + 0.5) * tile, offsetY + (cy + 0.55) * tile);
  };

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = { x: x0 + x, y: y0 + y };
      const terrain = grid.terrainAt(cell);
      if (terrain === null) {
        continue;
      }
      const style = TERRAIN_STYLE[terrain];
      ctx.fillStyle = style.fill;
      ctx.fillRect(offsetX + x * tile, offsetY + y * tile, tile, tile);
      if (grid.portAt(cell) !== null) {
        glyph(x, y, "⚓", "#e0a83c");
      } else {
        glyph(x, y, style.glyph, style.glyphColor);
      }
    }
  }

  if (berth !== null && berth.cell.x >= x0 && berth.cell.y >= y0) {
    glyph(berth.cell.x - x0, berth.cell.y - y0, "⛵", "#f2c45a");
  }
  const px = player.cell.x - x0;
  const py = player.cell.y - y0;
  ctx.strokeStyle = CONVEYANCE_COLOR[player.conveyance];
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX + px * tile + 0.5, offsetY + py * tile + 0.5, tile - 1, tile - 1);
  glyph(px, py, "@", CONVEYANCE_COLOR[player.conveyance]);
}

function renderStatus(run: RunState): string {
  const position = run.grid.cellCenter(run.player.cell);
  const wind = windAt(position, dayNumberOf(run));
  const hour = Math.floor(run.elapsedHours % HOURS_PER_DAY);
  const lat = `${Math.abs(position.lat).toFixed(2)}°${position.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(position.lon).toFixed(2)}°${position.lon >= 0 ? "E" : "W"}`;
  return `
    <h1>${formatGameDate(dayNumberOf(run))} ${String(hour).padStart(2, "0")}시</h1>
    <dl class="hud__grid">
      <div><dt>위치</dt><dd>${lat} ${lon}</dd></div>
      <div><dt>탈것</dt><dd>${CONVEYANCE_LABEL[run.player.conveyance]}</dd></div>
      <div><dt>바람</dt><dd>${describeWindDirection(wind.fromDeg)} ${wind.speedKnots.toFixed(1)}kn · ${WIND_REGIME_LABELS[wind.regime]}</dd></div>
      <div><dt>해역</dt><dd>(${run.region.rx}, ${run.region.ry}) · 들른 곳 ${run.visitedRegions.size}</dd></div>
      <div><dt>경과</dt><dd>${(run.elapsedHours / HOURS_PER_DAY).toFixed(1)}일</dd></div>
    </dl>
  `;
}

/** 방향마다 한 칸에 걸리는 시간. 바람이 막는 방향이 한눈에 보인다. */
function renderCompass(run: RunState): string {
  const cells = COMPASS_LAYOUT.map((dir) => {
    if (dir === null) {
      return `<div class="rl-compass__cell rl-compass__cell--self">@</div>`;
    }
    const next = run.grid.neighbor(run.player.cell, dir);
    const terrain = next === null ? null : run.grid.terrainAt(next);
    if (terrain === null || !canEnter(run.player.conveyance, terrain)) {
      const wall = terrain === "sea" ? "바다" : "뭍";
      return `<div class="rl-compass__cell rl-compass__cell--wall"><span>${DIRECTION_LABEL[dir]}</span>${wall}</div>`;
    }
    const hours = hoursPerCell(run.grid.stepNm(run.player.cell, dir), rangeTowardNm(run, dir));
    const text = hours === null ? "역풍" : `${hours.toFixed(1)}h`;
    const tone = hours === null ? "rl-compass__cell--blocked" : "";
    return `<div class="rl-compass__cell ${tone}"><span>${DIRECTION_LABEL[dir]}</span>${text}</div>`;
  });
  return `<p class="rl-compass__title">한 칸에 걸리는 시간</p><div class="rl-compass__grid">${cells.join("")}</div>`;
}
