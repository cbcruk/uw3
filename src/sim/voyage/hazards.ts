import { advance, clamp } from "../geo/geo.utils";
import type { HazardContext, HazardDefinition, VoyageState } from "./voyage.types";

function supplyDaysRemaining(state: VoyageState): number {
  return state.crew > 0 ? Math.min(state.food, state.water) / state.crew : 0;
}

function driftShip(context: HazardContext, headingDeg: number, distanceNm: number): void {
  const { state, tileMap } = context;
  const target = advance(state.position, headingDeg, distanceNm);
  if (tileMap.isNavigable(target)) {
    state.position = target;
  }
}

const STORM: HazardDefinition = {
  id: "storm",
  name: "폭풍",
  kind: "storm",
  baseWeight: 1,
  warning: "부관: 기압이 떨어지고 있습니다. 파도가 길어졌습니다.",
  warningThreshold: 0.35,
  pressure(context: HazardContext): number {
    const { state, wind, season } = context;
    const windPressure = clamp((wind.speedKnots - 14) / 22, 0, 1);
    const seasonPressure = season === "winter" ? 0.35 : season === "autumn" ? 0.2 : 0.05;
    const latitudePressure = clamp((Math.abs(state.position.lat) - 36) / 18, 0, 1) * 0.3;
    const hullPressure = (1 - state.hull / state.hullMax) * 0.2;
    return clamp(windPressure * 0.6 + seasonPressure + latitudePressure + hullPressure, 0, 1);
  },
  apply(context: HazardContext): string {
    const { state, wind, rng } = context;
    const severity = 0.4 + rng.next() * 0.6;
    const hullLoss = Math.round(state.hullMax * 0.06 * severity) + 1;
    const timberLoss = Math.min(state.timber, Math.round(12 * severity));
    const crewLoss = rng.chance(0.35 * severity) ? 1 + rng.int(0, 2) : 0;

    state.hull = Math.max(1, state.hull - hullLoss);
    state.timber -= timberLoss;
    state.crew = Math.max(1, state.crew - crewLoss);
    state.fatigue = clamp(state.fatigue + 0.14 * severity, 0, 1);
    state.discipline = clamp(state.discipline - 0.05 * severity, 0, 1);

    driftShip(context, wind.fromDeg + 180, 25 * severity);

    const crewNote = crewLoss > 0 ? ` 선원 ${crewLoss}명이 파도에 휩쓸렸다.` : "";
    return `폭풍에 휘말렸다. 선체 ${hullLoss} 손상, 자재 ${timberLoss} 소모.${crewNote}`;
  },
};

const SCURVY: HazardDefinition = {
  id: "scurvy",
  name: "괴혈병",
  kind: "disease",
  baseWeight: 0.9,
  warning: "부관: 잇몸에서 피가 나는 자가 늘고 있습니다. 신선한 식량이 필요합니다.",
  warningThreshold: 0.4,
  pressure(context: HazardContext): number {
    const { state } = context;
    const timePressure = clamp((state.daysAtSea - 30) / 60, 0, 1);
    const rationPressure = clamp(1 - supplyDaysRemaining(state) / 25, 0, 1) * 0.5;
    const fatiguePressure = state.fatigue * 0.3;
    return clamp(timePressure * 0.7 + rationPressure + fatiguePressure - 0.2, 0, 1);
  },
  apply(context: HazardContext): string {
    const { state, rng } = context;
    const stricken = 1 + rng.int(0, Math.max(1, Math.floor(state.crew * 0.08)));
    state.sick = Math.min(state.crew, state.sick + stricken);
    state.discipline = clamp(state.discipline - 0.04, 0, 1);
    return `괴혈병이 번졌다. ${stricken}명이 앓아누웠다.`;
  },
};

const BECALMED: HazardDefinition = {
  id: "becalmed",
  name: "무풍",
  kind: "calm",
  baseWeight: 0.8,
  warning: "부관: 바람이 죽어갑니다. 돛이 늘어졌습니다.",
  warningThreshold: 0.45,
  pressure(context: HazardContext): number {
    const { wind, state } = context;
    if (state.anchored) {
      return 0;
    }
    return clamp((7 - wind.speedKnots) / 7, 0, 1);
  },
  apply(context: HazardContext): string {
    const { state, rng } = context;
    const extraDays = 1 + rng.int(0, 2);
    const foodLoss = Math.min(state.food, state.crew * extraDays);
    const waterLoss = Math.min(state.water, state.crew * extraDays);
    state.food -= foodLoss;
    state.water -= waterLoss;
    state.discipline = clamp(state.discipline - 0.06, 0, 1);
    state.fatigue = clamp(state.fatigue + 0.03, 0, 1);
    return `바람이 완전히 멎었다. ${extraDays}일치 보급이 그대로 소모되었다.`;
  },
};

const UNREST: HazardDefinition = {
  id: "unrest",
  name: "선상 불온",
  kind: "unrest",
  baseWeight: 1.1,
  warning: "부관: 아래층에서 수군거리는 소리가 들립니다. 회항을 입에 올리고 있습니다.",
  warningThreshold: 0.4,
  pressure(context: HazardContext): number {
    const { state } = context;
    const hungerPressure = clamp(1 - supplyDaysRemaining(state) / 20, 0, 1);
    const fatiguePressure = clamp((state.fatigue - 0.4) / 0.6, 0, 1);
    const moralePressure = clamp(1 - state.discipline, 0, 1);
    return clamp(
      hungerPressure * 0.45 + fatiguePressure * 0.35 + moralePressure * 0.4 - 0.25,
      0,
      1,
    );
  },
  apply(context: HazardContext): string {
    const { state, rng } = context;
    state.discipline = clamp(state.discipline - 0.15 - rng.next() * 0.1, 0, 1);
    const wasted = Math.min(state.food, Math.round(state.crew * 1.5));
    state.food -= wasted;
    if (state.discipline < 0.2) {
      const deserters = 1 + rng.int(0, 3);
      state.crew = Math.max(1, state.crew - deserters);
      return `선원들이 작업을 거부했다. ${deserters}명이 이탈하고 식량이 축났다.`;
    }
    return "선원들이 배급에 항의하며 식량 창고를 헤집었다.";
  },
};

export const VOYAGE_HAZARDS: readonly HazardDefinition[] = [STORM, SCURVY, BECALMED, UNREST];
