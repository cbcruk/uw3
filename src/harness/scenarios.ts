import type { Scenario } from './harness.types'

/**
 * 볼타 두 마르 대조. SPEC 3.3의 표를 다시 돌리기 위한 설정이다.
 *
 * 경유점 위도(33·30·27°N)는 무역풍대를 어디까지 내려가서 서진하느냐를 가른다.
 * 임의로 고른 비교 조건이지 튜닝 값이 아니다 — 바꾸면 다른 것을 재는 것이다.
 * 경도는 리스본에서 남서로 벌어진 뒤 서진을 시작하는 지점으로 잡았다.
 */
const VOLTA_DO_MAR: Scenario = {
  voyageId: 'volta-do-mar',
  routes: [
    { id: 'direct', label: '직항', waypoints: [] },
    { id: 'sw-33', label: '남서 우회 33°N', waypoints: [{ lat: 33, lon: -16 }] },
    { id: 'trade-30', label: '무역풍대 우회 30°N', waypoints: [{ lat: 30, lon: -20 }] },
    { id: 'deep-27', label: '깊은 우회 27°N', waypoints: [{ lat: 27, lon: -24 }] },
  ],
  // 시드를 여럿 도는 이유: 트러블과 바람 잡음이 하루이틀을 흔든다. 한 시드의
  // 결과로 "우회가 1일 빠르다"를 말하면 그 1일이 잡음인지 알 수 없다.
  seeds: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233],
}

export const SCENARIOS: readonly Scenario[] = [VOLTA_DO_MAR]
