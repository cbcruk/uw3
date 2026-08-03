import { LAND_POLYGONS } from "../../content/world-land";
import type { LatLon } from "../../sim/geo/geo.types";
import type { LandPolygon } from "../../sim/map/land-mask.types";
import { windAt } from "../../sim/wind/wind";
import type { Game } from "../../sim/world/world.types";
import type { MapView, MapViewOptions } from "./map-view.types";
import { createOrthographic } from "./orthographic";
import type { Orthographic } from "./orthographic.types";
import { MAP_PALETTE, drawArrow } from "./map-view.utils";

const MIN_RADIUS_PX = 160;
const MAX_RADIUS_PX = 6000;
const COURSE_LINE_PX = 90;
/** 이 픽셀 이상 끌면 클릭이 아니라 회전으로 본다. */
const DRAG_SLOP_PX = 4;
/** 화면 반지름당 회전 각도. 지구를 손으로 굴리는 감각에 맞춘 값. */
const ROTATE_DEG_PER_RADIUS = 90;

interface Surface {
  ctx: CanvasRenderingContext2D;
  view: Orthographic;
  centerX: number;
  centerY: number;
}

function toScreen(surface: Surface, position: LatLon): { x: number; y: number; visible: boolean } {
  const point = surface.view.project(position);
  return { x: surface.centerX + point.x, y: surface.centerY + point.y, visible: point.visible };
}

function drawOcean(surface: Surface): void {
  const { ctx, centerX, centerY, view } = surface;
  ctx.fillStyle = MAP_PALETTE.sea;
  ctx.beginPath();
  ctx.arc(centerX, centerY, view.radiusPx, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 육지는 마스크가 아니라 폴리곤으로 그린다. 마스크는 시뮬의 충돌 판정용이고,
 * 화면에서 계단이 보이면 지구본이 아니라 격자로 읽힌다.
 *
 * 지평선을 넘는 링에서 안 보이는 점을 그냥 건너뛰면 링이 끊기고, 끊긴 채로 채우면
 * 지구본을 가로지르는 가짜 띠가 생긴다. 안 보이는 점을 같은 방위의 가장자리로
 * 밀어내 링을 이어 둔다 — 대륙이 지평선을 따라 잘린 것처럼 보인다.
 */
function drawLand(surface: Surface, polygons: readonly LandPolygon[]): void {
  const { ctx, view, centerX, centerY } = surface;
  ctx.fillStyle = MAP_PALETTE.land;
  ctx.strokeStyle = MAP_PALETTE.coast;
  ctx.lineWidth = 0.6;

  for (const rings of polygons) {
    for (const ring of rings) {
      let anyVisible = false;
      ctx.beginPath();
      ring.forEach(([lon, lat], index) => {
        const raw = view.project({ lat, lon });
        let { x, y } = raw;
        if (raw.visible) {
          anyVisible = true;
        } else {
          const length = Math.hypot(x, y) || 1;
          x = (x / length) * view.radiusPx;
          y = (y / length) * view.radiusPx;
        }
        const screenX = centerX + x;
        const screenY = centerY + y;
        if (index === 0) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      });
      if (!anyVisible) {
        continue;
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawGraticule(surface: Surface): void {
  const { ctx } = surface;
  ctx.strokeStyle = MAP_PALETTE.grid;
  ctx.lineWidth = 1;

  const stroke = (points: LatLon[]): void => {
    ctx.beginPath();
    let drawing = false;
    for (const position of points) {
      const point = toScreen(surface, position);
      if (!point.visible) {
        drawing = false;
        continue;
      }
      if (drawing) {
        ctx.lineTo(point.x, point.y);
      } else {
        ctx.moveTo(point.x, point.y);
        drawing = true;
      }
    }
    ctx.stroke();
  };

  for (let lat = -60; lat <= 60; lat += 30) {
    stroke(Array.from({ length: 121 }, (_, i) => ({ lat, lon: -180 + i * 3 })));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    stroke(Array.from({ length: 61 }, (_, i) => ({ lat: -90 + i * 3, lon })));
  }
  // 적도는 한 단계 뚜렷하게 — 위도를 눈으로 잡는 기준선이다.
  ctx.strokeStyle = MAP_PALETTE.equator;
  stroke(Array.from({ length: 121 }, (_, i) => ({ lat: 0, lon: -180 + i * 3 })));
}

function drawTrack(surface: Surface, track: readonly LatLon[]): void {
  if (track.length < 2) {
    return;
  }
  const { ctx } = surface;
  ctx.strokeStyle = MAP_PALETTE.track;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let drawing = false;
  for (const position of track) {
    const point = toScreen(surface, position);
    if (!point.visible) {
      drawing = false;
      continue;
    }
    if (drawing) {
      ctx.lineTo(point.x, point.y);
    } else {
      ctx.moveTo(point.x, point.y);
      drawing = true;
    }
  }
  ctx.stroke();
}

function drawPorts(surface: Surface, game: Game): void {
  const { ctx } = surface;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textBaseline = "middle";

  for (const port of game.ports) {
    const point = toScreen(surface, { lat: port.lat, lon: port.lon });
    if (!point.visible) {
      continue;
    }
    ctx.fillStyle = MAP_PALETTE.port;
    ctx.beginPath();
    ctx.arc(point.x, point.y, port.isCapital ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(port.name, point.x + 8, point.y);
  }
}

function drawDestination(surface: Surface, game: Game): void {
  const destination = game.voyage.destination;
  if (destination === null) {
    return;
  }
  const { ctx } = surface;
  const ship = toScreen(surface, game.voyage.position);
  const mark = toScreen(surface, destination);
  if (!mark.visible) {
    return;
  }

  ctx.strokeStyle = MAP_PALETTE.destination;
  ctx.lineWidth = 1;
  if (ship.visible) {
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(mark.x, mark.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.arc(mark.x, mark.y, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mark.x - 9, mark.y);
  ctx.lineTo(mark.x + 9, mark.y);
  ctx.moveTo(mark.x, mark.y - 9);
  ctx.lineTo(mark.x, mark.y + 9);
  ctx.stroke();
}

function drawShip(surface: Surface, game: Game): void {
  const { ctx } = surface;
  const point = toScreen(surface, game.voyage.position);
  if (!point.visible) {
    return;
  }
  const wind = windAt(game.voyage.position, game.voyage.day);
  const courseRad = ((game.voyage.headingDeg - 90) * Math.PI) / 180;

  ctx.strokeStyle = "#f5e6c855";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(
    point.x + Math.cos(courseRad) * COURSE_LINE_PX,
    point.y + Math.sin(courseRad) * COURSE_LINE_PX,
  );
  ctx.stroke();
  ctx.setLineDash([]);

  drawArrow(ctx, point.x, point.y, game.voyage.headingDeg, 7, MAP_PALETTE.ship);
  drawArrow(ctx, point.x, point.y - 26, wind.fromDeg + 180, 8, MAP_PALETTE.wind);
}

export function createMapView(options: MapViewOptions): MapView {
  const { canvas, game, onChartPick } = options;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("2d context unavailable");
  }

  const view = createOrthographic({
    centerLat: game.voyage.position.lat,
    centerLon: game.voyage.position.lon,
    radiusPx: 320,
    minRadiusPx: MIN_RADIUS_PX,
    maxRadiusPx: MAX_RADIUS_PX,
  });

  let widthPx = 0;
  let heightPx = 0;
  let ratio = 1;
  let redraw: () => void = () => {};

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    ratio = window.devicePixelRatio || 1;
    widthPx = Math.max(1, Math.round(rect.width));
    heightPx = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(widthPx * ratio);
    canvas.height = Math.round(heightPx * ratio);
    redraw();
  };

  // 끌면 회전, 놓으면 클릭. 지구본은 돌려봐야 하고 침로도 찍어야 한다.
  let dragging = false;
  let dragged = 0;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (event: PointerEvent) => {
    dragging = true;
    dragged = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event: PointerEvent) => {
    if (!dragging) {
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    dragged += Math.abs(dx) + Math.abs(dy);

    const perPixel = ROTATE_DEG_PER_RADIUS / view.radiusPx;
    view.rotateTo(view.centerLat + dy * perPixel, view.centerLon - dx * perPixel);
    redraw();
  });

  const endDrag = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }
    dragging = false;
    canvas.releasePointerCapture(event.pointerId);
    if (dragged > DRAG_SLOP_PX) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const target = view.invert(
      event.clientX - rect.left - widthPx / 2,
      event.clientY - rect.top - heightPx / 2,
    );
    if (target !== null) {
      onChartPick(target);
    }
  };

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      event.preventDefault();
      view.zoomTo(view.radiusPx * (event.deltaY < 0 ? 1.15 : 1 / 1.15));
      redraw();
    },
    { passive: false },
  );

  window.addEventListener("resize", resize);

  return {
    render(track: readonly LatLon[]): void {
      redraw = (): void => {
        const surface: Surface = {
          ctx,
          view,
          centerX: widthPx / 2,
          centerY: heightPx / 2,
        };
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, widthPx, heightPx);
        drawOcean(surface);
        // 가장자리로 민 점들이 원 밖으로 삐져나오지 않도록 지구 원에 가둔다.
        ctx.save();
        ctx.beginPath();
        ctx.arc(surface.centerX, surface.centerY, view.radiusPx, 0, Math.PI * 2);
        ctx.clip();
        drawLand(surface, LAND_POLYGONS);
        ctx.restore();
        drawGraticule(surface);
        drawTrack(surface, track);
        drawDestination(surface, game);
        drawPorts(surface, game);
        drawShip(surface, game);
      };
      if (widthPx === 0) {
        resize();
        return;
      }
      redraw();
    },
    lookAt(position: LatLon): void {
      view.rotateTo(position.lat, position.lon);
      redraw();
    },
  };
}
