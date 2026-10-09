import type { EncounterKindId } from '../../content/game/game-content.types'
import type { Cargo } from '../supplies/supplies.types'

/** 한 합의 결과. 양쪽이 동시에 잃는다 — 백병전은 일방적이지 않다. */
export type CombatEvent =
  | {
      type: 'combat'
      encounterId: string
      kind: EncounterKindId
      /** 플레이어가 먼저 들이받았는가. */
      initiated: boolean
      crewLost: number
      hullLost: number
      foeLost: number
      foeLeft: number
    }
  | { type: 'defeated'; encounterId: string; kind: EncounterKindId }
  /**
   * 조우가 무너져 물러났다. 격자에서 사라지는 것은 쓰러뜨린 것과 같다 (R76).
   *
   * `lost`는 뭍의 추격에서 더 잃은 머릿수고, 그중 `captured`가 원정이 잡은 포로다. 바다에서는 둘 다 0이다.
   */
  | {
      type: 'routed'
      encounterId: string
      kind: EncounterKindId
      fled: number
      lost: number
      captured: number
    }
  /**
   * 플레이어 무리가 무너졌다 (R76). 상대는 포로와 짐을 끌고 떠난다.
   *
   * 뭍에서는 추격에서 `lost`를 잃고 그중 `captured`가 잡혀 간다. 바다(`atSea`)에서는 배를 빼앗겨 원정이 끝난다.
   */
  | {
      type: 'broken'
      encounterId: string
      kind: EncounterKindId
      atSea: boolean
      lost: number
      captured: number
    }
  /** 물러나거나 쓰러진 사람 무리에게서 거둔 금화 (R64). */
  | { type: 'plunder'; encounterId: string; kind: EncounterKindId; gold: number }
  /** 추격에서 잡은 포로를 중개인을 거쳐 그 자리에서 몸값을 받고 풀어 줬다 (R81). */
  | {
      type: 'captives-ransomed'
      encounterId: string
      kind: EncounterKindId
      captives: number
      gold: number
    }

/** 몸값으로 실제로 낸 것. 금화가 먼저고, 모자란 몫을 화물이 채운다 (R63). */
export interface Ransom {
  gold: number
  cargo: Cargo
}
