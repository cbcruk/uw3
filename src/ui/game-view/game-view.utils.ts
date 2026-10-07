import { findPort } from "../../content/ports";
import { HOURS_PER_DAY } from "../../sim/calendar/calendar";
import type { Direction } from "../../game/grid/direction.types";
import type { Terrain } from "../../game/grid/world-grid.types";
import type { Command, RunEvent } from "../../game/run/run.types";
import type { Conveyance } from "../../game/travel/travel.types";
import type { LogLine, TileStyle } from "./game-view.types";

const ARROW_KEYS: Readonly<Record<string, Direction>> = {
  ArrowUp: "n",
  ArrowDown: "s",
  ArrowLeft: "w",
  ArrowRight: "e",
};

/** 대각선은 방향키로 못 낸다. 로그라이크 관례대로 vi 키(y u b n)와 숫자패드를 받는다. */
const DIAGONAL_KEYS: Readonly<Record<string, Direction>> = {
  y: "nw",
  u: "ne",
  b: "sw",
  n: "se",
};

const NUMPAD_CODES: Readonly<Record<string, Direction>> = {
  Numpad8: "n",
  Numpad9: "ne",
  Numpad6: "e",
  Numpad3: "se",
  Numpad2: "s",
  Numpad1: "sw",
  Numpad4: "w",
  Numpad7: "nw",
};

export function commandForKey(key: string, code: string): Command | null {
  const dir = ARROW_KEYS[key] ?? NUMPAD_CODES[code] ?? DIAGONAL_KEYS[key.toLowerCase()];
  if (dir !== undefined) {
    return { type: "move", dir };
  }
  switch (key.toLowerCase()) {
    case ".":
    case "z":
      return { type: "wait" };
    case "h":
      return { type: "disembark", mount: "horse" };
    case "c":
      return { type: "disembark", mount: "camel" };
    case "e":
      return { type: "embark" };
    default:
      return code === "Numpad5" ? { type: "wait" } : null;
  }
}

export const TERRAIN_STYLE: Readonly<Record<Terrain, TileStyle>> = {
  sea: { fill: "#0c1d2e", glyph: "~", glyphColor: "#1c3a56" },
  grassland: { fill: "#1f2e1c", glyph: '"', glyphColor: "#46663a" },
  desert: { fill: "#3d3120", glyph: ":", glyphColor: "#8a7448" },
};

export const CONVEYANCE_LABEL: Readonly<Record<Conveyance, string>> = {
  ship: "배",
  horse: "말",
  camel: "낙타",
};

export const CONVEYANCE_COLOR: Readonly<Record<Conveyance, string>> = {
  ship: "#f2c45a",
  horse: "#f5ead2",
  camel: "#e89b4c",
};

export const DIRECTION_LABEL: Readonly<Record<Direction, string>> = {
  n: "북",
  ne: "북동",
  e: "동",
  se: "남동",
  s: "남",
  sw: "남서",
  w: "서",
  nw: "북서",
};

function portName(portId: string): string {
  return findPort(portId)?.name ?? portId;
}

/** 로그에 남길 사건만 글로 바꾼다. 한 칸 이동은 너무 잦아서 남기지 않는다. */
export function describeEvent(event: RunEvent): LogLine | null {
  switch (event.type) {
    case "blocked":
      if (event.reason === "wind") {
        return { text: "바람을 거슬러 그쪽으로는 나아갈 수 없다", tone: "warn" };
      }
      return {
        text: event.reason === "edge" ? "지도의 끝이다" : "그쪽으로는 갈 수 없다",
        tone: "warn",
      };
    case "region":
      return { text: `새 해역에 들어섰다 (${event.region.rx}, ${event.region.ry})`, tone: "good" };
    case "dock":
      return { text: `${portName(event.portId)}에 입항했다`, tone: "good" };
    case "disembark":
      return {
        text: `${portName(event.portId)}에 배를 두고 ${CONVEYANCE_LABEL[event.mount]}을 탔다`,
        tone: "info",
      };
    case "embark":
      return { text: `${portName(event.portId)}에서 배에 올랐다`, tone: "info" };
    case "rejected":
      return { text: event.reason, tone: "warn" };
    case "day-start":
      return { text: `${event.day + 1}일째`, tone: "info" };
    case "move":
      return null;
  }
}

/** 한 칸에 걸리는 시간. 갈 수 없으면 `null`. */
export function hoursPerCell(stepNm: number, rangeNm: number): number | null {
  return rangeNm > 0 ? (stepNm / rangeNm) * HOURS_PER_DAY : null;
}
