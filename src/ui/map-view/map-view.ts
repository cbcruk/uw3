import type { LatLon, MapBounds } from "../../sim/geo/geo.types";
import type { TileMap } from "../../sim/map/tile-map.types";
import { windAt } from "../../sim/wind/wind";
import type { Game } from "../../sim/world/world.types";
import type { MapView, MapViewOptions } from "./map-view.types";
import { MAP_PALETTE, type Projection, createProjection, drawArrow } from "./map-view.utils";

const PIXELS_PER_TILE = 5;
const COURSE_LINE_PX = 90;

interface Surface {
  ctx: CanvasRenderingContext2D;
  projection: Projection;
  widthPx: number;
  heightPx: number;
  tilePx: number;
}

function drawTerrain(surface: Surface, game: Game, fog: boolean): void {
  const { ctx, tilePx } = surface;
  const { size } = game.tileMap;

  ctx.fillStyle = MAP_PALETTE.fog;
  ctx.fillRect(0, 0, surface.widthPx, surface.heightPx);

  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      if (fog && !game.exploration.isRevealed({ x, y })) {
        continue;
      }
      const isLand = game.tileMap.isLandTile({ x, y });
      ctx.fillStyle = isLand ? MAP_PALETTE.land : MAP_PALETTE.sea;
      ctx.fillRect(x * tilePx, y * tilePx, tilePx + 0.5, tilePx + 0.5);
    }
  }

  drawCoastline(surface, game.tileMap, game, fog);
}

function drawCoastline(surface: Surface, tileMap: TileMap, game: Game, fog: boolean): void {
  const { ctx, tilePx } = surface;
  const { size } = tileMap;
  ctx.fillStyle = MAP_PALETTE.coast;

  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      if (fog && !game.exploration.isRevealed({ x, y })) {
        continue;
      }
      if (!tileMap.isLandTile({ x, y })) {
        continue;
      }
      const exposed =
        !tileMap.isLandTile({ x, y: y + 1 }) ||
        !tileMap.isLandTile({ x: x + 1, y }) ||
        !tileMap.isLandTile({ x, y: y - 1 }) ||
        !tileMap.isLandTile({ x: x - 1, y });
      if (exposed) {
        ctx.fillRect(x * tilePx, y * tilePx, tilePx + 0.5, tilePx + 0.5);
      }
    }
  }
}

function drawGraticule(surface: Surface, bounds: MapBounds): void {
  const { ctx, projection, widthPx, heightPx } = surface;
  ctx.strokeStyle = MAP_PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let lon = Math.ceil(bounds.minLon / 5) * 5; lon <= bounds.maxLon; lon += 5) {
    const { x } = projection.toCanvas({ lat: bounds.maxLat, lon });
    ctx.moveTo(x, 0);
    ctx.lineTo(x, heightPx);
  }
  for (let lat = Math.ceil(bounds.minLat / 5) * 5; lat <= bounds.maxLat; lat += 5) {
    const { y } = projection.toCanvas({ lat, lon: bounds.minLon });
    ctx.moveTo(0, y);
    ctx.lineTo(widthPx, y);
  }
  ctx.stroke();
}

function drawTrack(surface: Surface, track: readonly LatLon[]): void {
  if (track.length < 2) {
    return;
  }
  const { ctx, projection } = surface;
  ctx.strokeStyle = MAP_PALETTE.track;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  track.forEach((point, index) => {
    const { x, y } = projection.toCanvas(point);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function drawPorts(surface: Surface, game: Game): void {
  const { ctx, projection } = surface;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textBaseline = "middle";

  for (const port of game.ports) {
    const { x, y } = projection.toCanvas({ lat: port.lat, lon: port.lon });
    ctx.fillStyle = MAP_PALETTE.port;
    ctx.beginPath();
    ctx.arc(x, y, port.isCapital ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(port.name, x + 8, y);
  }
}

/** 항해사에게 맡긴 목적지. 배에서 이어지는 실선과 표적으로 표시한다. */
function drawDestination(surface: Surface, game: Game): void {
  const destination = game.voyage.destination;
  if (destination === null) {
    return;
  }
  const { ctx, projection } = surface;
  const ship = projection.toCanvas(game.voyage.position);
  const mark = projection.toCanvas(destination);

  ctx.strokeStyle = MAP_PALETTE.destination;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(mark.x, mark.y);
  ctx.stroke();
  ctx.setLineDash([]);

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
  const { ctx, projection } = surface;
  const { x, y } = projection.toCanvas(game.voyage.position);
  const wind = windAt(game.voyage.position, game.voyage.day);
  const courseRad = ((game.voyage.headingDeg - 90) * Math.PI) / 180;

  ctx.strokeStyle = "#f5e6c855";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(courseRad) * COURSE_LINE_PX, y + Math.sin(courseRad) * COURSE_LINE_PX);
  ctx.stroke();
  ctx.setLineDash([]);

  drawArrow(ctx, x, y, game.voyage.headingDeg, 7, MAP_PALETTE.ship);
  drawArrow(ctx, x, y - 26, wind.fromDeg + 180, 8, MAP_PALETTE.wind);
}

export function createMapView(options: MapViewOptions): MapView {
  const { canvas, game, onChartPick, fog = true } = options;
  let fogEnabled = fog;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("2d context unavailable");
  }

  const { bounds, size } = game.tileMap;
  const widthPx = size.width * PIXELS_PER_TILE;
  const heightPx = size.height * PIXELS_PER_TILE;
  const projection = createProjection(bounds, widthPx);

  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(widthPx * ratio);
  canvas.height = Math.round(heightPx * ratio);
  canvas.style.aspectRatio = `${widthPx} / ${heightPx}`;

  const surface: Surface = { ctx, projection, widthPx, heightPx, tilePx: PIXELS_PER_TILE };

  canvas.addEventListener("click", (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    onChartPick(
      projection.toLatLon(
        ((event.clientX - rect.left) / rect.width) * widthPx,
        ((event.clientY - rect.top) / rect.height) * heightPx,
      ),
    );
  });

  return {
    render(track: readonly LatLon[]): void {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawTerrain(surface, game, fogEnabled);
      drawGraticule(surface, bounds);
      drawTrack(surface, track);
      drawDestination(surface, game);
      drawPorts(surface, game);
      drawShip(surface, game);
    },
    setFog(enabled: boolean): void {
      fogEnabled = enabled;
    },
  };
}
