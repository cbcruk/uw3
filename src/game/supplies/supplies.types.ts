import type { GoodId } from '../../content/game/game-content.types'

/** 화물칸. 품목마다 실은 톤 수다. 없는 품목은 키가 없다. */
export type Cargo = Partial<Record<GoodId, number>>

/** 먹고 마시는 무리 하나. 배의 보급과 뭍 무리(§26)가 같은 규칙으로 줄어든다. */
export interface Provisioned {
  crew: number
  food: number
  water: number
}

/**
 * 원정이 잃을 수 있는 것. 시뮬의 `VoyageState`에서 넷만 남겼고, 교역(§19)이 금화와 화물을 더했다.
 *
 * 식량·물의 단위는 시뮬과 같다 — 1 = 한 사람의 하루치.
 */
export interface Supplies extends Provisioned {
  hull: number
  hullMax: number
  /** 화물이 없을 때 식량·물 각각을 채울 수 있는 상한. 배의 적재량에서 정해진다. */
  capacity: number
  /** 배의 적재량(톤). 화물과 식량·물이 이것을 나눠 쓴다 (R53). */
  holdTons: number
  gold: number
  cargo: Cargo
}

/** 항구에서 식량·물을 맞춘 결과. 모두 바뀐 양이다 — 되팔았으면 식량·물이 음수, 금화가 양수다. */
export interface ProvisionSettlement {
  food: number
  water: number
  gold: number
  /** 금화가 모자라 상한까지 못 채웠는가. */
  short: boolean
}

/**
 * 원정이 끝난 이유. `arrived`만 성공이다 — 계약한 목표 항구에 배로 들어왔다.
 * `surrendered`는 배·화물·금화를 넘기고 선원만 산 끝이다 (R65). `captured`는 싸우다 무너져 배를 빼앗긴 끝이다 (R76).
 */
export type ExpeditionEnd = 'arrived' | 'crew-lost' | 'hull-lost' | 'surrendered' | 'captured'

/** 하루치 소모의 결과. 화면 로그가 쓴다. */
export interface RationReport {
  /** 뭍 무리의 일이면 참, 배(지킴이)의 일이면 거짓. */
  ashore: boolean
  lost: number
  starving: boolean
  thirsty: boolean
}
