import { internal, tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'

/**
 * 보급이 떨어진 날 잃는 선원의 비율. 하루에 한 번, 모자란 몫에 비례해 적용한다.
 *
 * 시뮬은 같은 상황을 피로·규율·병자로 나눠 굴린다. 게임 레이어는 그 사슬을 접고
 * 결과(머릿수)만 남겼다 — 로그라이크의 HP 하나로 읽히게 하려는 것이다 (SPEC-roguelike §11).
 */
const PROVISION_SCALARS = {
  starvationLossRatio: {
    value: 0.02,
    unit: '명/명·일',
    grade: 'qualitative',
    source:
      '물이 있으면 완전 단식으로 46~73일에 죽는다(1981 메이즈 단식). 0.02/일은 중앙값 약 35일로 짧은 쪽 — 항해의 노동·추위·괴혈병 몫으로 둔다. 일정한 비율은 초반에 너무 많이 죽인다 — docs/sources.md',
  },
  thirstLossRatio: {
    value: 0.1,
    unit: '명/명·일',
    grade: 'qualitative',
    source:
      '물 없이 보통 3~4일, 쉬어도 길어야 일주일(Packer 2002, Scientific American). 0.1/일은 중앙값 약 7일로 긴 쪽이다. 0.15면 4~5일 — docs/sources.md',
  },
  provisionPrice: {
    value: 0.4,
    unit: '두카트/인·일',
    grade: 'unverified',
    source:
      "감으로 정함 — 사료와 크게 어긋난다. 1493년 비스카야 함대 계약 'doce maravedís una persona cada dia'(Navarrete t. II, Núm. LV) = 0.032두카트, 마젤란 1519 장부로 약 0.024. 이 값을 바꾸면 경제의 크기가 함께 바뀌어(화물이 밀어내는 보급의 값, R53) 품목 값과 같이 다시 맞추기로 보류했다. 시뮬(`world.ts`)의 단가도 같은 값이다 — docs/sources.md",
  },
  hireWage: {
    value: 11,
    unit: '두카트/명',
    grade: 'qualitative',
    source:
      '1492년 팔로스 왕명의 넉 달 선급(Navarrete, Colección t. II, Núm. VII — 임금률은 없다) × 선원 월급 1,000마라베디(Gould의 2차 재구성에서 추론) = 10.7두카트, 계산값. 같은 무렵의 다른 선급은 비스카야 1493년 5.3, 마젤란 1519년 평균 13.0 — 값은 그 범위 안에서 정했다 — docs/sources.md',
  },
  hireHours: internal(
    12,
    '시간',
    '항구에서 선원을 정원까지 모으는 데 쓰는 시간. 게임 속도 값 — 고용이 공짜 행동이 되지 않게 한다',
  ),
} as const satisfies Record<string, Tuned>

export const PROVISION_TABLES = [PROVISION_SCALARS] as const
export const PROVISION = tunedValues(PROVISION_SCALARS)
