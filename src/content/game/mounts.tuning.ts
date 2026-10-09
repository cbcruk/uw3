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

/**
 * 뭍의 하루 물 소모 배율. 바다·초지는 1이다 — 한 사람의 하루치가 1인 시뮬의 단위를 그대로 쓴다.
 *
 * 사막에서는 사람도 더 마시고 탈것도 마신다. 그 몫을 원정의 물에서 함께 떠낸다 — 탈것의 물을
 * 따로 세지 않는다. 낙타가 덜 드는 것은 낙타가 거의 마시지 않기 때문이다 (SPEC-roguelike §25).
 */
const MOUNT_WATER_SCALARS = {
  horseDesertWater: {
    value: 3,
    unit: '배',
    grade: 'unverified',
    source:
      '감으로 정함. 사막의 말은 사람보다 몇 배를 마셔 물이 원정을 묶는다는 방향만 둔 값. 사막 기병·대상의 물 소비 기록 필요',
  },
  camelDesertWater: {
    value: 1.5,
    unit: '배',
    grade: 'unverified',
    source:
      '감으로 정함. 낙타는 며칠씩 마시지 않고 사람만 더위에 더 마신다는 방향만 둔 값. 사하라 대상의 물 부대 기록 필요',
  },
} as const satisfies Record<string, Tuned>

export const MOUNT_TABLES = [MOUNT_SCALARS, MOUNT_WATER_SCALARS] as const
export const MOUNT = tunedValues(MOUNT_SCALARS)
export const MOUNT_WATER = tunedValues(MOUNT_WATER_SCALARS)
