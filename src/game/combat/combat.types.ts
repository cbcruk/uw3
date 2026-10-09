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
  /** 절반을 잃고 물러났다. 격자에서 사라지는 것은 쓰러뜨린 것과 같다. */
  | { type: 'routed'; encounterId: string; kind: EncounterKindId; fled: number }
  /** 물러나거나 쓰러진 사람 무리에게서 거둔 금화 (R64). */
  | { type: 'plunder'; encounterId: string; kind: EncounterKindId; gold: number }

/** 몸값으로 실제로 낸 것. 금화가 먼저고, 모자란 몫을 화물이 채운다 (R63). */
export interface Ransom {
  gold: number
  cargo: Cargo
}
