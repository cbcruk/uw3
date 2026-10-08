import { tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'

/**
 * 탈것의 하루 행정 (해리/일). 지형별로 다르다.
 *
 * 게임 레이어의 값이지만 **사료로 확인할 수 있는 값이다.** 대상(隊商)의 하루 행정은
 * 여행기·상업 기록에 남아 있다. 그래서 `not-applicable`로 두지 않는다 (SPEC-roguelike §4).
 */
const MOUNT_SCALARS = {
  horseGrassland: {
    value: 25,
    unit: '해리/일',
    grade: 'unverified',
    source: '감으로 정함 (약 46km). 짐을 실은 말의 장거리 하루 행정 사료 필요',
  },
  horseDesert: {
    value: 10,
    unit: '해리/일',
    grade: 'unverified',
    source: '감으로 정함. 물이 말을 묶는다는 방향만 둔 값. 사막 횡단 기병 기록 필요',
  },
  camelGrassland: {
    value: 18,
    unit: '해리/일',
    grade: 'unverified',
    source: '감으로 정함. 낙타가 초지에서 말보다 느리다는 방향만 둔 값. 사료 필요',
  },
  camelDesert: {
    value: 20,
    unit: '해리/일',
    grade: 'unverified',
    source: '감으로 정함 (약 37km). 사하라·아라비아 대상의 하루 행정 기록 필요',
  },
} as const satisfies Record<string, Tuned>

export const MOUNT_TABLES = [MOUNT_SCALARS] as const
export const MOUNT = tunedValues(MOUNT_SCALARS)
