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
    value: 0.016,
    unit: '두카트/단위',
    grade: 'measured',
    source:
      "1493년 비스카야 함대 계약: 'un ducado cada mes ... que sale á doce maravedís una persona cada dia'(Navarrete, Colección t. II, Núm. LV, p. 93) — 한 사람 하루 12마라베디 = 0.032두카트(문서의 환산 360으로는 0.033). 연안 함대 병사가 현물 대신 받던 식비 수당이다. 총액은 사료의 값이고, 식량·물 두 단위로 반씩 나눈 것은 게임의 가정이다(물 자체는 공짜였고 통이 마젤란 보급비의 약 25%) — docs/sources.md",
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
