import { internal, tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'
import type { EncounterKindId } from './game-content.types'

/**
 * 조우 밀도 — 그 종류가 나올 수 있는 칸 천 개당 몇 무리인가.
 *
 * 구역 밖의 바탕값이다. 실제 해적은 바르바리 해안·말라카 해협처럼 몰려 있었으므로 구역마다
 * 이 값에 배율을 곱한다 (`encounter-zones.ts`, SPEC-roguelike §24).
 * 바탕값은 영역 한 장(2,400칸)에 두세 무리가 보이도록 맞춘 체감 값이다.
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

const ZONE_FACTOR_NOTE = '방향은 자료에 있으나 배율 값은 저작했다'

/**
 * 구역의 밀도 배율. 구역이 어디에 있는지는 `encounter-zones.ts`가, 얼마나 짙은지는 여기서 정한다.
 *
 * 배율의 **방향**(바르바리 해안은 짙고 대서양 한가운데는 옅다)은 사료가 말하는 것이라 `qualitative`다.
 * 값 자체는 영역 하나에서 차이가 눈에 보이도록 저작했다.
 */
const ENCOUNTER_ZONE_SCALARS = {
  barbaryPirates: {
    value: 3,
    unit: '배',
    grade: 'qualitative',
    source:
      `바르바리 해안은 15세기 말부터 북아프리카 사략선의 본거지였다(케말 레이스 1490년대, 오루치 레이스 1504~). ${ZONE_FACTOR_NOTE}. ` +
      '1500년 전후 서지중해 나포 건수 기록이 있으면 measured로 올릴 수 있다',
  },
  openAtlanticPirates: {
    value: 0.25,
    unit: '배',
    grade: 'qualitative',
    source: `해적은 항로가 모이는 해안·해협·섬 앞에 몰렸다. 망망대해에서는 배를 찾을 수 없다. ${ZONE_FACTOR_NOTE}`,
  },
  malaccaPirates: {
    value: 3,
    unit: '배',
    grade: 'qualitative',
    source: `말라카 해협은 오랑 라우트(바다 사람)의 해상 약탈로 이름난 병목이었다. ${ZONE_FACTOR_NOTE}`,
  },
} as const satisfies Record<string, Tuned>

export const ENCOUNTER_TABLES = [ENCOUNTER_SCALARS, ENCOUNTER_ZONE_SCALARS] as const
export const ENCOUNTER_DENSITY = tunedValues(ENCOUNTER_SCALARS)
export const ENCOUNTER_ZONE_FACTOR = tunedValues(ENCOUNTER_ZONE_SCALARS)
