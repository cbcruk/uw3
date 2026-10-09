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
  pirateLethality: guess(
    0.12,
    '명/명·합',
    '싸움이 일인 무리라 선원보다 조금 세다는 방향만 둔 값. Centurion호(1591)는 48명이 갤리 다섯 척(약 150명)과 5시간 반을 싸워 4명을 잃었다 — 지금 모델은 같은 조건에서 두 합에 35명을 잃는다. 값이 아니라 구조(한 번에 붙을 수 있는 인원)의 문제다 — docs/sources.md',
  ),
  banditLethality: guess(0.1, '명/명·합', '기마 약탈대. 선원과 비슷하다는 방향만 둔 값'),
  beastLethality: guess(0.06, '명/명·합', '늑대는 사람을 잘 죽이지 못한다는 방향만 둔 값'),
  pirateHullDamage: {
    value: 0.1,
    unit: '점/명·합',
    grade: 'qualitative',
    source:
      'Centurion호(1591, 런던 소책자): 갤리 다섯 척과 5시간 반 — 돛대·돛이 크게 상했으나 배는 돌아왔다. 피해는 승원 수가 아니라 갤리의 포에서 왔고, 해적은 나포할 배를 부수지 않으려 했다는 방향만 댄다. 값은 저작 — docs/sources.md',
  },
  routRatio: {
    value: 0.5,
    unit: '남은/처음 머릿수',
    grade: 'qualitative',
    source:
      '미 육군 FM 105-5(1964, Dupuy Institute 경유): 공격 측은 약 20% 손실에서 멈추고 방어 측은 약 40%에서 무너진다 — 남은 비로 0.8·0.6. 2차대전 대대 자료라 근거가 약하다. 0.5는 그보다 끈질긴 쪽으로 저작했다 — docs/sources.md',
  },
  tributeDays: guess(
    10,
    '일/명',
    '짐승 무리에게 내주는 식량 일수(한 마리당). 사람 무리는 금화로 받는다(tributeGold). 늑대가 먹고 물러나는 양의 방향만 둔 값',
  ),
  tributeGold: guess(
    15,
    '두카트/명',
    '해적·도적 한 명당 내주는 몸값. 모자라면 화물을 기준값으로 쳐서 채운다. 해적 60명이 출항 금화(1,000) 안에 들도록 둔 값. 해적의 몸값·통행세 기록 필요',
  ),
  plunderGold: guess(
    10,
    '두카트/명',
    '물리친 해적·도적의 처음 머릿수 한 명당 거두는 노획. 약탈대가 지닌 금품을 뭉뚱그린 값. 나포 기록의 노획액 필요',
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
