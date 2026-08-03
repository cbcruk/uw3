import { PORTS, PORT_ANCHORAGES, findPort } from "../../content/ports";
import { LAND_POLYGONS } from "../../content/world-land";
import { findShipClass } from "../../content/ships";
import { formatGameDate, toDayNumber } from "../calendar/calendar";
import { createExplorationState } from "../fog/fog-of-war";
import { haversineNm, normalizeHeading } from "../geo/geo.utils";
import { createTileMap } from "../map/tile-map";
import { ROUTE_CELLS_PER_DEGREE, WORLD_LAND_CELLS_PER_DEGREE } from "../map/land-mask.const";
import { findSeaRoute } from "../map/sea-route";
import { createRngSet } from "../rng/rng";
import { runPassage } from "../voyage/passage";
import { stepDay } from "../voyage/voyage";
import type { DayReport, VoyageContext, VoyageState } from "../voyage/voyage.types";
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
    polygons: LAND_POLYGONS,
    cellsPerDegree: WORLD_LAND_CELLS_PER_DEGREE,
    navigableAnchorages: PORT_ANCHORAGES,
  });
  // 항로 탐색은 성긴 격자로 한다. 충돌 해상도로 A*를 돌리면 배열만 수백 MB다.
  const routeMap = createTileMap({
    polygons: LAND_POLYGONS,
    cellsPerDegree: ROUTE_CELLS_PER_DEGREE,
    navigableAnchorages: PORT_ANCHORAGES,
  });
  const exploration = createExplorationState(tileMap.size);
  const capacity = supplyCapacity(shipClass.capacityTons);
  const crew = Math.round((shipClass.crewMin + shipClass.crewMax) / 2);

  const voyage: VoyageState = {
    position: { ...startPort.anchorage },
    day: toDayNumber(config.startDate),
    // 리스본은 편서풍을 정면으로 받는다. 270°로 시작하면 첫 출항이 영구 정지로 보인다.
    // 남서 침로는 실제 리스본 출항의 첫 다리이자, 라틴돛이 물 수 있는 각이다.
    headingDeg: 210,
    // 3편의 조작은 침로 지정이다. 자동 항해는 플레이어가 고를 때만 켠다.
    steering: "manual",
    destination: null,
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
    routeMap,
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
    const distanceNm = haversineNm(game.voyage.position, port.anchorage);
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

function voyageContext(game: Game): VoyageContext {
  return {
    tileMap: game.tileMap,
    routeMap: game.routeMap,
    exploration: game.exploration,
    shipClass: game.shipClass,
    rng: game.rng.voyage,
    ports: game.ports.map((port) => ({ id: port.id, ...port.anchorage })),
    dockingRangeNm: DOCKING_RANGE_NM,
  };
}

/**
 * 하루치 보고를 항해일지에 옮긴다. 구간 항해에서는 마지막 날에만 경고를 싣는다.
 * 같은 경고가 날마다 반복되면 진짜 새 소식이 묻힌다 (SPEC 4.2 텔레그래프).
 */
function recordDay(game: Game, report: DayReport, includeWarnings: boolean): JournalEntry[] {
  const entries: JournalEntry[] = [
    ...report.logs.map(
      (text): JournalEntry => ({
        day: report.day,
        kind: report.hazardId !== null ? "hazard" : "log",
        text,
      }),
    ),
    ...dockAt(game, report.dockedPortId),
    ...(includeWarnings
      ? report.warnings.map((text): JournalEntry => ({ day: report.day, kind: "warning", text }))
      : []),
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
  return entries;
}

export function applyAction(game: Game, action: GameAction): ActionResult {
  game.actions.push(action);

  switch (action.type) {
    case "set-heading": {
      // 키를 잡으면 수동이다. 항해사와 매일 침로를 다투게 두지 않는다.
      game.voyage.headingDeg = normalizeHeading(action.headingDeg);
      game.voyage.steering = "manual";
      game.voyage.destination = null;
      return { report: null, entries: [], passage: null };
    }
    case "set-steering": {
      game.voyage.steering = action.mode;
      if (action.mode === "manual") {
        game.voyage.destination = null;
      }
      return { report: null, entries: [], passage: null };
    }
    case "set-destination": {
      if (action.target === null) {
        game.voyage.destination = null;
        return { report: null, entries: [], passage: null };
      }
      // 목적지를 걸면 자동 조타다. 두 명령이 조타 방식을 그대로 드러낸다.
      game.voyage.steering = "auto";
      // 갈 수 없는 곳을 목적지로 걸어두면 항해 명령이 매번 헛돈다. 지금 거절한다.
      if (findSeaRoute(game.routeMap, game.voyage.position, action.target) === null) {
        const entries: JournalEntry[] = [
          { day: game.voyage.day, kind: "system", text: "그곳으로 이어지는 바닷길이 없다." },
        ];
        game.journal.push(...entries);
        return { report: null, entries, passage: null };
      }
      game.voyage.destination = { ...action.target };
      return { report: null, entries: [], passage: null };
    }
    case "set-sail": {
      if (action.mast >= 0 && action.mast < game.voyage.sailsSet.length) {
        game.voyage.sailsSet[action.mast] = action.set;
      }
      return { report: null, entries: [], passage: null };
    }
    case "set-anchor": {
      game.voyage.anchored = action.anchored;
      return { report: null, entries: [], passage: null };
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
      return { report: null, entries, passage: null };
    }
    case "resupply": {
      const entries = resupply(game);
      game.journal.push(...entries);
      return { report: null, entries, passage: null };
    }
    case "advance-day": {
      if (game.ended !== null) {
        return { report: null, entries: [], passage: null };
      }

      const report = stepDay(game.voyage, voyageContext(game));
      const entries = recordDay(game, report, true);
      return { report, entries, passage: null };
    }
    case "sail": {
      const needsDestination = game.voyage.steering === "auto" && game.voyage.destination === null;
      if (game.ended !== null || game.voyage.atPortId !== null || needsDestination) {
        return { report: null, entries: [], passage: null };
      }

      const passage = runPassage(game.voyage, voyageContext(game));
      const entries: JournalEntry[] = [];
      passage.reports.forEach((report, index) => {
        const isLast = index === passage.reports.length - 1;
        entries.push(...recordDay(game, report, isLast));
      });

      // 도착한 목적지를 그대로 두면 항해 명령이 하루짜리 "도달" 보고만 반복한다.
      if (passage.stop === "arrived" || passage.stop === "docked") {
        game.voyage.destination = null;
      }

      const summary: JournalEntry = {
        day: game.voyage.day,
        kind: "system",
        text: passage.summary,
      };
      game.journal.push(summary);
      entries.push(summary);

      return {
        report: passage.reports[passage.reports.length - 1] ?? null,
        entries,
        passage,
      };
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
