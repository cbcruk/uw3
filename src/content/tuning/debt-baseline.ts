import type { SourceGrade } from './tuning.types'

/**
 * 충실도 부채의 현재 상한 (SPEC 6.1).
 *
 * 검증기가 이 수를 래칫으로 쓴다. 근거 없는 수를 하나 더 넣는 것이 **조용히**
 * 되면 안 된다 — 늘려야 한다면 이 파일을 함께 고치게 되고, 그 diff가 곧
 * "근거 없는 값을 늘렸다"는 기록이 된다.
 */
export const DEBT_BASELINE: Readonly<Record<SourceGrade, number>> = {
  /** 자료에서 옮긴 값. 이 수는 **줄어들면 안 된다** — 줄었다면 근거를 잃은 것이다. */
  measured: 0,
  qualitative: 18,
  /**
   * 감으로 정한 값. 이 수는 **늘어나면 안 된다**.
   *
   * 58 → 59: 압류 구조를 넣으며 `referenceWindKnots`가 붙었다 (SHAPE P9).
   * 새 물리를 넣으면 확인할 것도 같이 는다 — 그것이 정상이고, 줄여야 할 것은
   * 비율이지 절대수가 아니다.
   */
  unverified: 59,
  /**
   * 확인 대상이 아닌 값. 이 수도 **늘어나면 안 된다**.
   *
   * 이쪽 래칫이 더 중요하다. `unverified`를 `not-applicable`로 바꾸면 부채가
   * 줄어든 것처럼 보이는데, 그것이 이 등급의 유일한 오용 경로다. 양쪽을 다 잠가야
   * 재분류가 **눈에 보이는 diff**를 남긴다.
   */
  // 44 → 46: 압류 풍속 배율의 상·하한 클램프 둘.
  'not-applicable': 46,
}
