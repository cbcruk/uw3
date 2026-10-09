import { tunedValues } from './tuning'
import type { Tuned } from './tuning.types'

/**
 * 배에 싣는 식량·물과 항구 보급의 값. 시뮬과 게임 레이어가 함께 쓴다 (`supplyCapacity`).
 *
 * 단위는 한 사람의 하루치(인일)다 — 선원 한 명이 하루에 식량 한 단위, 물 한 단위를 먹는다.
 */
const SUPPLY_SCALARS = {
  supplyPerTon: {
    value: 18,
    unit: '인일/톤',
    grade: 'unverified',
    source:
      '감으로 정함. 배의 적재량 한 톤마다 식량과 물을 각각 이만큼 싣는다. 마젤란 함대(1519)는 다섯 척 480토넬에 237명의 비스킷·포도주를 약 756일치 실었다 — 식량만 한 토넬에 약 370인일로 이 값(식량과 물을 각각 센다)의 20배쯤이다(Navarrete t. IV, Núm. XVII–XVIII; docs/research/2026-10-09/provisions.md). 다만 그것은 두 해를 내다본 원정이고, 물 통도 실었으나 몇 날치인지는 사료에 없다. 토넬과 톤의 환산은 미확인이다. 설계 가정으로 둔다(#53) — 혼합 카라벨 32명이 약 50일을 버티는 크기라 근해 원정에서 보급이 긴장이 되고, 화물이 보급을 밀어내는 대가(R53)·고용(§16)·사막의 물(§25)이 이 크기에 서 있다. 사료대로면 수백 일이라 보급이 긴장을 만들지 못한다 — 근해 항해의 적재 기록 필요',
  },
  resupplyCostPerUnit: {
    value: 0.4,
    unit: '두카트/단위',
    grade: 'unverified',
    source:
      '감으로 정함. 시뮬의 항구 보급에서 모자란 식량·물·목재 한 단위의 값. 선체 수리는 공짜로 따라온다. 게임 레이어의 provisionPrice(0.016, measured — 1493 비스카야 계약)는 식량·물 인일만 센 값이라 목재·수리를 섞어 받는 이 값에 그대로 쓸 수 없다. 사료의 식량·물 값으로만 보면 단위마다 약 25배 비싸다(provisions.md §3) — 목재와 수리 비용의 기록 필요',
  },
} as const satisfies Record<string, Tuned>

export const SUPPLY_TABLES = [SUPPLY_SCALARS] as const
export const SUPPLY = tunedValues(SUPPLY_SCALARS)
