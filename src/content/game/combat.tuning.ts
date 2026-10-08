import { internal, tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'

const guess = (value: number, unit: string, note: string): Tuned => ({
  value,
  unit,
  grade: 'unverified',
  source: `감으로 정함. ${note}`,
})

/**
 * 맞붙은 한 합(合)의 값. 승원 백병전이 기본이고, 해적만 선체를 깎는다 (SPEC-roguelike §14).
 *
 * 살상률은 "한 사람이 한 합에 상대를 몇 명 쓰러뜨리는가"다. 사료와 대조할 대상은 이 값이 아니라
 * 이 값이 만드는 **교전 한 번의 사상자 비율**이다 — 당대 해적 습격 기록의 사상자 수.
 */
const COMBAT_SCALARS = {
  playerLethality: guess(0.1, '명/명·합', '무장한 상선 선원. 해적보다 조금 약하다는 방향만 둔 값'),
  pirateLethality: guess(0.12, '명/명·합', '싸움이 일인 무리라 선원보다 조금 세다는 방향만 둔 값'),
  banditLethality: guess(0.1, '명/명·합', '기마 약탈대. 선원과 비슷하다는 방향만 둔 값'),
  beastLethality: guess(0.06, '명/명·합', '늑대는 사람을 잘 죽이지 못한다는 방향만 둔 값'),
  pirateHullDamage: guess(
    0.1,
    '점/명·합',
    '해적 한 명이 한 합에 깎는 선체. 포격·충각·갈고리를 뭉뚱그린 값',
  ),
  routRatio: {
    value: 0.5,
    unit: '남은/처음 머릿수',
    grade: 'unverified',
    source:
      '감으로 정함. 해적·도적은 이익을 노리지 죽으러 오지 않는다 — 절반을 잃으면 물러난다는 방향만 둔 값. 습격 기록의 퇴각 시점 필요',
  },
  tributeDays: guess(
    10,
    '일/명',
    '내주기 한 번에 상대 한 명당 내주는 식량·물 일수. 몸값 흥정의 결과를 뭉뚱그린 값. 해적의 몸값·통행세 기록 필요',
  ),
  noticeRatio: internal(
    0.5,
    '배',
    '조우가 플레이어를 알아채는 거리 ÷ 플레이어 시야. 게임 체감 값 — 망루를 둔 쪽이 먼저 보고 피할 수 있게 한다',
  ),
  roundHours: internal(
    2,
    '시간',
    '한 합에 흐르는 시간. 게임 속도 값 — 기다리기 한 번이 하루를 다 쓰지 않게 한다',
  ),
  rollSpread: internal(0.5, '배', '한 합의 운. 기댓값 둘레 ±이 비율로 흔든다. 모델 내부 분산'),
} as const satisfies Record<string, Tuned>

export const COMBAT_TABLES = [COMBAT_SCALARS] as const
export const COMBAT = tunedValues(COMBAT_SCALARS)
