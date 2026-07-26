import type { Port } from "../../content/content.types";
import type { ExplorationState } from "../fog/fog-of-war.types";
import type { TileMap } from "../map/tile-map.types";
import type { RngSet } from "../rng/rng.types";
import type { ShipClass } from "../ship/ship.types";
import type { DayReport, VoyageEnd, VoyageState } from "../voyage/voyage.types";

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
  | { type: "set-sail"; mast: number; set: boolean }
  | { type: "set-anchor"; anchored: boolean }
  | { type: "depart" }
  | { type: "resupply" }
  | { type: "advance-day" };

export interface ActionResult {
  report: DayReport | null;
  entries: readonly JournalEntry[];
}
