import { HOURS_PER_DAY, formatGameDate } from '../../sim/calendar/calendar'
import { WIND_REGIME_LABELS, describeWindDirection, windAt } from '../../sim/wind/wind'
import { currentAt, describeCurrentDirection } from '../../sim/current/current'
import type { Direction } from '../../game/grid/direction.types'
import {
  applyCommand,
  createRun,
  createWorld,
  dayNumberOf,
  passageFrom,
  force,
  replayRun,
  waterRatioOf,
} from '../../game/run/run'
import {
  applyRunToMeta,
  dailyConfig,
  dailyKey,
  freeConfig,
  recordOf,
} from '../../game/expedition/expedition'
import type { WorldGrid } from '../../game/grid/world-grid.types'
import { findPort } from '../../content/ports'
import { DEFAULT_EXPEDITION_SHIP } from '../../content/game/expedition-ships'
import { LANGUAGE_LABELS } from '../../content/content.types'
import { fameTitle, learnedLanguages } from '../../game/fame/fame'
import { bearingDeg, haversineNm } from '../../sim/geo/geo.utils'
import { loadActive, loadMeta, saveActive, saveMeta } from './game-storage'
import { renderExpeditionPanel } from './expedition-panel'
import { drawRegion } from './region-renderer'
import { motionOf, poseAt, snapshotOf } from './motion'
import type { Motion } from './motion.types'
import { renderMarket } from './market-panel'
import { canEnter } from '../../game/travel/travel'
import { knownLanguages, speaksAt } from '../../game/trade/trade'
import { cargoTons, daysOfSupply } from '../../game/supplies/supplies'
import type { RunConfig, RunState } from '../../game/run/run.types'
import type { LogLine } from './game-view.types'
import {
  CONVEYANCE_LABEL,
  DIRECTION_LABEL,
  encounterName,
  commandForKey,
  tradeCommandForKey,
  withShoreParty,
  describeDrift,
  describeEvent,
  hoursPerCell,
} from './game-view.utils'

const LOG_LIMIT = 14
const GAUGE_WARN = 0.5
const GAUGE_BAD = 0.25
const SEED_RANGE = 2 ** 32

interface Session {
  run: RunState
  daily: string | null
}

/** 나침반 3×3 칸 배치. 가운데는 자기 자리다. */
const COMPASS_LAYOUT: readonly (Direction | null)[] = [
  'nw',
  'n',
  'ne',
  'w',
  null,
  'e',
  'sw',
  's',
  'se',
]

/**
 * 로그라이크 화면. 영역 하나를 메르카토르 평면 타일로 그리고, 방향키 한 번에 한 칸 간다.
 *
 * 영역 경계를 넘으면 화면이 통째로 다음 영역으로 바뀐다 — 던전에서 층을 내려가는 것과 같다.
 * 진행 중인 원정은 명령 로그로 저장하고, 다시 열면 재현으로 이어 간다.
 */
export function mountGame(root: HTMLElement): void {
  const grid = createWorld()
  let meta = loadMeta()
  const saved = loadActive()
  let session: Session =
    saved === null
      ? startSession(grid, freeConfig(freshSeed(), meta), null)
      : { run: replayRun(saved.config, saved.commands, grid), daily: saved.daily }
  let chosenShip =
    saved === null || saved.daily !== null ? DEFAULT_EXPEDITION_SHIP : saved.config.shipClassId
  const log: LogLine[] = [
    ...(saved === null ? harborRumor(session.run) : []),
    {
      text: saved === null ? '원정을 떠난다. 방향키로 한 칸씩 움직인다' : '원정을 이어 간다',
      tone: 'info',
    },
  ]

  root.innerHTML = `
    <main class="layout">
      <section class="chart">
        <canvas id="rl-canvas" class="rl-canvas"></canvas>
        <p class="chart__hint">방향키 이동 · y u b n 대각선 · . 기다림(다음 날) · h 말 하선 · c 낙타 하선(절반, ⇧ 전원) · e 승선 · r 선원 고용(항구) · f 선체 수리(조선소) · 1–9 사기 · ⇧1–9 팔기(항구) · 적에게 가면 공격 · t 내주고 놓여나기 · x 항복 · <a href="#sim">시뮬레이터 →</a></p>
      </section>
      <aside class="panel">
        <div id="rl-expedition" class="rl-expedition"></div>
        <div id="rl-status" class="hud"></div>
        <div id="rl-market"></div>
        <div id="rl-compass" class="rl-compass"></div>
        <ul id="rl-log" class="rl-log"></ul>
      </aside>
    </main>
  `

  const canvas = root.querySelector<HTMLCanvasElement>('#rl-canvas')
  const expeditionRoot = root.querySelector<HTMLElement>('#rl-expedition')
  const statusRoot = root.querySelector<HTMLElement>('#rl-status')
  const marketRoot = root.querySelector<HTMLElement>('#rl-market')
  const compassRoot = root.querySelector<HTMLElement>('#rl-compass')
  const logRoot = root.querySelector<HTMLElement>('#rl-log')
  if (
    canvas === null ||
    expeditionRoot === null ||
    statusRoot === null ||
    marketRoot === null ||
    compassRoot === null ||
    logRoot === null
  ) {
    throw new Error('game view markup is incomplete')
  }
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('2d context unavailable')
  }

  // 연출 중이면 다음 프레임을 예약해 둔다. 키가 들어오면 끊고 끝 자세로 건너뛴다 — 게임 상태는 이미 끝에 있다 (R52).
  let motion: Motion | null = null
  let frameId = 0
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const animate = (now: number): void => {
    const pose = motion === null ? null : poseAt(motion, session.run, now)
    if (pose === null) {
      motion = null
      drawRegion(ctx, canvas, session.run)
      return
    }
    drawRegion(ctx, canvas, session.run, pose)
    frameId = requestAnimationFrame(animate)
  }

  const stopMotion = (): void => {
    cancelAnimationFrame(frameId)
    motion = null
  }

  const draw = (): void => {
    const { run } = session
    stopMotion()
    drawRegion(ctx, canvas, run)
    expeditionRoot.innerHTML = renderExpeditionPanel(run, session.daily, meta, dailyKey(new Date()))
    statusRoot.innerHTML = renderStatus(run)
    marketRoot.innerHTML = renderMarket(run)
    compassRoot.innerHTML = renderCompass(run)
    logRoot.innerHTML = log
      .map((line) => `<li class="rl-log__item rl-log__item--${line.tone}">${line.text}</li>`)
      .join('')
  }

  const pushLines = (lines: readonly (LogLine | null)[]): void => {
    for (const line of lines) {
      if (line !== null) {
        log.unshift(line)
      }
    }
    log.length = Math.min(log.length, LOG_LIMIT)
  }

  expeditionRoot.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const shipButton = target.closest<HTMLButtonElement>('button[data-ship]')
    const shipClassId = shipButton?.dataset['ship']
    if (shipButton !== null && shipClassId !== undefined) {
      chosenShip = shipClassId
      session = startSession(grid, freeConfig(session.run.config.seed, meta, chosenShip), null)
      pushLines([
        { text: `${session.run.shipClass.name}로 떠나기로 한다`, tone: 'info' },
        ...harborRumor(session.run),
      ])
      shipButton.blur()
      draw()
      return
    }
    const button = target.closest<HTMLButtonElement>('button[data-start]')
    if (button === null) {
      return
    }
    const today = dailyKey(new Date())
    const daily = button.dataset['start'] === 'daily' ? today : null
    const config = daily === null ? freeConfig(freshSeed(), meta, chosenShip) : dailyConfig(daily)
    session = startSession(grid, config, daily)
    log.length = 0
    pushLines([
      { text: `${daily === null ? '자유 원정' : '오늘의 원정'}을 떠난다`, tone: 'info' },
      ...harborRumor(session.run),
    ])
    button.blur()
    draw()
  })

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    const keyed = commandForKey(event.key, event.code)
    const command =
      keyed === null
        ? tradeCommandForKey(event.code, event.shiftKey, session.run)
        : withShoreParty(keyed, event.shiftKey, session.run)
    if (command === null || event.metaKey || event.ctrlKey) {
      return
    }
    event.preventDefault()
    const { run, daily } = session
    const wasRunning = run.ended === null
    const before = snapshotOf(run)
    const events = applyCommand(run, command)
    pushLines([...events.map(describeEvent), describeDrift(events)])
    const record = wasRunning ? recordOf(run, daily) : null
    if (record !== null) {
      const learnedBefore = learnedLanguages(meta.languageDocks)
      meta = applyRunToMeta(meta, run, record)
      saveMeta(meta)
      const newlyLearned = learnedLanguages(meta.languageDocks).filter(
        (language) => !learnedBefore.includes(language),
      )
      pushLines([
        { text: `명성 +${meta.records.at(-1)?.fame ?? 0} — ${fameTitle(meta.fame)}`, tone: 'good' },
        ...newlyLearned.map((language) => ({
          text: `${LANGUAGE_LABELS[language]}를 익혔다. 그 말을 쓰는 항구에서는 선원을 모으고 소문을 듣는다`,
          tone: 'good' as const,
        })),
      ])
      saveActive(null)
    } else if (run.ended === null) {
      saveActive({ config: run.config, commands: run.commands, daily })
    }
    draw()
    motion = reducedMotion.matches ? null : motionOf(before, run, events, performance.now())
    if (motion !== null) {
      // 첫 자세를 곧바로 그린다 — 끝 상태가 한 프레임 비치고 출발 칸으로 되돌아가지 않게.
      animate(performance.now())
    }
  })
  window.addEventListener('resize', draw)
  draw()
}

/**
 * 출항 항구에서 들은 소문의 로그. 런을 만들 때의 사건은 명령의 사건이 아니라 따로 낸다 (R74).
 * 말이 통하지 않는 항구면 아무것도 없다.
 */
function harborRumor(run: RunState): LogLine[] {
  const portId = run.config.startPortId
  if (!speaksAt(portId, knownLanguages(run.config))) {
    return []
  }
  const line = describeEvent({ type: 'rumor', portId, count: run.rumors.length })
  return line === null ? [] : [line]
}

/** 새 원정을 연다. 시작하자마자 저장해 두어 첫 명령 전에 닫아도 같은 계약으로 돌아온다. */
function startSession(grid: WorldGrid, config: RunConfig, daily: string | null): Session {
  const run = createRun(config, grid)
  saveActive({ config, commands: [], daily })
  return { run, daily }
}

/** 자유 원정의 시드. 고르는 순간만 비결정이다 — 고른 뒤의 원정은 시드로 재현된다. */
function freshSeed(): number {
  return Math.floor(Math.random() * SEED_RANGE)
}

function renderStatus(run: RunState): string {
  const position = run.grid.cellCenter(run.player.cell)
  const wind = windAt(position, dayNumberOf(run))
  const hour = Math.floor(run.elapsedHours % HOURS_PER_DAY)
  const lat = `${Math.abs(position.lat).toFixed(2)}°${position.lat >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(position.lon).toFixed(2)}°${position.lon >= 0 ? 'E' : 'W'}`
  const { supplies } = run
  const lead = force(run)
  const crewLabel = run.party === null ? '선원' : '뭍 무리'
  // 뭍 무리는 내릴 때의 몫이 가득이다. 배의 정원·상한으로 재면 절반만 내려도 경고색이 된다.
  const full = run.party?.landed ?? {
    crew: run.shipClass.crewMax,
    food: supplies.capacity,
    water: supplies.capacity,
  }
  const crewFull = full.crew
  const keepers =
    run.party === null
      ? ''
      : `<div class="readout__wide"><dt>배</dt><dd>지킴이 ${supplies.crew}명 · 식량 ${supplies.food.toLocaleString()} · 물 ${supplies.water.toLocaleString()}</dd></div>`
  return `
    <header class="hud__header">
      <h1>${formatGameDate(dayNumberOf(run))} ${String(hour).padStart(2, '0')}시</h1>
      <p>목표 ${describeGoal(run, position)}</p>
    </header>
    <div class="gauges">
      ${renderGauge(crewLabel, lead.crew, crewFull, `${lead.crew}/${crewFull}명`)}
      ${renderGauge('선체', supplies.hull, supplies.hullMax, `${supplies.hull}/${supplies.hullMax}`)}
      ${renderGauge('식량', lead.food, full.food, lead.food.toLocaleString())}
      ${renderGauge('물', lead.water, full.water, lead.water.toLocaleString())}
    </div>
    <dl class="readout">
      <div class="readout__wide"><dt>보급</dt><dd>${daysOfSupply(lead, waterRatioOf(run))}일분 · ${CONVEYANCE_LABEL[run.player.conveyance]}${describeWaterRatio(waterRatioOf(run))}</dd></div>
      ${keepers}
      <div class="readout__wide"><dt>바람</dt><dd>${describeWindDirection(wind.fromDeg)} ${wind.speedKnots.toFixed(1)}kn · ${WIND_REGIME_LABELS[wind.regime]}</dd></div>
      <div class="readout__wide"><dt>해류</dt><dd>${describeCurrent(position)}</dd></div>
      <div class="readout__wide"><dt>위치</dt><dd>${lat} ${lon}</dd></div>
      <div><dt>금화</dt><dd>${supplies.gold.toLocaleString()}두카트</dd></div>
      <div><dt>화물</dt><dd>${cargoTons(supplies.cargo)}/${supplies.holdTons}톤</dd></div>
      <div><dt>해역</dt><dd>(${run.region.rx}, ${run.region.ry})</dd></div>
      <div><dt>들른 곳</dt><dd>${run.visitedRegions.size}</dd></div>
      <div><dt>탐사</dt><dd>${run.explored.count().toLocaleString()}칸</dd></div>
      <div><dt>경과</dt><dd>${(run.elapsedHours / HOURS_PER_DAY).toFixed(1)}일</dd></div>
    </dl>
  `
}

/** 2편 상태창의 막대. 절반 아래면 노랗게, 4분의 1 아래면 붉게 칠한다. */
function renderGauge(label: string, value: number, max: number, text: string): string {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const tone = ratio > GAUGE_WARN ? 'good' : ratio > GAUGE_BAD ? 'warn' : 'bad'
  return `
    <div class="gauge">
      <span class="gauge__label">${label}</span>
      <span class="gauge__bar"><span class="gauge__fill gauge__fill--${tone}" style="width:${(ratio * 100).toFixed(1)}%"></span></span>
      <span class="gauge__text">${text}</span>
    </div>`
}

/** 목표 항구까지의 직선 방위와 거리. 항로가 아니라 대권 거리다 — 길은 플레이어가 찾는다. */
function describeGoal(run: RunState, position: { lat: number; lon: number }): string {
  const goal = run.config.goalPortId === undefined ? undefined : findPort(run.config.goalPortId)
  if (goal === undefined) {
    return '없음'
  }
  const distance = haversineNm(position, goal.anchorage)
  const toward = describeCurrentDirection(bearingDeg(position, goal.anchorage))
  return `${goal.name} · ${toward} ${Math.round(distance).toLocaleString()}해리`
}

/** 물이 평소보다 빨리 줄면 그 배율. 바다·초지에서는 아무것도 붙이지 않는다. */
function describeWaterRatio(ratio: number): string {
  return ratio === 1 ? '' : ` · 물 ×${ratio}`
}

function describeCurrent(position: { lat: number; lon: number }): string {
  const current = currentAt(position)
  if (current.speedKnots <= 0) {
    return '없음'
  }
  return `${describeCurrentDirection(current.toDeg)} ${current.speedKnots.toFixed(1)}kn · ${current.name}`
}

/** 방향마다 한 칸에 걸리는 시간. 바람이 막는 방향이 한눈에 보인다. */
function renderCompass(run: RunState): string {
  const cells = COMPASS_LAYOUT.map((dir) => {
    if (dir === null) {
      return `<div class="rl-compass__cell rl-compass__cell--self">@</div>`
    }
    const next = run.grid.neighbor(run.player.cell, dir)
    const terrain = next === null ? null : run.grid.terrainAt(next)
    if (terrain === null || !canEnter(run.player.conveyance, terrain)) {
      const wall = terrain === 'sea' ? '바다' : '뭍'
      return `<div class="rl-compass__cell rl-compass__cell--wall"><span>${DIRECTION_LABEL[dir]}</span>${wall}</div>`
    }
    const occupant = run.encounters.find(
      (encounter) => next !== null && encounter.cell.x === next.x && encounter.cell.y === next.y,
    )
    if (occupant !== undefined) {
      return `<div class="rl-compass__cell rl-compass__cell--blocked"><span>${DIRECTION_LABEL[dir]}</span>⚔ ${encounterName(occupant.kind)} ${occupant.crew}</div>`
    }
    const passage = passageFrom(run, dir)
    const hours = hoursPerCell(run.grid.stepNm(run.player.cell, dir), passage.rangeNm)
    const tack = passage.tacking ? ' ⤳' : ''
    const blocked = passage.sailRangeNm <= 0 ? '무풍' : '역류'
    const text = hours === null ? blocked : `${hours.toFixed(1)}h${tack}`
    const tone = hours === null ? 'rl-compass__cell--blocked' : ''
    return `<div class="rl-compass__cell ${tone}"><span>${DIRECTION_LABEL[dir]}</span>${text}</div>`
  })
  return `<p class="rl-compass__title">한 칸에 걸리는 시간 · ⤳ 태킹</p><div class="rl-compass__grid">${cells.join('')}</div>`
}
