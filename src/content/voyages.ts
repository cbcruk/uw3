import type { HistoricalVoyage } from '../sim/voyage/logbook.types'

/**
 * 재현 대상 항해. 목표·경로·정답이 사료에서 나온다 (SPEC 2).
 *
 * **출처 표기 규칙**: 소요 일수를 사료로 확인하지 못했으면 `days: null`로 두고
 * `source`에 무엇을 확인해야 하는지 적는다. 그럴듯한 숫자를 채워 넣으면
 * 대조 자체가 거짓이 된다 — 이 프로젝트의 성공 기준이 충실도이므로 (SPEC 3)
 * 검증되지 않은 기준선은 없느니만 못하다.
 */
export const HISTORICAL_VOYAGES: readonly HistoricalVoyage[] = [
  {
    id: 'volta-do-mar',
    name: '볼타 두 마르',
    summary: '리스본에서 아조레스로. 편서풍을 정면으로 받는 서진이다.',
    lesson:
      '직항은 편서풍을 거스른다. 포르투갈 항해사들은 남쪽 무역풍대로 내려가 서진한 뒤 북상했다.',
    startPortId: 'lisboa',
    endPortId: 'angra',
    departure: { year: 1502, month: 3, day: 14 },
    reference: {
      days: null,
      source: '미확인. 15세기 리스본–아조레스 구간의 항해일지 소요 일수를 찾아야 한다.',
    },
  },
]

export function findVoyage(id: string): HistoricalVoyage | undefined {
  return HISTORICAL_VOYAGES.find((voyage) => voyage.id === id)
}
