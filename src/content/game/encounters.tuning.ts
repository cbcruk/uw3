import { internal, tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'
import type { EncounterKindId } from './game-content.types'

/**
 * 조우 밀도 — 그 종류가 나올 수 있는 칸 천 개당 몇 무리인가.
 *
 * 세계 어디서나 같은 값이다. 실제 해적은 바르바리 해안·말라카 해협처럼 몰려 있었으므로
 * 지역별 밀도는 사료로 확인할 수 있는 구조다 — 그때는 이 표가 아니라 구역 표가 생긴다 (Shape 변경).
 * 지금 값은 영역 한 장(2,400칸)에 두세 무리가 보이도록 맞춘 체감 값이다.
 */
const ENCOUNTER_SCALARS = {
  pirate: internal(
    1.25,
    '무리/천 칸',
    '게임 체감 값. 바다만 있는 영역에 약 3척. 지역별 밀도가 아니다',
  ),
  bandit: internal(0.8, '무리/천 칸', '게임 체감 값. 뭍만 있는 영역에 약 2무리'),
  beast: internal(0.6, '무리/천 칸', '게임 체감 값. 초지만 있는 영역에 1~2무리'),
} as const satisfies Record<EncounterKindId, Tuned>

export const ENCOUNTER_TABLES = [ENCOUNTER_SCALARS] as const
export const ENCOUNTER_DENSITY = tunedValues(ENCOUNTER_SCALARS)
