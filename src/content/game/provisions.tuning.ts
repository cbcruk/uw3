import { internal, tunedValues } from "../tuning/tuning";
import type { Tuned } from "../tuning/tuning.types";

/**
 * 보급이 떨어진 날 잃는 선원의 비율. 하루에 한 번, 모자란 몫에 비례해 적용한다.
 *
 * 시뮬은 같은 상황을 피로·규율·병자로 나눠 굴린다. 게임 레이어는 그 사슬을 접고
 * 결과(머릿수)만 남겼다 — 로그라이크의 HP 하나로 읽히게 하려는 것이다 (SPEC-roguelike §11).
 */
const PROVISION_SCALARS = {
  starvationLossRatio: {
    value: 0.02,
    unit: "명/명·일",
    grade: "unverified",
    source: "감으로 정함. 굶주림은 몇 주에 걸쳐 죽인다는 방향만 둔 값. 항해 기록의 아사 일지 필요",
  },
  thirstLossRatio: {
    value: 0.1,
    unit: "명/명·일",
    grade: "unverified",
    source: "감으로 정함. 물 없이는 며칠을 못 버틴다는 방향만 둔 값. 표류 생존 기록 필요",
  },
  hireHours: internal(
    12,
    "시간",
    "항구에서 선원을 정원까지 모으는 데 쓰는 시간. 게임 속도 값 — 고용이 공짜 행동이 되지 않게 한다",
  ),
} as const satisfies Record<string, Tuned>;

export const PROVISION_TABLES = [PROVISION_SCALARS] as const;
export const PROVISION = tunedValues(PROVISION_SCALARS);
