import { internal, tunedValues } from "../tuning/tuning";
import type { Tuned } from "../tuning/tuning.types";

/**
 * 시야 반경 (해리). 칸 수가 아니다 — 칸 크기가 위도마다 달라서다 (SPEC-roguelike R9).
 *
 * **현실보다 일부러 넓다.** 처음에는 망루 수평선에 높은 해안을 얹은 현실 쪽 값(배 36·뭍 24해리)
 * 이었는데, 반경 2~3칸이라 화면 대부분이 안개였다. 원본 로그라이크의 시야(8칸 안팎)에 맞춰 넓혔다.
 * 그래서 사료와 대조할 값이 아니다 — 이 값을 근거로 "당대 망루는 이만큼 봤다"고 읽으면 안 된다.
 */
const SIGHT_SCALARS = {
  shipSightNm: internal(
    96,
    "해리",
    "게임 체감 값. 위도 38°에서 반경 약 8칸. 현실 망루 시정(약 9~36해리)보다 일부러 넓혀 사료 대조 대상이 아니다",
  ),
  landSightNm: internal(
    60,
    "해리",
    "게임 체감 값. 위도 38°에서 반경 약 5칸. 배보다 좁게 두어 하선의 대가로 삼았다. 사료 대조 대상이 아니다",
  ),
} as const satisfies Record<string, Tuned>;

export const SIGHT_TABLES = [SIGHT_SCALARS] as const;
export const SIGHT = tunedValues(SIGHT_SCALARS);
