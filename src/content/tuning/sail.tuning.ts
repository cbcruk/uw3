import type { SailType } from "../../sim/ship/ship.types";
import { tunedValues } from "./tuning";
import type { Tuned } from "./tuning.types";

type Curve = readonly (readonly [angleDeg: number, efficiency: number])[];

interface TunedCurve extends Tuned<Curve> {
  grounded: string;
}

/**
 * 돛 극곡선. 풍향각(0=정풍)에 대한 추진 효율이다.
 *
 * **곡선이 존재한다는 것과 두 돛을 구분한다는 것은 Shape**다 (SHAPE.md P2).
 * 여기 있는 것은 점들의 값뿐이다.
 */
export const SAIL_CURVES: Readonly<Record<SailType, TunedCurve>> = {
  square: {
    value: [
      [0, 0],
      [50, 0],
      [65, 0.18],
      [90, 0.52],
      [120, 0.84],
      [150, 1],
      [180, 0.9],
    ],
    unit: "효율 (0~1)",
    grade: "qualitative",
    grounded: "사각돛이 정풍 근처에서 무력하고 뒤에서 받을 때 가장 강하다는 형태",
    source:
      "형태만 근거. 무보각 한계(50°)와 최적각(150°)의 실측 수치는 미확인 — 당대 범선 극곡선 자료 필요",
  },
  lateen: {
    value: [
      [0, 0],
      [32, 0],
      [45, 0.44],
      [70, 0.85],
      [100, 1],
      [130, 0.86],
      [155, 0.68],
      [180, 0.52],
    ],
    unit: "효율 (0~1)",
    grade: "qualitative",
    grounded: "라틴돛이 사각돛보다 바람에 가깝게 붙고 순풍에서는 둔하다는 형태",
    source: "형태만 근거. 무보각 한계(32°)가 실제 라틴 장비 대비 낙관적일 수 있다 — 확인 필요",
  },
};

export const SAIL_SCALARS = {
  /** 이 풍속에서 선급 최고 속력이 나온다. */
  nominalWindKnots: {
    value: 14,
    unit: "kn",
    grade: "unverified",
    source: "감으로 정함. 선급별 정격 풍속 자료 필요",
  },
  /** 이보다 세면 축범해야 하고 유효 풍속이 오히려 준다. */
  reefingThresholdKnots: {
    value: 26,
    unit: "kn",
    grade: "qualitative",
    source: "축범이 필요해지는 풍력 구간이 있다는 것은 실재. 정확히 26kn은 저작",
  },
  /** 축범 임계를 넘은 뒤 초과 풍속 1kn당 줄어드는 유효 풍속. */
  reefingDecay: {
    value: 0.7,
    unit: "kn/kn",
    grade: "unverified",
    source: "감으로 정함",
  },
  /** 아무리 강풍이어도 유효 풍속은 이 아래로 내려가지 않는다. */
  reefedFloorKnots: {
    value: 6,
    unit: "kn",
    grade: "unverified",
    source: "감으로 정함",
  },
  /** 선급 최고 속력을 이 배수까지 넘을 수 있다. */
  overspeedFactor: {
    value: 1.15,
    unit: "배",
    grade: "unverified",
    source: "감으로 정함",
  },

  // ── 컨디션 계수 — 각 항의 최저 배수와 가변 폭 ──────────
  hullFloor: { value: 0.45, unit: "배", grade: "unverified", source: "감으로 정함" },
  hullRange: { value: 0.55, unit: "배", grade: "unverified", source: "감으로 정함" },
  crewFloor: { value: 0.35, unit: "배", grade: "unverified", source: "감으로 정함" },
  crewRange: { value: 0.65, unit: "배", grade: "unverified", source: "감으로 정함" },
  /** 피로가 최대일 때 깎이는 비율. */
  fatiguePenalty: { value: 0.35, unit: "배", grade: "unverified", source: "감으로 정함" },
  disciplineFloor: { value: 0.75, unit: "배", grade: "unverified", source: "감으로 정함" },
  disciplineRange: { value: 0.25, unit: "배", grade: "unverified", source: "감으로 정함" },
} as const satisfies Record<string, Tuned>;

export const SAIL = tunedValues(SAIL_SCALARS);
