import type { Port } from "../../content/content.types";
import type { ExplorationState } from "../fog/fog-of-war.types";
import type { LatLon } from "../geo/geo.types";
import type { TileMap } from "../map/tile-map.types";
import type { PassageResult } from "../voyage/passage.types";
import type { RngSet } from "../rng/rng.types";
import type { ShipClass } from "../ship/ship.types";
import type { DayReport, SteeringMode, VoyageEnd, VoyageState } from "../voyage/voyage.types";

export interface GameConfig {
  seed: number;
  startDate: { year: number; month: number; day: number };
  startPortId: string;
  shipClassId: string;
}

export type JournalKind = "log" | "warning" | "hazard" | "port" | "system";

export interface JournalEntry {
  day: number;
  kind: JournalKind;
  text: string;
}

export interface Game {
  config: GameConfig;
  rng: RngSet;
  tileMap: TileMap;
  /** 항로 탐색용 성긴 격자. */
  routeMap: TileMap;
  exploration: ExplorationState;
  shipClass: ShipClass;
  voyage: VoyageState;
  ports: readonly Port[];
  gold: number;
  journal: JournalEntry[];
  actions: GameAction[];
  ended: VoyageEnd | null;
}

export type GameAction =
  | { type: "set-heading"; headingDeg: number }
  | { type: "set-steering"; mode: SteeringMode }
  | { type: "set-destination"; target: LatLon | null }
  | { type: "set-sail"; mast: number; set: boolean }
  | { type: "set-anchor"; anchored: boolean }
  | { type: "depart" }
  | { type: "resupply" }
  | { type: "advance-day" }
  | { type: "sail" };

export interface ActionResult {
  /** 여러 날을 진행한 경우 마지막 날의 보고. */
  report: DayReport | null;
  entries: readonly JournalEntry[];
  passage: PassageResult | null;
}
