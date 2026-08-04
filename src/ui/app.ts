import type { LatLon } from "../sim/geo/geo.types";
import { bearingDeg, haversineNm, normalizeHeading } from "../sim/geo/geo.utils";
import { createGame } from "../sim/world/world";
import { applyAction } from "../sim/world/world";
import type { GameAction } from "../sim/world/world.types";
import { HISTORICAL_VOYAGES } from "../content/voyages";
import { compareToRecord } from "../sim/voyage/logbook";
import { createHud } from "./hud/hud";
import { createMapView } from "./map-view/globe-view";

const TRACK_LIMIT = 400;
/** v1은 재현 항해 하나에 집중한다 (SPEC 9). */
const VOYAGE = HISTORICAL_VOYAGES[0]!;

export function mountApp(root: HTMLElement): void {
  const game = createGame();
  const track: LatLon[] = [{ ...game.voyage.position }];
  let lastStop: string | null = null;

  root.innerHTML = `
    <main class="layout">
      <section class="chart">
        <canvas id="chart-canvas"></canvas>
        <p class="chart__hint" id="chart-hint"></p>
      </section>
      <aside class="panel">
        <div id="hud" class="hud"></div>
        <div class="controls">
          <div class="controls__row">
            <button data-action="turn-left">◄ 15°</button>
            <button data-action="turn-right">15° ►</button>
            <button data-action="anchor"></button>
          </div>
          <div class="controls__row" id="sails"></div>
          <div class="controls__row">
            <button data-action="port"></button>
            <button data-action="resupply">보급 · 수리</button>
          </div>
          <div class="controls__row" id="steering"></div>
          <div class="controls__row">
            <button data-action="passage" class="primary">항해 개시</button>
            <button data-action="day">하루만</button>
          </div>
          <p class="controls__note" id="orders"></p>
          <section id="record" class="record" hidden></section>
        </div>
      </aside>
    </main>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("#chart-canvas");
  const hudRoot = root.querySelector<HTMLElement>("#hud");
  const sailsRoot = root.querySelector<HTMLElement>("#sails");
  const steeringRoot = root.querySelector<HTMLElement>("#steering");
  const hintRoot = root.querySelector<HTMLElement>("#chart-hint");
  const ordersRoot = root.querySelector<HTMLElement>("#orders");
  const recordRoot = root.querySelector<HTMLElement>("#record");
  if (
    canvas === null ||
    hudRoot === null ||
    sailsRoot === null ||
    steeringRoot === null ||
    hintRoot === null ||
    ordersRoot === null ||
    recordRoot === null
  ) {
    throw new Error("app scaffolding missing");
  }

  const hud = createHud({ root: hudRoot, game });
  const mapView = createMapView({
    canvas,
    game,
    onChartPick: (target: LatLon) => {
      // 조타 모드가 클릭의 의미를 정한다. 수동이면 그 방향으로 침로, 자동이면 목적지.
      dispatch(
        game.voyage.steering === "manual"
          ? { type: "set-heading", headingDeg: bearingDeg(game.voyage.position, target) }
          : { type: "set-destination", target },
      );
    },
  });

  const sailsPanel = sailsRoot;
  const hintPanel = hintRoot;
  const ordersPanel = ordersRoot;
  const steeringPanel = steeringRoot;
  const recordPanel = recordRoot;

  function renderSails(): void {
    sailsPanel.innerHTML = game.voyage.rig
      .map(
        (mast, index) =>
          `<button data-action="sail" data-mast="${index}" class="${game.voyage.sailsSet[index] === true ? "on" : ""}">
             ${index + 1}번 ${mast.sail === "square" ? "가로돛" : "라틴돛"}
           </button>`,
      )
      .join("");
  }

  function renderSteering(): void {
    const manual = game.voyage.steering === "manual";
    steeringPanel.innerHTML = `
      <button data-action="steer" data-mode="manual" class="${manual ? "on" : ""}">수동 조타</button>
      <button data-action="steer" data-mode="auto" class="${manual ? "" : "on"}">자동 항해</button>
    `;
  }

  /** 지금 무엇을 지시해 둔 상태인지, 왜 멈췄는지를 명령 버튼 아래에 붙여 둔다. */
  function renderOrders(): void {
    const stop = lastStop === null ? "" : ` · ${lastStop}`;
    if (game.voyage.steering === "manual") {
      ordersPanel.textContent = `침로 ${Math.round(game.voyage.headingDeg)}° 유지. 해도를 클릭하면 그 방향으로 침로를 잡는다.${stop}`;
      return;
    }
    const destination = game.voyage.destination;
    if (destination === null) {
      ordersPanel.textContent =
        "해도를 클릭해 목적지를 지정한다. 항해사가 태킹과 해안 우회를 맡는다.";
      return;
    }
    const rangeNm = haversineNm(game.voyage.position, destination);
    const bearing = Math.round(bearingDeg(game.voyage.position, destination));
    ordersPanel.textContent = `목적지까지 ${Math.round(rangeNm)}해리, 방위 ${bearing}°${stop}`;
  }

  /**
   * 재현 항해가 끝나면 기록을 사료와 나란히 놓는다 (SPEC 2, 3).
   * 기준선이 없으면 없는 대로 내놓는다 — 확인되지 않은 숫자로 대조하느니 그게 낫다.
   */
  function renderRecord(): void {
    if (game.voyage.atPortId !== VOYAGE.endPortId) {
      recordPanel.hidden = true;
      return;
    }
    const record = compareToRecord(VOYAGE, game.logbook, game.voyage.atPortId);
    const reference =
      record.reference.days === null
        ? `<p class="record__note">사료 기준선 미확인 — ${record.reference.source}</p>`
        : `<p class="record__note">실제 기록 ${record.reference.days}일 · 당신 ${record.days}일</p>`;

    recordPanel.hidden = false;
    recordPanel.innerHTML = `
      <h2>${VOYAGE.name} — 항해 기록</h2>
      <dl class="record__rows">
        <div><dt>소요</dt><dd>${record.days}일</dd></div>
        <div><dt>항정</dt><dd>${Math.round(record.distanceNm)}해리</dd></div>
        <div><dt>직선거리</dt><dd>${Math.round(record.directNm)}해리</dd></div>
        <div><dt>우회율</dt><dd>${record.detourRatio.toFixed(2)}배</dd></div>
        <div><dt>최남단</dt><dd>${record.southmostLat.toFixed(1)}°N</dd></div>
        <div><dt>돛이 죽은 날</dt><dd>${record.stalledDays}일</dd></div>
      </dl>
      ${reference}
      <p class="record__lesson">${VOYAGE.lesson}</p>
    `;
  }

  function renderContextButtons(): void {
    const anchorButton = root.querySelector<HTMLButtonElement>('[data-action="anchor"]');
    const portButton = root.querySelector<HTMLButtonElement>('[data-action="port"]');
    const resupplyButton = root.querySelector<HTMLButtonElement>('[data-action="resupply"]');
    const passageButton = root.querySelector<HTMLButtonElement>('[data-action="passage"]');
    const inPort = game.voyage.atPortId !== null;

    if (passageButton !== null) {
      const needsDestination = game.voyage.steering === "auto" && game.voyage.destination === null;
      passageButton.disabled = needsDestination || inPort || game.ended !== null;
    }

    if (anchorButton !== null) {
      anchorButton.textContent = game.voyage.anchored ? "닻 올리기" : "닻 내리기";
      anchorButton.disabled = inPort;
    }
    if (portButton !== null) {
      portButton.textContent = inPort ? "출항" : "항해 중";
      portButton.disabled = !inPort;
    }
    if (resupplyButton !== null) {
      resupplyButton.disabled = !inPort;
    }
  }

  function renderHint(): void {
    const pick = game.voyage.steering === "manual" ? "침로" : "목적지";
    hintPanel.textContent = `지구본을 끌어 돌리고 휠로 확대한다. 클릭하면 ${pick}를 지정한다. ← → 침로 조정, Enter 항해 개시, Space 하루만, C 배로 이동.`;
  }

  function render(): void {
    hud.render();
    renderSails();
    renderSteering();
    renderContextButtons();
    renderOrders();
    renderRecord();
    renderHint();
    mapView.render(track);
  }

  function recordTrack(point: LatLon): void {
    track.push({ ...point });
    if (track.length > TRACK_LIMIT) {
      track.shift();
    }
  }

  function dispatch(action: GameAction): void {
    const result = applyAction(game, action);
    if (action.type === "advance-day") {
      recordTrack(game.voyage.position);
    }
    if (result.passage !== null) {
      result.passage.reports.forEach((report) => recordTrack(report.position));
      lastStop = result.passage.summary;
    }
    // 새 지시를 내리면 지난 정지 사유는 낡은 정보다.
    if (["set-heading", "set-destination", "set-steering"].includes(action.type)) {
      lastStop = null;
    }
    render();
  }

  root.addEventListener("click", (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest<HTMLElement>("[data-action]");
    if (button === null) {
      return;
    }

    switch (button.dataset.action) {
      case "turn-left":
        dispatch({ type: "set-heading", headingDeg: game.voyage.headingDeg - 15 });
        break;
      case "turn-right":
        dispatch({ type: "set-heading", headingDeg: game.voyage.headingDeg + 15 });
        break;
      case "anchor":
        dispatch({ type: "set-anchor", anchored: !game.voyage.anchored });
        break;
      case "sail": {
        const mast = Number(button.dataset.mast);
        dispatch({ type: "set-sail", mast, set: game.voyage.sailsSet[mast] !== true });
        break;
      }
      case "port":
        dispatch({ type: "depart" });
        break;
      case "resupply":
        dispatch({ type: "resupply" });
        break;
      case "day":
        dispatch({ type: "advance-day" });
        break;
      case "passage":
        dispatch({ type: "sail" });
        break;
      case "steer":
        dispatch({
          type: "set-steering",
          mode: button.dataset.mode === "auto" ? "auto" : "manual",
        });
        break;
    }
  });

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      dispatch({ type: "set-heading", headingDeg: normalizeHeading(game.voyage.headingDeg - 5) });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      dispatch({ type: "set-heading", headingDeg: normalizeHeading(game.voyage.headingDeg + 5) });
    } else if (event.key === " ") {
      event.preventDefault();
      dispatch({ type: "advance-day" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      dispatch({ type: "sail" });
    } else if (event.key === "c" || event.key === "C") {
      event.preventDefault();
      mapView.lookAt(game.voyage.position);
    }
  });

  render();
}
