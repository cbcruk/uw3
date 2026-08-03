import type { WindBand } from "../../sim/wind/wind.types";
import { tunedValues } from "./tuning";
import type { Tuned } from "./tuning.types";

interface TunedBands extends Tuned<readonly WindBand[]> {
  grounded: string;
}

/**
 * 전 지구 풍대. 위도 절댓값이 `maxLat` 이하면 그 대역이다.
 *
 * **풍대가 위도의 함수라는 것은 Shape**다 (SHAPE.md §7). 여기 있는 것은 경계와 값뿐이다.
 */
export const WIND_BANDS: TunedBands = {
  value: [
    { maxLat: 5, fromDeg: 90, speedKnots: 3, regime: "doldrums" },
    { maxLat: 28, fromDeg: 55, speedKnots: 14, regime: "trades" },
    { maxLat: 33, fromDeg: 100, speedKnots: 6, regime: "horse-latitudes" },
    { maxLat: 90, fromDeg: 255, speedKnots: 16, regime: "westerlies" },
  ],
  unit: "위도° / 방위° / kn",
  grade: "qualitative",
  grounded:
    "대역의 순서와 방향 — 적도무풍대 → 북동무역풍 → 아열대무풍대 → 편서풍 — 은 실제 대기 순환과 같다",
  source: "경계 위도와 풍속은 저작. 파일럿 차트(월별 풍향·풍속 통계)와 대조해야 한다 (SPEC 3.1)",
};

export const WIND_SCALARS = {
  // ── 계절 ────────────────────────────────────────────────
  /** 여름에 기압대가 북상하고 겨울에 남하하는 폭. */
  seasonalLatShiftDeg: {
    value: 4.5,
    unit: "°",
    grade: "unverified",
    source:
      "감으로 정함. 실제 열대수렴대의 남북 이동은 이보다 훨씬 크다고 알려져 있어 과소 추정일 가능성이 높다 — 확인 필요",
  },
  /** 계절 위상의 기준일. 이 날 이동폭이 0이 된다. */
  seasonalPhaseDay: {
    value: 80,
    unit: "일",
    grade: "qualitative",
    source: "연중 80일째는 춘분 무렵이다. 계절 사인파의 기준점으로 타당",
  },

  // ── 지브롤터 해협 ───────────────────────────────────────
  /** 레반테(동풍)가 불어오는 방위. */
  levanterFromDeg: {
    value: 85,
    unit: "°",
    grade: "qualitative",
    source: "레반테가 동풍이라는 것은 실재. 정확한 방위는 저작",
  },
  /** 포니엔테(서풍)가 불어오는 방위. */
  ponienteFromDeg: {
    value: 265,
    unit: "°",
    grade: "qualitative",
    source: "포니엔테가 서풍이라는 것은 실재. 정확한 방위는 저작",
  },
  gibraltarBaseKnots: { value: 18, unit: "kn", grade: "unverified", source: "감으로 정함" },
  gibraltarWinterBonusKnots: {
    value: 6,
    unit: "kn",
    grade: "unverified",
    source: "감으로 정함",
  },
  /** 레반테와 포니엔테가 교대하는 주기. */
  gibraltarRegimeBlockDays: {
    value: 4,
    unit: "일",
    grade: "qualitative",
    source: "두 바람이 며칠 단위로 교대한다는 것은 실재. 정확히 4일은 저작",
  },
  gibraltarLevanterThreshold: {
    value: 0.45,
    unit: "0~1",
    grade: "unverified",
    source: "감으로 정함. 두 바람의 실제 빈도비 자료 필요",
  },

  // ── 리옹만 미스트랄 ─────────────────────────────────────
  mistralFromDeg: {
    value: 330,
    unit: "°",
    grade: "qualitative",
    source: "미스트랄이 북서풍이라는 것은 실재. 정확한 방위는 저작",
  },
  mistralBaseKnots: { value: 12, unit: "kn", grade: "unverified", source: "감으로 정함" },
  mistralWinterBonusKnots: {
    value: 12,
    unit: "kn",
    grade: "qualitative",
    source: "미스트랄이 겨울에 크게 강해진다는 것은 실재. 배수는 저작",
  },

  // ── 지중해 일반 ─────────────────────────────────────────
  mediterraneanFromDeg: { value: 295, unit: "°", grade: "unverified", source: "감으로 정함" },
  mediterraneanBaseKnots: { value: 8, unit: "kn", grade: "unverified", source: "감으로 정함" },
  mediterraneanWinterBonusKnots: {
    value: 7,
    unit: "kn",
    grade: "unverified",
    source: "감으로 정함",
  },

  // ── 편서풍 계절 변동 ────────────────────────────────────
  westerliesSummerFactor: {
    value: 0.8,
    unit: "배",
    grade: "qualitative",
    source: "편서풍이 겨울에 강해진다는 것은 실재. 배수는 저작",
  },
  westerliesWinterRange: { value: 0.5, unit: "배", grade: "unverified", source: "감으로 정함" },

  // ── 잡음 (하루하루의 변덕) ──────────────────────────────
  /** 잡음 격자의 공간 크기. 클수록 넓은 범위가 같은 바람을 받는다. */
  noiseSpaceDeg: { value: 2.5, unit: "°", grade: "unverified", source: "감으로 정함" },
  noiseTimeDays: { value: 3, unit: "일", grade: "unverified", source: "감으로 정함" },
  directionJitterDeg: {
    value: 80,
    unit: "°",
    grade: "unverified",
    source: "감으로 정함. 실제 풍향 변동폭 통계 필요",
  },
  directionJitterFineDeg: { value: 45, unit: "°", grade: "unverified", source: "감으로 정함" },
  speedJitterBase: { value: 0.5, unit: "배", grade: "unverified", source: "감으로 정함" },
  speedJitterCoarse: { value: 0.8, unit: "배", grade: "unverified", source: "감으로 정함" },
  speedJitterFine: { value: 0.4, unit: "배", grade: "unverified", source: "감으로 정함" },
  /** 어떤 경우에도 이보다 센 바람은 나오지 않는다. */
  maxWindKnots: {
    value: 45,
    unit: "kn",
    grade: "qualitative",
    source: "폭풍 상한이 있어야 한다는 것은 타당. 정확히 45kn은 저작",
  },
} as const satisfies Record<string, Tuned>;

export const WIND = tunedValues(WIND_SCALARS);

/**
 * 지역 예외의 경계 상자. 값이 아니라 **지리**이므로 Content에 가깝다 —
 * 늘리거나 좁히는 것은 콘텐츠 작업이고, 여기 없는 지역은 전 지구 풍대를 따른다.
 */
export const WIND_REGIONS = {
  mediterranean: { minLon: -5.4, minLat: 30, maxLat: 44 },
  gibraltar: { minLat: 35.5, maxLat: 36.5, minLon: -6.4, maxLon: -4.5 },
  gulfOfLion: { minLat: 41.3, minLon: 2.0, maxLon: 7.0 },
} as const;
