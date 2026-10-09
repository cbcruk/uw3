import { tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'

/** 조선소의 선체 수리 (SPEC-roguelike §37, R84). */
const REPAIR_SCALARS = {
  repairGoldPerPoint: {
    value: 2.5,
    unit: '두카트/점',
    grade: 'unverified',
    source:
      '감으로 정함. 선체 한 점을 고치는 값. 선체 점수는 추상이라 배 값에 견줘 정했다 — 마젤란 함대(1519)는 다섯 척 480토넬을 약 3,510두카트(토넬당 약 7.3)에 사서, 끌어올리기·목수·뱃밥꾼·목재에 그 33%, 못·뱃밥·역청까지 합치면 58%(예비품 포함)를 들였다(Navarrete t. IV, Núm. XVII, pp. 162–166). 이 값이면 바닥에서 가득까지 고치는 데 배 값의 약 31–51%가 든다(라틴 225, 혼합 300, 나우 500두카트). 두 해 원정 전의 큰 정비이지 전투 손상의 수리가 아니다 — 손상 수리 비용의 기록 필요 — docs/research/2026-10-09/repair.md',
  },
  repairHoursPerPoint: {
    value: 1,
    unit: '시간/점',
    grade: 'unverified',
    source:
      '감으로 정함. 선체 한 점을 고치는 시간. 가득 고치면 라틴 약 4일, 나우 약 8일이다. 사료는 최악의 상한만 준다 — 핀타호(1492)는 조선소 없는 그란 카나리아에서 키와 누수를 고치고 돛을 바꾸는 데 24일 안쪽, 트리니다드호(1521–22)는 티도레에서 용골 누수에 석 달. 손상의 양에 따른 날수 기록 필요 — docs/research/2026-10-09/repair.md',
  },
} as const satisfies Record<string, Tuned>

export const REPAIR_TABLES = [REPAIR_SCALARS] as const
export const REPAIR = tunedValues(REPAIR_SCALARS)
