import { VOYAGE_TUNING as V } from "../../content/tuning/voyage.tuning";
import { HOURS_PER_DAY, seasonOf } from "../calendar/calendar";
import { advance, clamp, haversineNm, relativeWindAngle } from "../geo/geo.utils";
import { leewayTrackDeg } from "../ship/leeway";
import { computeSpeedKnots, conditionFactor } from "../ship/sail";
import type { SailingCondition } from "../ship/ship.types";
import { currentAt, groundTrack } from "../current/current";
import { windAt } from "../wind/wind";
import type { Wind } from "../wind/wind.types";
import type { Current } from "../current/current.types";
import { courseStepNm } from "./course";
import { VOYAGE_HAZARDS } from "./hazards";
import type {
  DayReport,
  HazardContext,
  VoyageContext,
  VoyageEnd,
  VoyageState,
} from "./voyage.types";

const NO_CURRENT: Current = { toDeg: 0, speedKnots: 0, name: "무해류" };

export function effectiveCrew(state: VoyageState): number {
  return Math.max(0, state.crew - state.sick * V.sickCrewPenalty);
}

export function sailingCondition(state: VoyageState, crewMin: number): SailingCondition {
  return {
    hullRatio: state.hull / state.hullMax,
    crewRatio: clamp(effectiveCrew(state) / crewMin, 0, 1),
    fatigue: state.fatigue,
    discipline: state.discipline,
  };
}

export function supplyDays(state: VoyageState): number {
  return state.crew > 0 ? Math.floor(Math.min(state.food, state.water) / state.crew) : 0;
}

interface Movement {
  distanceNm: number;
  blocked: boolean;
  revealed: number;
  dockedPortId: string | null;
}

/**
 * 하루 항정은 입항 판정 반경보다 훨씬 길다. 종점만 보면 항구를 지나쳐 버리므로
 * 항로 위에서 판정한다.
 */
function portOnCourse(
  context: VoyageContext,
  position: VoyageState["position"],
  excludePortId: string | null,
): string | null {
  for (const port of context.ports) {
    if (port.id === excludePortId) {
      continue;
    }
    if (haversineNm(position, { lat: port.lat, lon: port.lon }) <= context.dockingRangeNm) {
      return port.id;
    }
  }
  return null;
}

function clearDepartureLock(state: VoyageState, context: VoyageContext): void {
  if (state.departedPortId === null) {
    return;
  }
  const origin = context.ports.find((port) => port.id === state.departedPortId);
  if (origin === undefined) {
    state.departedPortId = null;
    return;
  }
  if (haversineNm(state.position, { lat: origin.lat, lon: origin.lon }) > context.dockingRangeNm) {
    state.departedPortId = null;
  }
}

function moveAlongCourse(
  state: VoyageState,
  context: VoyageContext,
  trackDeg: number,
  distanceNm: number,
  lookoutNm: number,
): Movement {
  const stepNm = courseStepNm(context.tileMap);
  const steps = Math.max(1, Math.ceil(distanceNm / stepNm));
  const legNm = distanceNm / steps;

  let travelled = 0;
  let blocked = false;
  let dockedPortId: string | null = null;
  let revealed = context.exploration.revealAround(
    context.tileMap.bounds,
    state.position,
    lookoutNm,
  );

  for (let i = 0; i < steps; i += 1) {
    const next = advance(state.position, trackDeg, legNm);
    if (!context.tileMap.isNavigable(next)) {
      blocked = true;
      break;
    }
    state.position = next;
    travelled += legNm;
    revealed += context.exploration.revealAround(context.tileMap.bounds, state.position, lookoutNm);

    clearDepartureLock(state, context);
    dockedPortId = portOnCourse(context, state.position, state.departedPortId);
    if (dockedPortId !== null) {
      break;
    }
  }

  return { distanceNm: travelled, blocked, revealed, dockedPortId };
}

/**
 * 전진 0인 날은 반드시 이유를 남긴다. 침묵하면 플레이어는 정풍을 고장으로 읽는다.
 * 태킹은 난이도의 출처지 (SPEC 2) 숨겨야 할 규칙이 아니다.
 */
function stallReason(state: VoyageState, wind: Wind, current: Current): string {
  const drift =
    current.speedKnots >= V.driftMentionKnots ? ` 배는 ${current.name}에 떠밀려 간다.` : "";

  if (state.sailsSet.every((set) => set === false)) {
    return `돛을 모두 접은 채로는 바람을 받지 못한다.${drift}`;
  }
  if (wind.speedKnots < 1) {
    return `무풍이다. 돛이 늘어진 채 하루가 지났다.${drift}`;
  }
  return `정풍이다. 침로 ${Math.round(state.headingDeg)}°로는 바람을 물지 못한다. 침로를 좌우로 틀어 태킹해야 한다.${drift}`;
}

function consumeSupplies(state: VoyageState, logs: string[]): void {
  const foodNeeded = state.crew;
  const waterNeeded = state.crew;

  const foodServed = Math.min(state.food, foodNeeded);
  const waterServed = Math.min(state.water, waterNeeded);
  state.food -= foodServed;
  state.water -= waterServed;

  const foodShortfall = (foodNeeded - foodServed) / Math.max(1, foodNeeded);
  const waterShortfall = (waterNeeded - waterServed) / Math.max(1, waterNeeded);

  if (foodShortfall > 0) {
    state.fatigue = clamp(state.fatigue + V.foodShortfallFatigue * foodShortfall, 0, 1);
    state.discipline = clamp(state.discipline - V.foodShortfallDiscipline * foodShortfall, 0, 1);
    logs.push("식량이 바닥났다. 배급을 중단했다.");
  }
  if (waterShortfall > 0) {
    state.fatigue = clamp(state.fatigue + V.waterShortfallFatigue * waterShortfall, 0, 1);
    state.sick = Math.min(
      state.crew,
      state.sick + Math.ceil(state.crew * V.waterShortfallSickRatio * waterShortfall),
    );
    logs.push("물이 떨어졌다. 갈증으로 쓰러지는 자가 나왔다.");
  }
}

function updateCrewCondition(state: VoyageState, exertion: number, logs: string[]): void {
  if (state.atPortId !== null) {
    state.fatigue = clamp(state.fatigue - V.portFatigueRecovery, 0, 1);
    state.sick = Math.max(0, state.sick - Math.ceil(state.sick * V.portSickRecovery));
  } else if (state.anchored) {
    state.fatigue = clamp(state.fatigue - V.anchoredFatigueRecovery, 0, 1);
  } else {
    state.fatigue = clamp(state.fatigue + V.seaFatigueBase + V.seaFatigueExertion * exertion, 0, 1);
  }

  const disciplineTarget = clamp(
    1 -
      state.fatigue * V.disciplineFatigueWeight -
      clamp(1 - supplyDays(state) / V.disciplineSupplyFloorDays, 0, 1) * V.disciplineSupplyWeight,
    0,
    1,
  );
  state.discipline = clamp(
    state.discipline + (disciplineTarget - state.discipline) * V.disciplineApproachRate,
    0,
    1,
  );

  if (state.discipline < V.disciplineWarnThreshold && state.atPortId === null) {
    logs.push("규율이 무너지기 직전이다. 회항을 고려해야 한다.");
  }
}

function rollHazard(context: HazardContext): { id: string; message: string } | null {
  const candidates = VOYAGE_HAZARDS.map((hazard) => ({
    hazard,
    pressure: hazard.pressure(context),
  })).filter((entry) => entry.pressure > V.hazardPressureFloor);

  if (candidates.length === 0) {
    return null;
  }

  const totalPressure = candidates.reduce(
    (sum, entry) => sum + entry.pressure * entry.hazard.baseWeight,
    0,
  );
  const chance = clamp(totalPressure * V.hazardRollScale, 0, V.hazardChanceCap);
  if (!context.rng.chance(chance)) {
    return null;
  }

  const picked = context.rng.weighted(
    candidates,
    (entry) => entry.pressure * entry.hazard.baseWeight,
  );
  return { id: picked.hazard.id, message: picked.hazard.apply(context) };
}

function collectWarnings(context: HazardContext): string[] {
  return VOYAGE_HAZARDS.filter((hazard) => hazard.pressure(context) >= hazard.warningThreshold).map(
    (hazard) => hazard.warning,
  );
}

function endStateOf(state: VoyageState): VoyageEnd | null {
  if (state.crew <= 1) {
    return "crew-lost";
  }
  if (state.hull <= 1) {
    return "hull-lost";
  }
  return null;
}

/** 하루를 진행한다. state를 직접 변경한다. 저장·리플레이는 상위 월드 레이어가 맡는다. */
export function stepDay(state: VoyageState, context: VoyageContext): DayReport {
  const logs: string[] = [];
  const wind = windAt(state.position, state.day);
  const condition = sailingCondition(state, context.shipClass.crewMin);

  const relAngleDeg = relativeWindAngle(state.headingDeg, wind.fromDeg);
  const speedKnots =
    state.anchored || state.atPortId !== null
      ? 0
      : computeSpeedKnots({
          shipClass: context.shipClass,
          rig: state.rig,
          sailsSet: state.sailsSet,
          relAngleDeg,
          windSpeedKnots: wind.speedKnots,
          condition,
        });

  // 돛이 멈춰도 해류는 배를 밀고 간다. 닻을 내렸거나 입항 중일 때만 제자리다.
  const current =
    state.anchored || state.atPortId !== null ? NO_CURRENT : currentAt(state.position);
  // 배는 뱃머리가 향한 곳으로 가지 않는다 (SHAPE P9). 돛은 침로에 맞춰 조정하지만
  // 실제로 물 위를 지나는 방위는 그보다 풍하로 밀려 있다.
  const sailTrackDeg = leewayTrackDeg(state.headingDeg, wind.fromDeg, wind.speedKnots, speedKnots);
  const track = groundTrack(sailTrackDeg, speedKnots, current);

  const lookoutNm =
    V.baseLookoutNm * (V.lookoutFloor + V.lookoutRange * conditionFactor(condition));
  const movement =
    track.speedKnots > 0
      ? moveAlongCourse(
          state,
          context,
          track.headingDeg,
          track.speedKnots * HOURS_PER_DAY,
          lookoutNm,
        )
      : {
          distanceNm: 0,
          blocked: false,
          dockedPortId: null,
          revealed: context.exploration.revealAround(
            context.tileMap.bounds,
            state.position,
            lookoutNm,
          ),
        };

  if (movement.blocked) {
    logs.push("전방에 육지. 더 나아갈 수 없다.");
  }
  // 판단 기준은 항정이 아니라 **돛이 물었는가**다. 해류에 떠밀려 위치가 변해도
  // 돛이 죽었으면 배는 선장의 뜻대로 가고 있지 않다.
  // 육지에 막힌 것과는 별개의 사실이므로 둘 다 남긴다.
  if (speedKnots === 0 && !state.anchored && state.atPortId === null) {
    logs.push(stallReason(state, wind, current));
  }

  consumeSupplies(state, logs);

  const exertion = clamp(speedKnots / context.shipClass.maxSpeedKnots, 0, 1);
  updateCrewCondition(state, exertion, logs);

  const hazardContext: HazardContext = {
    state,
    wind,
    season: seasonOf(state.day),
    tileMap: context.tileMap,
    shipClass: context.shipClass,
    rng: context.rng,
  };

  const hazard = state.atPortId === null ? rollHazard(hazardContext) : null;
  if (hazard !== null) {
    logs.push(hazard.message);
  }

  state.day += 1;
  state.daysAtSea = state.atPortId === null ? state.daysAtSea + 1 : 0;

  const tomorrow: HazardContext = { ...hazardContext, wind: windAt(state.position, state.day) };

  return {
    day: state.day,
    position: { ...state.position },
    wind,
    current,
    trackDeg: track.headingDeg,
    speedKnots,
    distanceNm: movement.distanceNm,
    blockedByLand: movement.blocked,
    dockedPortId: movement.dockedPortId,
    revealedTiles: movement.revealed,
    hazardId: hazard?.id ?? null,
    logs,
    warnings: state.atPortId === null ? collectWarnings(tomorrow) : [],
    ended: endStateOf(state),
  };
}
