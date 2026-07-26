import { WORLD_BOUNDS, LANDMASSES } from "../../content/coastline";
import { PORTS, PORT_ANCHORAGES, findPort } from "../../content/ports";
import { findShipClass } from "../../content/ships";
import { formatGameDate, toDayNumber } from "../calendar/calendar";
import { createExplorationState } from "../fog/fog-of-war";
import { haversineNm, normalizeHeading } from "../geo/geo.utils";
import { createTileMap } from "../map/tile-map";
import { createRngSet } from "../rng/rng";
import { stepDay } from "../voyage/voyage";
import type { VoyageState } from "../voyage/voyage.types";
import type { ActionResult, Game, GameAction, GameConfig, JournalEntry } from "./world.types";

const DOCKING_RANGE_NM = 12;
const SUPPLY_PER_TON = 18;
const RESUPPLY_COST_PER_UNIT = 0.4;

export const DEFAULT_CONFIG: GameConfig = {
  seed: 0x5ea1e55,
  startDate: { year: 1502, month: 3, day: 14 },
  startPortId: "lisboa",
  shipClassId: "caravela-redonda",
};

export function supplyCapacity(capacityTons: number): number {
  return Math.round(capacityTons * SUPPLY_PER_TON);
}

export function createGame(config: GameConfig = DEFAULT_CONFIG): Game {
  const shipClass = findShipClass(config.shipClassId);
  if (shipClass === undefined) {
    throw new Error(`unknown ship class: ${config.shipClassId}`);
  }
  const startPort = findPort(config.startPortId);
  if (startPort === undefined) {
    throw new Error(`unknown port: ${config.startPortId}`);
  }

  const tileMap = createTileMap({
    bounds: WORLD_BOUNDS,
    landmasses: LANDMASSES,
    navigableAnchorages: PORT_ANCHORAGES,
  });
  const exploration = createExplorationState(tileMap.size);
  const capacity = supplyCapacity(shipClass.capacityTons);
  const crew = Math.round((shipClass.crewMin + shipClass.crewMax) / 2);

  const voyage: VoyageState = {
    position: { lat: startPort.lat, lon: startPort.lon },
    day: toDayNumber(config.startDate),
    headingDeg: 270,
    sailsSet: shipClass.defaultRig.map(() => true),
    rig: shipClass.defaultRig.map((mast) => ({ ...mast })),
    food: capacity,
    water: capacity,
    timber: 120,
    ammo: 60,
    crew,
    sick: 0,
    fatigue: 0,
    discipline: 0.85,
    hull: shipClass.hullPoints,
    hullMax: shipClass.hullPoints,
    anchored: true,
    atPortId: startPort.id,
    departedPortId: null,
    daysAtSea: 0,
  };

  exploration.revealAround(tileMap.bounds, voyage.position, 40);

  return {
    config,
    rng: createRngSet(config.seed),
    tileMap,
    exploration,
    shipClass,
    voyage,
    ports: PORTS,
    gold: 5000,
    journal: [
      {
        day: voyage.day,
        kind: "system",
        text: `${formatGameDate(voyage.day)} — ${startPort.name}에서 항해를 시작한다.`,
      },
    ],
    actions: [],
    ended: null,
  };
}

export function nearestPort(game: Game): { portId: string; distanceNm: number } | null {
  let best: { portId: string; distanceNm: number } | null = null;
  for (const port of game.ports) {
    const distanceNm = haversineNm(game.voyage.position, { lat: port.lat, lon: port.lon });
    if (best === null || distanceNm < best.distanceNm) {
      best = { portId: port.id, distanceNm };
    }
  }
  return best;
}

function resupply(game: Game): JournalEntry[] {
  const port = game.voyage.atPortId === null ? undefined : findPort(game.voyage.atPortId);
  if (port === undefined) {
    return [{ day: game.voyage.day, kind: "system", text: "입항 중에만 보급할 수 있다." }];
  }

  const capacity = supplyCapacity(game.shipClass.capacityTons);
  const needed =
    capacity - game.voyage.food + (capacity - game.voyage.water) + (120 - game.voyage.timber);
  const cost = Math.ceil(Math.max(0, needed) * RESUPPLY_COST_PER_UNIT);

  if (cost > game.gold) {
    return [{ day: game.voyage.day, kind: "system", text: "자금이 부족해 보급하지 못했다." }];
  }

  game.gold -= cost;
  game.voyage.food = capacity;
  game.voyage.water = capacity;
  game.voyage.timber = 120;
  game.voyage.hull = game.voyage.hullMax;

  return [
    {
      day: game.voyage.day,
      kind: "port",
      text: `${port.name}에서 보급과 수리를 마쳤다. (${cost} 두카트)`,
    },
  ];
}

function dockAt(game: Game, portId: string | null): JournalEntry[] {
  if (portId === null || game.voyage.atPortId !== null) {
    return [];
  }
  const port = findPort(portId);
  if (port === undefined) {
    return [];
  }

  game.voyage.atPortId = port.id;
  game.voyage.anchored = true;
  game.voyage.departedPortId = null;
  game.voyage.daysAtSea = 0;
  game.exploration.revealAround(game.tileMap.bounds, game.voyage.position, 40);

  return [{ day: game.voyage.day, kind: "port", text: `${port.name}에 입항했다.` }];
}

export function applyAction(game: Game, action: GameAction): ActionResult {
  game.actions.push(action);

  switch (action.type) {
    case "set-heading": {
      game.voyage.headingDeg = normalizeHeading(action.headingDeg);
      return { report: null, entries: [] };
    }
    case "set-sail": {
      if (action.mast >= 0 && action.mast < game.voyage.sailsSet.length) {
        game.voyage.sailsSet[action.mast] = action.set;
      }
      return { report: null, entries: [] };
    }
    case "set-anchor": {
      game.voyage.anchored = action.anchored;
      return { report: null, entries: [] };
    }
    case "depart": {
      const port = game.voyage.atPortId === null ? undefined : findPort(game.voyage.atPortId);
      game.voyage.departedPortId = game.voyage.atPortId;
      game.voyage.atPortId = null;
      game.voyage.anchored = false;
      const entries: JournalEntry[] =
        port === undefined
          ? []
          : [{ day: game.voyage.day, kind: "port", text: `${port.name}을 떠났다.` }];
      game.journal.push(...entries);
      return { report: null, entries };
    }
    case "resupply": {
      const entries = resupply(game);
      game.journal.push(...entries);
      return { report: null, entries };
    }
    case "advance-day": {
      if (game.ended !== null) {
        return { report: null, entries: [] };
      }

      const report = stepDay(game.voyage, {
        tileMap: game.tileMap,
        exploration: game.exploration,
        shipClass: game.shipClass,
        rng: game.rng.voyage,
        ports: game.ports,
        dockingRangeNm: DOCKING_RANGE_NM,
      });

      const entries: JournalEntry[] = [
        ...report.logs.map(
          (text): JournalEntry => ({
            day: report.day,
            kind: report.hazardId !== null ? "hazard" : "log",
            text,
          }),
        ),
        ...dockAt(game, report.dockedPortId),
        ...report.warnings.map(
          (text): JournalEntry => ({
            day: report.day,
            kind: "warning",
            text,
          }),
        ),
      ];

      if (report.ended !== null && game.ended === null) {
        game.ended = report.ended;
        entries.push({
          day: report.day,
          kind: "system",
          text:
            report.ended === "crew-lost"
              ? "선원이 모두 스러졌다. 항해는 여기서 끝났다."
              : "선체가 버티지 못했다. 배를 잃었다.",
        });
      }

      game.journal.push(...entries);
      return { report, entries };
    }
  }
}

/** SPEC 8.1: 같은 시드 + 같은 액션 로그는 항상 같은 상태로 재현된다. */
export function replay(config: GameConfig, actions: readonly GameAction[]): Game {
  const game = createGame(config);
  for (const action of actions) {
    applyAction(game, action);
  }
  return game;
}
