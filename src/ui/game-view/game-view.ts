import { GRID } from "../../content/game/grid.tuning";
import { HOURS_PER_DAY, formatGameDate } from "../../sim/calendar/calendar";
import { WIND_REGIME_LABELS, describeWindDirection, windAt } from "../../sim/wind/wind";
import { currentAt, describeCurrentDirection } from "../../sim/current/current";
import { headingOf } from "../../game/grid/direction";
import type { Direction } from "../../game/grid/direction.types";
import {
  applyCommand,
  createRun,
  createWorld,
  dayNumberOf,
  passageFrom,
  replayRun,
} from "../../game/run/run";
import {
  applyRunToMeta,
  dailyConfig,
  dailyKey,
  freeConfig,
  recordOf,
} from "../../game/expedition/expedition";
import type { WorldGrid } from "../../game/grid/world-grid.types";
import { findPort } from "../../content/ports";
import { bearingDeg, haversineNm } from "../../sim/geo/geo.utils";
import { loadActive, loadMeta, saveActive, saveMeta } from "./game-storage";
import { renderExpeditionPanel } from "./expedition-panel";
import { isInSight } from "../../game/fog/fog";
import { canEnter } from "../../game/travel/travel";
import { daysOfSupply } from "../../game/supplies/supplies";
import type { RunConfig, RunState } from "../../game/run/run.types";
import type { LogLine } from "./game-view.types";
import {
  CONVEYANCE_COLOR,
  CONVEYANCE_LABEL,
  DIRECTION_LABEL,
  ENCOUNTER_STYLE,
  encounterName,
  TERRAIN_STYLE,
  commandForKey,
  describeDrift,
  describeEvent,
  hoursPerCell,
} from "./game-view.utils";

const LOG_LIMIT = 14;
const SEED_RANGE = 2 ** 32;

interface Session {
  run: RunState;
  daily: string | null;
}

/** 뱃머리 삼각형의 크기. 칸 한 변에 대한 비다. */
const BOW_TIP_RATIO = 0.45;
const BOW_BASE_RATIO = 0.3;
const BOW_TAIL_RATIO = 0.7;
const BOW_OUTLINE = "#05090f";

/** 본 적은 있지만 지금은 안 보이는 칸에 덮는 색. 원본의 "기억한 타일"이다. */
const FOG_DIM = "rgba(5, 9, 15, 0.62)";

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
 * 진행 중인 원정은 명령 로그로 저장하고, 다시 열면 재현으로 이어 간다.
 */
export function mountGame(root: HTMLElement): void {
  const grid = createWorld();
  let meta = loadMeta();
  const saved = loadActive();
  let session: Session =
    saved === null
      ? startSession(grid, freeConfig(freshSeed(), meta), null)
      : { run: replayRun(saved.config, saved.commands, grid), daily: saved.daily };
  const log: LogLine[] = [
    {
      text: saved === null ? "원정을 떠난다. 방향키로 한 칸씩 움직인다" : "원정을 이어 간다",
      tone: "info",
    },
  ];

  root.innerHTML = `
    <main class="layout">
      <section class="chart">
        <canvas id="rl-canvas" class="rl-canvas"></canvas>
        <p class="chart__hint">방향키 이동 · y u b n 대각선 · . 기다림(다음 날) · h 말 하선 · c 낙타 하선 · e 승선 · r 선원 고용(항구) · 적에게 가면 공격 · <a href="#sim">시뮬레이터 →</a></p>
      </section>
      <aside class="panel">
        <div id="rl-expedition" class="rl-expedition"></div>
        <div id="rl-status" class="hud"></div>
        <div id="rl-compass" class="rl-compass"></div>
        <ul id="rl-log" class="rl-log"></ul>
      </aside>
    </main>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("#rl-canvas");
  const expeditionRoot = root.querySelector<HTMLElement>("#rl-expedition");
  const statusRoot = root.querySelector<HTMLElement>("#rl-status");
  const compassRoot = root.querySelector<HTMLElement>("#rl-compass");
  const logRoot = root.querySelector<HTMLElement>("#rl-log");
  if (
    canvas === null ||
    expeditionRoot === null ||
    statusRoot === null ||
    compassRoot === null ||
    logRoot === null
  ) {
    throw new Error("game view markup is incomplete");
  }
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("2d context unavailable");
  }

  const draw = (): void => {
    const { run } = session;
    drawRegion(ctx, canvas, run);
    expeditionRoot.innerHTML = renderExpeditionPanel(
      run,
      session.daily,
      meta,
      dailyKey(new Date()),
    );
    statusRoot.innerHTML = renderStatus(run);
    compassRoot.innerHTML = renderCompass(run);
    logRoot.innerHTML = log
      .map((line) => `<li class="rl-log__item rl-log__item--${line.tone}">${line.text}</li>`)
      .join("");
  };

  const pushLines = (lines: readonly (LogLine | null)[]): void => {
    for (const line of lines) {
      if (line !== null) {
        log.unshift(line);
      }
    }
    log.length = Math.min(log.length, LOG_LIMIT);
  };

  expeditionRoot.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-start]");
    if (button === null) {
      return;
    }
    const today = dailyKey(new Date());
    const daily = button.dataset["start"] === "daily" ? today : null;
    const config = daily === null ? freeConfig(freshSeed(), meta) : dailyConfig(daily);
    session = startSession(grid, config, daily);
    log.length = 0;
    pushLines([{ text: `${daily === null ? "자유 원정" : "오늘의 원정"}을 떠난다`, tone: "info" }]);
    button.blur();
    draw();
  });

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const command = commandForKey(event.key, event.code);
    if (command === null || event.metaKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    const { run, daily } = session;
    const wasRunning = run.ended === null;
    const events = applyCommand(run, command);
    pushLines([...events.map(describeEvent), describeDrift(events)]);
    const record = wasRunning ? recordOf(run, daily) : null;
    if (record !== null) {
      meta = applyRunToMeta(meta, run, record);
      saveMeta(meta);
      saveActive(null);
    } else if (run.ended === null) {
      saveActive({ config: run.config, commands: run.commands, daily });
    }
    draw();
  });
  window.addEventListener("resize", draw);
  draw();
}

/** 새 원정을 연다. 시작하자마자 저장해 두어 첫 명령 전에 닫아도 같은 계약으로 돌아온다. */
function startSession(grid: WorldGrid, config: RunConfig, daily: string | null): Session {
  const run = createRun(config, grid);
  saveActive({ config, commands: [], daily });
  return { run, daily };
}

/** 자유 원정의 시드. 고르는 순간만 비결정이다 — 고른 뒤의 원정은 시드로 재현된다. */
function freshSeed(): number {
  return Math.floor(Math.random() * SEED_RANGE);
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
      if (terrain === null || !run.explored.has(cell)) {
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
      if (!isInSight(grid, player.cell, player.conveyance, cell)) {
        ctx.fillStyle = FOG_DIM;
        ctx.fillRect(offsetX + x * tile, offsetY + y * tile, tile, tile);
      }
    }
  }

  // 조우는 지금 보이는 것만 그린다. 탐사한 칸이어도 안개 속이면 거기 있는지 모른다.
  for (const encounter of run.encounters) {
    const { cell } = encounter;
    const inRegion = cell.x >= x0 && cell.x < x0 + cols && cell.y >= y0 && cell.y < y0 + rows;
    if (inRegion && isInSight(grid, player.cell, player.conveyance, cell)) {
      const terrain = grid.terrainAt(cell);
      const style = ENCOUNTER_STYLE[encounter.kind];
      ctx.fillStyle = terrain === null ? FOG_DIM : TERRAIN_STYLE[terrain].fill;
      ctx.fillRect(offsetX + (cell.x - x0) * tile, offsetY + (cell.y - y0) * tile, tile, tile);
      glyph(cell.x - x0, cell.y - y0, style.glyph, style.color);
    }
  }

  if (berth !== null && berth.cell.x >= x0 && berth.cell.y >= y0) {
    glyph(berth.cell.x - x0, berth.cell.y - y0, "⛵", "#f2c45a");
  }
  // 칸 안 위치(해류가 쌓은 편류)만큼 어긋나게 그린다. 칸 경계를 넘기 전에 밀리는 것이 보인다.
  const side = grid.stepNm(player.cell, "e");
  const cx = player.cell.x - x0 + 0.5 + player.driftNm.east / side;
  const cy = player.cell.y - y0 + 0.5 - player.driftNm.north / side;
  drawBow(ctx, offsetX + cx * tile, offsetY + cy * tile, tile, headingOf(player.facing));
  ctx.fillStyle = CONVEYANCE_COLOR[player.conveyance];
  ctx.fill();
  ctx.strokeStyle = BOW_OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * 뱃머리 삼각형의 경로를 만든다. 꼭짓점이 진행 방향이다.
 *
 * 메르카토르라 화면의 위가 진북이고, 격자 방향이 곧 진방위다 (R1). 캔버스 회전은
 * 시계 방향이 양수라 방위각을 그대로 넣으면 된다.
 */
function drawBow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  headingDeg: number,
): void {
  const tip = tile * BOW_TIP_RATIO;
  const base = tile * BOW_BASE_RATIO;
  const angle = (headingDeg * Math.PI) / 180;
  const point = (dx: number, dy: number): [number, number] => [
    x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y + dx * Math.sin(angle) + dy * Math.cos(angle),
  ];
  ctx.beginPath();
  ctx.moveTo(...point(0, -tip));
  ctx.lineTo(...point(base, tip * BOW_TAIL_RATIO));
  ctx.lineTo(...point(-base, tip * BOW_TAIL_RATIO));
  ctx.closePath();
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
      <div><dt>목표</dt><dd>${describeGoal(run, position)}</dd></div>
      <div><dt>위치</dt><dd>${lat} ${lon}</dd></div>
      <div><dt>해류</dt><dd>${describeCurrent(position)}</dd></div>
      <div><dt>탈것</dt><dd>${CONVEYANCE_LABEL[run.player.conveyance]}</dd></div>
      <div><dt>선원</dt><dd>${run.supplies.crew}명 · 선체 ${run.supplies.hull}/${run.supplies.hullMax}</dd></div>
      <div><dt>보급</dt><dd>식량 ${run.supplies.food} · 물 ${run.supplies.water} · ${daysOfSupply(run.supplies)}일분</dd></div>
      <div><dt>바람</dt><dd>${describeWindDirection(wind.fromDeg)} ${wind.speedKnots.toFixed(1)}kn · ${WIND_REGIME_LABELS[wind.regime]}</dd></div>
      <div><dt>해역</dt><dd>(${run.region.rx}, ${run.region.ry}) · 들른 곳 ${run.visitedRegions.size}</dd></div>
      <div><dt>탐사</dt><dd>${run.explored.count().toLocaleString()}칸</dd></div>
      <div><dt>경과</dt><dd>${(run.elapsedHours / HOURS_PER_DAY).toFixed(1)}일</dd></div>
    </dl>
  `;
}

/** 목표 항구까지의 직선 방위와 거리. 항로가 아니라 대권 거리다 — 길은 플레이어가 찾는다. */
function describeGoal(run: RunState, position: { lat: number; lon: number }): string {
  const goal = run.config.goalPortId === undefined ? undefined : findPort(run.config.goalPortId);
  if (goal === undefined) {
    return "없음";
  }
  const distance = haversineNm(position, goal.anchorage);
  const toward = describeCurrentDirection(bearingDeg(position, goal.anchorage));
  return `${goal.name} · ${toward} ${Math.round(distance).toLocaleString()}해리`;
}

function describeCurrent(position: { lat: number; lon: number }): string {
  const current = currentAt(position);
  if (current.speedKnots <= 0) {
    return "없음";
  }
  return `${describeCurrentDirection(current.toDeg)} ${current.speedKnots.toFixed(1)}kn · ${current.name}`;
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
    const occupant = run.encounters.find(
      (encounter) => next !== null && encounter.cell.x === next.x && encounter.cell.y === next.y,
    );
    if (occupant !== undefined) {
      return `<div class="rl-compass__cell rl-compass__cell--blocked"><span>${DIRECTION_LABEL[dir]}</span>⚔ ${encounterName(occupant.kind)} ${occupant.crew}</div>`;
    }
    const passage = passageFrom(run, dir);
    const hours = hoursPerCell(run.grid.stepNm(run.player.cell, dir), passage.rangeNm);
    const tack = passage.tacking ? " ⤳" : "";
    const blocked = passage.sailRangeNm <= 0 ? "무풍" : "역류";
    const text = hours === null ? blocked : `${hours.toFixed(1)}h${tack}`;
    const tone = hours === null ? "rl-compass__cell--blocked" : "";
    return `<div class="rl-compass__cell ${tone}"><span>${DIRECTION_LABEL[dir]}</span>${text}</div>`;
  });
  return `<p class="rl-compass__title">한 칸에 걸리는 시간 · ⤳ 태킹</p><div class="rl-compass__grid">${cells.join("")}</div>`;
}
