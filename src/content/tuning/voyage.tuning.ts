import { tunedValues } from "./tuning";
import type { Tuned } from "./tuning.types";

const guess = (value: number, unit: string, note = "감으로 정함"): Tuned => ({
  value,
  unit,
  grade: "unverified",
  source: note,
});

/**
 * 하루 진행의 값들. **하루가 시뮬 단위라는 것은 Shape**다 (SHAPE.md T1).
 * 여기 있는 것은 하루에 얼마나 소모하고 얼마나 회복하는지의 값뿐이다.
 *
 * 대조 자료는 SPEC 3.1의 "당대 기록의 승선원 손실률"이다.
 */
const VOYAGE_SCALARS = {
  /** 맑은 날 좌우로 살피는 거리. 컨디션에 따라 줄어든다. */
  baseLookoutNm: guess(16, "해리"),
  lookoutFloor: guess(0.6, "배"),
  lookoutRange: guess(0.4, "배"),

  /** 트러블 압력 합을 실제 발생 확률로 옮기는 배율. */
  hazardRollScale: guess(0.55, "배"),
  /** 하루에 트러블이 터질 확률의 상한. */
  hazardChanceCap: guess(0.6, "확률"),
  /** 이 압력 아래인 트러블은 후보에서 뺀다. */
  hazardPressureFloor: guess(0.02, "압력 0~1"),

  /** 병자 한 명이 유효 인원에서 빠지는 비율. */
  sickCrewPenalty: guess(0.7, "명/명"),

  // ── 보급 부족의 대가 ────────────────────────────────────
  foodShortfallFatigue: guess(0.09, "0~1"),
  foodShortfallDiscipline: guess(0.12, "0~1"),
  waterShortfallFatigue: guess(0.13, "0~1"),
  /** 물이 완전히 떨어진 날 앓아눕는 비율. */
  waterShortfallSickRatio: guess(0.05, "배"),

  // ── 피로와 규율 ─────────────────────────────────────────
  portFatigueRecovery: guess(0.18, "0~1/일"),
  portSickRecovery: guess(0.25, "배/일"),
  anchoredFatigueRecovery: guess(0.05, "0~1/일"),
  seaFatigueBase: guess(0.012, "0~1/일"),
  seaFatigueExertion: guess(0.03, "0~1/일"),
  /** 규율 목표치에서 피로가 차지하는 몫. */
  disciplineFatigueWeight: guess(0.5, "배"),
  disciplineSupplyWeight: guess(0.45, "배"),
  /** 이 일수 아래로 보급이 줄면 규율 목표가 깎이기 시작한다. */
  disciplineSupplyFloorDays: guess(20, "일"),
  /** 규율이 목표치로 다가가는 속도. */
  disciplineApproachRate: guess(0.18, "배/일"),
  /** 이 아래로 떨어지면 항해일지에 경고가 뜬다. */
  disciplineWarnThreshold: guess(0.15, "0~1"),

  /** 이 세기 이상이면 해류가 항해일지에 언급된다. */
  currentMentionKnots: guess(0.05, "kn"),

  /** 하루 항정을 쪼개는 스텝. 타일 한 변의 이 비율로 잡는다. */
  courseStepTileRatio: {
    value: 0.5,
    unit: "배",
    grade: "qualitative",
    source: "충돌 판정이 이동보다 촘촘해야 한다는 요구에서 나온 값 (SHAPE.md P4)",
  },
  courseStepFloorNm: guess(2, "해리"),
} as const satisfies Record<string, Tuned>;

/**
 * 구간 항해의 정지 임계. **정지 조건 목록은 Shape, 임계값은 Knob**이다 (SHAPE.md §1).
 */
const PASSAGE_SCALARS = {
  /** 한 번의 명령으로 진행할 최대 일수. */
  maxDays: guess(30, "일"),
  /** 목적지 도달로 인정할 반경. 입항 반경과 같아야 한다. */
  arrivalRangeNm: {
    value: 12,
    unit: "해리",
    grade: "qualitative",
    source: "입항 판정 반경과 같아야 항구를 코앞에 두고 멈추지 않는다. 값 자체는 저작",
  },
  /** 이 일수 아래로 보급이 떨어지면 멈춘다. */
  supplyDaysFloor: guess(20, "일"),
  /** 목적지에 가까워지지 않아도 이만큼은 버틴다. */
  beatingDaysLimit: guess(4, "일"),
  /** 입항으로 인정할 반경. */
  dockingRangeNm: guess(12, "해리"),
} as const satisfies Record<string, Tuned>;

export const VOYAGE_TABLES = [VOYAGE_SCALARS, PASSAGE_SCALARS] as const;
export const VOYAGE_TUNING = tunedValues(VOYAGE_SCALARS);
export const PASSAGE_TUNING = tunedValues(PASSAGE_SCALARS);
