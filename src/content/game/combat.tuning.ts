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
  playerLethality: guess(
    0.1,
    '명/명·합',
    '무장한 상선 선원. 해적보다 조금 약하다는 방향만 둔 값. 승선전 기록은 공격 측 사망자를 세지 않았고, 뭍의 기마전은 몇 시간에 0–1명이라 한 값으로 맞지 않는다 — 구조가 먼저다(#36)',
  ),
  pirateLethality: guess(
    0.12,
    '명/명·합',
    '싸움이 일인 무리라 선원보다 조금 세다는 방향만 둔 값. Centurion호(1591)는 48명이 갤리 다섯 척과 5시간 반을 싸워 4명을 잃었다(갤리 쪽 머릿수는 소책자가 갤리당 500~600명이라 과장하고, 150명은 추정이다) — 지금 모델은 같은 조건에서 두 합에 35명을 잃는다. 값이 아니라 구조(한 번에 붙을 수 있는 인원)의 문제다 — docs/sources.md',
  ),
  banditLethality: guess(
    0.1,
    '명/명·합',
    '기마 약탈대. 선원과 비슷하다는 방향만 둔 값. 아르실라 연대기(1508–50)의 기마전은 몇 시간 투창에 0–1명, 손실 대부분은 무너진 뒤 추격에서 났다 — 0.1은 너무 세고 모양이 다르다(#36)',
  ),
  beastLethality: guess(
    0.06,
    '명/명·합',
    '늑대는 사람을 잘 죽이지 못한다는 방향만 둔 값. 레오 아프리카누스의 마그레브 "늑대"는 자칼이었고(1896 편자 주) 무장한 일행이 짐승에게 죽은 기록을 찾지 못했다',
  ),
  pirateHullDamage: {
    value: 0.1,
    unit: '점/명·합',
    grade: 'unverified',
    source:
      '감으로 정함. 해적 한 명이 한 합에 깎는 선체. 승원 수에 비례하는 피해의 근거가 없다 — Centurion호(1591)의 피해는 스페인 갤리의 포에서 왔다. 나포 기록의 선체 피해 필요 — docs/sources.md',
  },
  routRatio: {
    value: 0.5,
    unit: '남은/처음 머릿수',
    grade: 'unverified',
    source:
      '감으로 정함. 해적·도적은 이익을 노리지 죽으러 오지 않는다는 방향만 둔 값. 사료는 더 일찍 무너진다고 말한다 — 아르실라 기마전 여섯 건이 10–20% 손실에, Cinco Chagas(1594) 승선대는 10% 안 되는 손실에 물러났다. 계기는 손실보다 지휘관의 죽음·매복·선체 손상이었다. 0.8로만 바꾸면 해적이 위협이 아니게 되어 구조와 함께 정한다(#36) — docs/sources.md',
  },
  tributeDays: guess(
    10,
    '일/명',
    '짐승 무리에게 내주는 식량 일수(한 마리당). 사람 무리는 금화로 받는다(tributeGold). 늑대가 먹고 물러나는 양의 방향만 둔 값',
  ),
  tributeGold: guess(
    15,
    '두카트/명',
    '해적·도적 한 명당 내주는 몸값. 모자라면 화물을 기준값으로 쳐서 채운다. 해적 60명이 출항 금화(1,000) 안에 들도록 둔 값. 배 위에서 몸값을 치르고 놓여나는 관행은 확인했으나(Lambert 2023) 금액 기록이 없다 — 해적의 몸값·통행세 기록 필요',
  ),
  plunderGold: guess(
    10,
    '두카트/명',
    '물리친 해적·도적의 처음 머릿수 한 명당 거두는 노획. 약탈대가 지닌 금품을 뭉뚱그린 값. 사로잡은 해적을 노예로 팔면 한 명 약 75–100두카트(나폴리 1575·1585 갤리 노예 평가, Filioli Uranio 2020)이지만 사로잡는 비율이 가정이라 쓰지 않았다 — 나포 기록의 노획액 필요',
  ),
  boardingFrontage: guess(
    12,
    '명',
    '배와 배가 맞붙을 때 한 합에 싸우는 한쪽의 머릿수 상한. 뱃전이 좁아 나머지는 뒤에 선다. Centurion호(1591) 48명이 갤리(약 150명, 추정)와 세 합에 4명을 잃은 기록에 지금의 살상률로 맞춘 값이라 따로 근거를 댈 수 없다. 승선전 기록의 교전 폭 필요',
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
