import type { EncounterKindId } from '../../content/game/game-content.types'
import type { CombatEvent } from '../combat/combat.types'
import type { Encounter } from './encounter.types'
import type { ShipClass } from '../../sim/ship/ship.types'
import type { Cell, WorldGrid } from '../grid/world-grid.types'
import type { Conveyance } from '../travel/travel.types'

/**
 * 조우가 한 차례 움직이는 데 필요한 바깥 상태. 런 전체를 넘기지 않으려고 따로 둔다.
 *
 * `E`는 한 합이 낼 수 있는 사건이다. 런은 전투 사건에 원정의 끝을 더해 넘긴다.
 */
export interface PursuitContext<E = CombatEvent> {
  grid: WorldGrid
  /**
   * 쫓기는 쪽(플레이어)의 칸과 탈것, 그리고 싸울 무리의 머릿수. 탈것은 시야가 아니라 조우가 볼 대상일 뿐이다.
   * 머릿수를 모르면 사람 무리도 모두 덤빈다 — 우세를 따지지 않는다 (R80).
   */
  target: { cell: Cell; conveyance: Conveyance; crew?: number }
  /** 플레이어의 명령이 시작된 시각. 쫓지 않던 조우는 이 시각부터 깨어난다. */
  startHours: number
  /** 플레이어의 명령이 끝난 시각. 조우는 이 시각까지 따라잡는다. */
  nowHours: number
  /** 출발 후 시간을 바람 표의 날 번호로. */
  dayNumberAt(hours: number): number
  /** 선형이 없는 종류에 넘길 자리 채움. 뭍의 이동은 선형을 읽지 않는다. */
  fallbackShip: ShipClass
  /**
   * 붙은 조우가 차례를 맞으면 한 합을 치른다. 걸린 시간과 결과를 돌려주고,
   * 플레이어 쪽 원정이 끝났으면 `null`이다 — 그때 모든 조우가 멈춘다.
   * 없으면 붙은 조우는 그대로 멈춰 선다.
   */
  engage?: (foe: Encounter) => { hours: number; events: E[] } | null
}

/** 조우의 한 차례 결과. 이벤트로 바뀌어 런 로그에 실린다. */
export type PursuitEvent =
  | { type: 'chase'; encounterId: string; kind: EncounterKindId }
  | { type: 'engaged'; encounterId: string; kind: EncounterKindId }
  | { type: 'evaded'; encounterId: string; kind: EncounterKindId }
  | { type: 'encounter-move'; encounterId: string; from: Cell; to: Cell; hours: number }
  | CombatEvent
