import { internal, tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'

const FAME_IS_GAME = '명성은 게임이 만든 점수라 사료에 대응물이 없다'

/**
 * 명성과 어학 (SPEC-roguelike §20). 둘 다 끝난 원정에서만 메타에 쌓인다 (R39).
 *
 * 명성 점수와 그 환산은 게임 속도 값이다. 통역 수수료만 현실에 대응물이 있다.
 */
const FAME_SCALARS = {
  fameArrived: internal(50, '점', `${FAME_IS_GAME}. 계약을 끝까지 해낸 몫`),
  fameDefeated: internal(10, '점/조우', `${FAME_IS_GAME}. 물리친 조우 하나의 몫`),
  fameDiscovery: internal(20, '점/항구', `${FAME_IS_GAME}. 메타에 없던 항구에 처음 들어간 몫`),
  fameGoldDivisor: internal(
    100,
    '두카트/점',
    `${FAME_IS_GAME}. 도착한 원정의 이익(끝 금화 − 출항 금화)을 점수로 바꾸는 환산`,
  ),
  patronGoldPerFame: internal(
    2,
    '두카트/점',
    `${FAME_IS_GAME}. 명성이 출항 금화에 더하는 후원금의 환산`,
  ),
  patronGoldMax: internal(
    2000,
    '두카트',
    '후원금 상한. 게임 속도 값 — 오래 한 사람의 출항 금화가 끝없이 불지 않게 한다',
  ),
  nauFame: internal(
    300,
    '점',
    `${FAME_IS_GAME}. 자유 원정에서 나우를 고를 수 있게 되는 명성. 나우는 해적 50명도 이긴다(§21)`,
  ),
  languageDocksToLearn: internal(
    3,
    '회',
    '그 말을 쓰는 항구에 들른 횟수(원정마다 항구 하나에 한 번)가 이만큼이면 배운다. 게임 속도 값',
  ),
  interpreterFee: {
    value: 0.1,
    unit: '비',
    grade: 'unverified',
    source:
      '감으로 정함. 말을 모르는 항구에서 중개인·통역에게 떼이는 몫. 세비야 중개인 수수료는 거래 양쪽에 0.5%씩, 합 약 1%(1528년 왕실 평의회, García Ulecia p. 164) — 0.1은 관세까지 얹은 값이어야 맞는다. 마그레브 항구 관세 기록 필요 — docs/sources.md',
  },
} as const satisfies Record<string, Tuned>

export const FAME_TABLES = [FAME_SCALARS] as const
export const FAME = tunedValues(FAME_SCALARS)
