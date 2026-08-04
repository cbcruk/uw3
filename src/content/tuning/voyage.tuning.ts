import { internal, tunedValues } from "./tuning";
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
  // 컨디션이 시야에 미치는 몫. 견시 **거리**는 실재하지만 이 배분은 모델 것이다.
  lookoutFloor: internal(0.6, "배", "컨디션→시야 결합 계수. 모델 내부 배분"),
  lookoutRange: internal(0.4, "배", "컨디션→시야 결합 계수. 모델 내부 배분"),

  /**
   * 정지한 날의 보고에 해류를 언급할 최소 속력. 표시 임계일 뿐 물리에는 안 쓴다.
   * 이보다 느린 표류는 하루 항정이 1해리도 안 되어 알려도 소용이 없다.
   */
  driftMentionKnots: internal(0.05, "kn", "항해일지 표시 임계. 물리에 쓰지 않는다"),

  // "압력"은 우리 모델의 개념이다. 사료에 압력→확률 변환 계수 같은 것은 없다.
  // 대조 대상은 이 값들이 아니라 이들이 만들어내는 **발생률**이다.
  hazardRollScale: internal(0.55, "배", "압력 합→확률 변환. 모델 내부 개념"),
  hazardChanceCap: internal(0.6, "확률", "하루 확률 상한. 모델 내부 안전장치"),
  hazardPressureFloor: internal(0.02, "압력 0~1", "후보 컷오프. 계산 정리용"),

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
  disciplineWarnThreshold: internal(0.15, "0~1", "경고를 띄우는 임계. 표시용"),

  currentMentionKnots: internal(0.05, "kn", "항해일지 표시 임계. 물리에 쓰지 않는다"),

  // 수치 적분의 스텝 크기다. 작을수록 정확하고 느릴 뿐, 세계가 달라지지 않는다.
  courseStepTileRatio: internal(
    0.5,
    "배",
    "이동 적분 스텝. 충돌 판정이 이동보다 촘촘하기만 하면 된다 (SHAPE P4)",
  ),
  courseStepFloorNm: internal(2, "해리", "이동 적분 스텝의 하한"),
} as const satisfies Record<string, Tuned>;

/**
 * 구간 항해의 정지 임계. **정지 조건 목록은 Shape, 임계값은 Knob**이다 (SHAPE.md §1).
 *
 * 다섯 전부 `not-applicable`이다. 이것들이 정하는 것은 바다가 아니라 **언제
 * 플레이어에게 제어를 돌려주는가**다. 사료에 "도달 판정 반경은 12해리였다"는 없다.
 */
const PASSAGE_SCALARS = {
  maxDays: internal(30, "일", "한 번의 명령으로 진행할 최대 일수. 제어를 돌려주는 시점"),
  arrivalRangeNm: internal(12, "해리", "도달 판정 반경. 입항 반경과 같아야 한다"),
  supplyDaysFloor: internal(20, "일", "멈추고 물어보는 보급 임계. 제어를 돌려주는 시점"),
  beatingDaysLimit: internal(4, "일", "역주를 참는 일수. 제어를 돌려주는 시점"),
  dockingRangeNm: internal(12, "해리", "입항으로 인정할 판정 반경. 조작 편의 값"),
} as const satisfies Record<string, Tuned>;

export const VOYAGE_TABLES = [VOYAGE_SCALARS, PASSAGE_SCALARS] as const;
export const VOYAGE_TUNING = tunedValues(VOYAGE_SCALARS);
export const PASSAGE_TUNING = tunedValues(PASSAGE_SCALARS);
