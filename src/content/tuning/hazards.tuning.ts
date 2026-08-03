import { tunedValues } from "./tuning";
import type { Tuned } from "./tuning.types";

const guess = (value: number, unit: string, note = "감으로 정함"): Tuned => ({
  value,
  unit,
  grade: "unverified",
  source: note,
});

/**
 * 트러블 압력·효과 계수.
 *
 * **트러블이 상태 종속이라는 것과 즉사시키지 않는다는 것은 Shape**다 (SHAPE.md P5·P6).
 * 여기 있는 것은 압력을 얼마나 실을지, 얼마나 깎을지의 값뿐이다.
 *
 * 대조 자료는 SPEC 3.1의 "당대 기록의 승선원 손실률"이다. 아직 하나도 못 댔다.
 */
const STORM = {
  baseWeight: guess(1, "가중치"),
  warningThreshold: guess(0.35, "압력 0~1"),

  /** 이 풍속을 넘으면 폭풍 압력이 붙기 시작한다. */
  windOnsetKnots: {
    value: 14,
    unit: "kn",
    grade: "qualitative",
    source: "강풍에서 폭풍 위험이 오른다는 것은 자명. 시작점 수치는 저작",
  },
  windRangeKnots: guess(22, "kn"),
  windWeight: guess(0.6, "배"),
  winterPressure: {
    value: 0.35,
    unit: "압력 0~1",
    grade: "qualitative",
    source: "북대서양 폭풍이 겨울에 잦다는 것은 실재. 수치는 저작",
  },
  autumnPressure: guess(0.2, "압력 0~1"),
  otherSeasonPressure: guess(0.05, "압력 0~1"),
  /** 이 위도를 넘으면 폭풍 압력이 붙는다. */
  latOnsetDeg: {
    value: 36,
    unit: "°",
    grade: "qualitative",
    source: "고위도일수록 폭풍이 잦다는 것은 실재. 경계 위도는 저작",
  },
  latRangeDeg: guess(18, "°"),
  latWeight: guess(0.3, "배"),
  hullWeight: guess(0.2, "배"),

  severityBase: guess(0.4, "0~1"),
  severityRange: guess(0.6, "0~1"),
  /** 최대 심각도에서 잃는 선체 비율. */
  hullLossRatio: guess(0.06, "배"),
  timberLossMax: guess(12, "단위"),
  crewLossChance: guess(0.35, "확률"),
  fatigueGain: guess(0.14, "0~1"),
  disciplineLoss: guess(0.05, "0~1"),
  /** 폭풍에 풍하로 떠밀리는 거리. */
  driftNm: guess(25, "해리"),
} as const satisfies Record<string, Tuned>;

const SCURVY = {
  baseWeight: guess(0.9, "가중치"),
  warningThreshold: guess(0.4, "압력 0~1"),

  /** 이 일수를 넘겨야 괴혈병 압력이 붙기 시작한다. */
  onsetDaysAtSea: {
    value: 30,
    unit: "일",
    grade: "qualitative",
    source: "신선식품 없이 수 주가 지나야 증상이 나타난다는 것은 실재. 정확히 30일은 저작",
  },
  onsetRangeDays: guess(60, "일"),
  timeWeight: guess(0.7, "배"),
  rationFloorDays: guess(25, "일"),
  rationWeight: guess(0.5, "배"),
  fatigueWeight: guess(0.3, "배"),
  /** 압력에서 빼는 기본값. 초반에 곧바로 터지지 않게 한다. */
  pressureOffset: guess(0.2, "압력 0~1"),

  /** 한 번에 앓아눕는 비율 상한. */
  strickenRatio: guess(0.08, "배"),
  disciplineLoss: guess(0.04, "0~1"),
} as const satisfies Record<string, Tuned>;

const BECALMED = {
  baseWeight: guess(0.8, "가중치"),
  warningThreshold: guess(0.45, "압력 0~1"),
  /** 이 풍속 아래에서 무풍 압력이 붙는다. */
  calmThresholdKnots: {
    value: 7,
    unit: "kn",
    grade: "qualitative",
    source: "풍속이 낮을수록 무풍 위험이 크다는 것은 자명. 경계 수치는 저작",
  },
  extraDaysMax: guess(2, "일"),
  disciplineLoss: guess(0.06, "0~1"),
  fatigueGain: guess(0.03, "0~1"),
} as const satisfies Record<string, Tuned>;

const UNREST = {
  baseWeight: guess(1.1, "가중치"),
  warningThreshold: guess(0.4, "압력 0~1"),

  hungerFloorDays: guess(20, "일"),
  hungerWeight: guess(0.45, "배"),
  fatigueOnset: guess(0.4, "0~1"),
  fatigueWeight: guess(0.35, "배"),
  moraleWeight: guess(0.4, "배"),
  pressureOffset: guess(0.25, "압력 0~1"),

  disciplineLoss: guess(0.15, "0~1"),
  disciplineLossJitter: guess(0.1, "0~1"),
  /** 헤집어 축나는 식량 = 선원수 × 이 값. */
  wastedFoodPerCrew: guess(1.5, "단위/명"),
  /** 이 아래로 규율이 떨어지면 이탈자가 나온다. */
  desertionThreshold: guess(0.2, "0~1"),
  desertersMax: guess(3, "명"),
} as const satisfies Record<string, Tuned>;

export const HAZARD_TABLES = [STORM, SCURVY, BECALMED, UNREST] as const;

export const HAZARD = {
  storm: tunedValues(STORM),
  scurvy: tunedValues(SCURVY),
  becalmed: tunedValues(BECALMED),
  unrest: tunedValues(UNREST),
};
