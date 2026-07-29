import type { DebugOptions } from "./debug-options.types";

/**
 * 조작을 시험할 때 안개가 시야를 막는다. 표시 계층만 끄고 탐사 상태(exploration)는
 * 그대로 둔다. 발견 게이팅(SPEC 2)은 안개 표시가 아니라 탐사 상태가 정한다.
 */
export function readDebugOptions(search: string): DebugOptions {
  const params = new URLSearchParams(search);
  return { fog: params.get("fog") !== "off" };
}
