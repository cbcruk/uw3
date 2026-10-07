import type { GameDate } from "../../sim/calendar/calendar.types";
import type { ShipClass } from "../../sim/ship/ship.types";
import type { ExploredMap } from "../fog/fog.types";
import type { Direction } from "../grid/direction.types";
import type { Cell, WorldGrid } from "../grid/world-grid.types";
import type { RegionId } from "../region/region.types";
import type { Conveyance, Mount } from "../travel/travel.types";

export interface RunConfig {
  seed: number;
  startDate: GameDate;
  startPortId: string;
  shipClassId: string;
}

/** 격자 위를 움직이는 것. 원본의 `Actor`에서 전투 상태를 뺀 것이다 (전투는 P3). */
export interface Traveler {
  id: string;
  cell: Cell;
  conveyance: Conveyance;
}

/**
 * 명령 하나 = 한 칸 (R5). 방향키 한 번이 한 칸이다.
 *
 * 시간은 명령마다 고정으로 흐르지 않는다. 그 칸을 지나는 데 걸린 만큼 흐른다 —
 * 순풍의 배는 한 칸에 두 시간, 초지의 말은 반나절이다.
 */
export type Command =
  | { type: "move"; dir: Direction }
  | { type: "wait" }
  | { type: "disembark"; mount: Mount }
  | { type: "embark" };

/** 막힌 이유. 막힌 걸음은 시간을 쓰지 않는다 — 원본에서 벽에 부딪힌 것과 같다. */
export type BlockReason = "terrain" | "edge" | "wind";

/** 코어가 내는 렌더·로그용 이벤트. 렌더러는 이 배열만 소비한다 (원본 `GridEvent`). */
export type RunEvent =
  | { type: "move"; actorId: string; from: Cell; to: Cell; hours: number }
  | { type: "blocked"; actorId: string; at: Cell; reason: BlockReason }
  | { type: "region"; region: RegionId }
  | { type: "dock"; portId: string }
  | { type: "disembark"; mount: Mount; portId: string }
  | { type: "embark"; portId: string }
  | { type: "rejected"; command: Command["type"]; reason: string }
  | { type: "day-start"; day: number };

/** 하선 중 항구에 남겨 둔 배. */
export interface Berth {
  portId: string;
  cell: Cell;
}

export interface RunState {
  config: RunConfig;
  grid: WorldGrid;
  shipClass: ShipClass;
  /** 출발 후 흐른 시간. 날짜는 여기서 파생한다 — 바람은 날마다 바뀐다. */
  elapsedHours: number;
  player: Traveler;
  berth: Berth | null;
  region: RegionId;
  /** 한 번이라도 본 칸. 명령 로그에서 파생되므로 재현하면 같아진다 (R8). */
  explored: ExploredMap;
  /** 들어가 본 영역. 던전에서 내려가 본 층에 해당한다. */
  visitedRegions: Set<string>;
  /** `seed + 명령 로그 = 완전 재현` (R8). */
  commands: Command[];
}
