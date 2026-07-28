import type { LatLon } from "../sim/geo/geo.types";
import { normalizeHeading } from "../sim/geo/geo.utils";
import { createGame } from "../sim/world/world";
import { applyAction } from "../sim/world/world";
import type { GameAction } from "../sim/world/world.types";
import { readDebugOptions } from "./debug/debug-options";
import { createHud } from "./hud/hud";
import { createMapView } from "./map-view/map-view";

const TRACK_LIMIT = 400;

export function mountApp(root: HTMLElement): void {
  const game = createGame();
  const track: LatLon[] = [{ ...game.voyage.position }];
  let fog = readDebugOptions(window.location.search).fog;

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
          <div class="controls__row">
            <button data-action="day" class="primary">하루 진행</button>
            <button data-action="week">7일 진행</button>
          </div>
        </div>
      </aside>
    </main>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("#chart-canvas");
  const hudRoot = root.querySelector<HTMLElement>("#hud");
  const sailsRoot = root.querySelector<HTMLElement>("#sails");
  const hintRoot = root.querySelector<HTMLElement>("#chart-hint");
  if (canvas === null || hudRoot === null || sailsRoot === null || hintRoot === null) {
    throw new Error("app scaffolding missing");
  }

  const hud = createHud({ root: hudRoot, game });
  const mapView = createMapView({
    canvas,
    game,
    fog,
    onCourseSet: (headingDeg: number) => {
      dispatch({ type: "set-heading", headingDeg });
    },
  });

  const sailsPanel = sailsRoot;
  const hintPanel = hintRoot;

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

  function renderContextButtons(): void {
    const anchorButton = root.querySelector<HTMLButtonElement>('[data-action="anchor"]');
    const portButton = root.querySelector<HTMLButtonElement>('[data-action="port"]');
    const resupplyButton = root.querySelector<HTMLButtonElement>('[data-action="resupply"]');
    const inPort = game.voyage.atPortId !== null;

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
    const fogState = fog ? "안개 켬" : "안개 끔 — 해도 전체 표시";
    hintPanel.textContent = `해도를 클릭하면 그 방향으로 침로를 잡는다. ← → 침로 조정, Space 하루 진행, F ${fogState}.`;
  }

  function render(): void {
    hud.render();
    renderSails();
    renderContextButtons();
    renderHint();
    mapView.render(track);
  }

  function dispatch(action: GameAction): void {
    applyAction(game, action);
    if (action.type === "advance-day") {
      track.push({ ...game.voyage.position });
      if (track.length > TRACK_LIMIT) {
        track.shift();
      }
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
      case "week":
        for (let i = 0; i < 7; i += 1) {
          dispatch({ type: "advance-day" });
        }
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
    } else if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      fog = !fog;
      mapView.setFog(fog);
      render();
    }
  });

  render();
}
