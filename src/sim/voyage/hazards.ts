import { HAZARD } from '../../content/tuning/hazards.tuning'
import { OPPOSITE_DEG, advance, clamp } from '../geo/geo.utils'
import type { HazardContext, HazardDefinition, VoyageState } from './voyage.types'

function supplyDaysRemaining(state: VoyageState): number {
  return state.crew > 0 ? Math.min(state.food, state.water) / state.crew : 0
}

function driftShip(context: HazardContext, headingDeg: number, distanceNm: number): void {
  const { state, tileMap } = context
  const target = advance(state.position, headingDeg, distanceNm)
  if (tileMap.isNavigable(target)) {
    state.position = target
  }
}

const STORM: HazardDefinition = {
  id: 'storm',
  name: '폭풍',
  kind: 'storm',
  baseWeight: HAZARD.storm.baseWeight,
  warning: '부관: 기압이 떨어지고 있습니다. 파도가 길어졌습니다.',
  warningThreshold: HAZARD.storm.warningThreshold,
  pressure(context: HazardContext): number {
    const { state, wind, season } = context
    const t = HAZARD.storm
    const windPressure = clamp((wind.speedKnots - t.windOnsetKnots) / t.windRangeKnots, 0, 1)
    const seasonPressure =
      season === 'winter'
        ? t.winterPressure
        : season === 'autumn'
          ? t.autumnPressure
          : t.otherSeasonPressure
    const latitudePressure =
      clamp((Math.abs(state.position.lat) - t.latOnsetDeg) / t.latRangeDeg, 0, 1) * t.latWeight
    const hullPressure = (1 - state.hull / state.hullMax) * t.hullWeight
    return clamp(
      windPressure * t.windWeight + seasonPressure + latitudePressure + hullPressure,
      0,
      1,
    )
  },
  apply(context: HazardContext): string {
    const { state, wind, rng } = context
    const t = HAZARD.storm
    const severity = t.severityBase + rng.next() * t.severityRange
    const hullLoss = Math.round(state.hullMax * t.hullLossRatio * severity) + 1
    const timberLoss = Math.min(state.timber, Math.round(t.timberLossMax * severity))
    const crewLoss = rng.chance(t.crewLossChance * severity) ? 1 + rng.int(0, 2) : 0

    state.hull = Math.max(1, state.hull - hullLoss)
    state.timber -= timberLoss
    state.crew = Math.max(1, state.crew - crewLoss)
    state.fatigue = clamp(state.fatigue + t.fatigueGain * severity, 0, 1)
    state.discipline = clamp(state.discipline - t.disciplineLoss * severity, 0, 1)

    driftShip(context, wind.fromDeg + OPPOSITE_DEG, t.driftNm * severity)

    const crewNote = crewLoss > 0 ? ` 선원 ${crewLoss}명이 파도에 휩쓸렸다.` : ''
    return `폭풍에 휘말렸다. 선체 ${hullLoss} 손상, 자재 ${timberLoss} 소모.${crewNote}`
  },
}

const SCURVY: HazardDefinition = {
  id: 'scurvy',
  name: '괴혈병',
  kind: 'disease',
  baseWeight: HAZARD.scurvy.baseWeight,
  warning: '부관: 잇몸에서 피가 나는 자가 늘고 있습니다. 신선한 식량이 필요합니다.',
  warningThreshold: HAZARD.scurvy.warningThreshold,
  pressure(context: HazardContext): number {
    const { state } = context
    const t = HAZARD.scurvy
    const timePressure = clamp((state.daysAtSea - t.onsetDaysAtSea) / t.onsetRangeDays, 0, 1)
    const rationPressure =
      clamp(1 - supplyDaysRemaining(state) / t.rationFloorDays, 0, 1) * t.rationWeight
    const fatiguePressure = state.fatigue * t.fatigueWeight
    return clamp(
      timePressure * t.timeWeight + rationPressure + fatiguePressure - t.pressureOffset,
      0,
      1,
    )
  },
  apply(context: HazardContext): string {
    const { state, rng } = context
    const t = HAZARD.scurvy
    const stricken = 1 + rng.int(0, Math.max(1, Math.floor(state.crew * t.strickenRatio)))
    state.sick = Math.min(state.crew, state.sick + stricken)
    state.discipline = clamp(state.discipline - t.disciplineLoss, 0, 1)
    return `괴혈병이 번졌다. ${stricken}명이 앓아누웠다.`
  },
}

const BECALMED: HazardDefinition = {
  id: 'becalmed',
  name: '무풍',
  kind: 'calm',
  baseWeight: HAZARD.becalmed.baseWeight,
  warning: '부관: 바람이 죽어갑니다. 돛이 늘어졌습니다.',
  warningThreshold: HAZARD.becalmed.warningThreshold,
  pressure(context: HazardContext): number {
    const { wind, state } = context
    if (state.anchored) {
      return 0
    }
    const threshold = HAZARD.becalmed.calmThresholdKnots
    return clamp((threshold - wind.speedKnots) / threshold, 0, 1)
  },
  apply(context: HazardContext): string {
    const { state, rng } = context
    const t = HAZARD.becalmed
    const extraDays = 1 + rng.int(0, t.extraDaysMax)
    const foodLoss = Math.min(state.food, state.crew * extraDays)
    const waterLoss = Math.min(state.water, state.crew * extraDays)
    state.food -= foodLoss
    state.water -= waterLoss
    state.discipline = clamp(state.discipline - t.disciplineLoss, 0, 1)
    state.fatigue = clamp(state.fatigue + t.fatigueGain, 0, 1)
    return `바람이 완전히 멎었다. ${extraDays}일치 보급이 그대로 소모되었다.`
  },
}

const UNREST: HazardDefinition = {
  id: 'unrest',
  name: '선상 불온',
  kind: 'unrest',
  baseWeight: HAZARD.unrest.baseWeight,
  warning: '부관: 아래층에서 수군거리는 소리가 들립니다. 회항을 입에 올리고 있습니다.',
  warningThreshold: HAZARD.unrest.warningThreshold,
  pressure(context: HazardContext): number {
    const { state } = context
    const t = HAZARD.unrest
    const hungerPressure = clamp(1 - supplyDaysRemaining(state) / t.hungerFloorDays, 0, 1)
    const fatiguePressure = clamp((state.fatigue - t.fatigueOnset) / (1 - t.fatigueOnset), 0, 1)
    const moralePressure = clamp(1 - state.discipline, 0, 1)
    return clamp(
      hungerPressure * t.hungerWeight +
        fatiguePressure * t.fatigueWeight +
        moralePressure * t.moraleWeight -
        t.pressureOffset,
      0,
      1,
    )
  },
  apply(context: HazardContext): string {
    const { state, rng } = context
    const t = HAZARD.unrest
    state.discipline = clamp(
      state.discipline - t.disciplineLoss - rng.next() * t.disciplineLossJitter,
      0,
      1,
    )
    const wasted = Math.min(state.food, Math.round(state.crew * t.wastedFoodPerCrew))
    state.food -= wasted
    if (state.discipline < t.desertionThreshold) {
      const deserters = 1 + rng.int(0, t.desertersMax)
      state.crew = Math.max(1, state.crew - deserters)
      return `선원들이 작업을 거부했다. ${deserters}명이 이탈하고 식량이 축났다.`
    }
    return '선원들이 배급에 항의하며 식량 창고를 헤집었다.'
  },
}

export const VOYAGE_HAZARDS: readonly HazardDefinition[] = [STORM, SCURVY, BECALMED, UNREST]
