import type { SourceGrade } from "./tuning.types";

/**
 * 충실도 부채의 현재 상한 (SPEC 6.1).
 *
 * 검증기가 이 수를 래칫으로 쓴다 — `unverified`가 이보다 늘면 실패한다.
 * 근거 없는 수를 하나 더 넣는 것이 **조용히** 되면 안 된다. 늘려야 한다면
 * 이 파일을 함께 고치게 되고, 그 diff가 곧 "근거 없는 값을 늘렸다"는 기록이 된다.
 *
 * 줄어들면 검증기가 낮추라고 알린다. 갚은 부채는 즉시 상한에 반영해야
 * 다음 사람이 그만큼을 다시 쓸 수 없다.
 */
export const DEBT_BASELINE: Readonly<Record<SourceGrade, number>> = {
  /** 자료에서 옮긴 값. 이 수는 **줄어들면 안 된다** — 줄었다면 근거를 잃은 것이다. */
  measured: 0,
  qualitative: 19,
  /** 감으로 정한 값. 이 수는 **늘어나면 안 된다**. */
  unverified: 99,
};
