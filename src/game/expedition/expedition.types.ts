import type { GameDate } from '../../sim/calendar/calendar.types'
import type { ExpeditionEnd } from '../supplies/supplies.types'
import type { RunConfig } from '../run/run.types'

/** 원정 하나의 계약. 어디서 떠나 어디로 가는가. */
export interface Contract {
  startPortId: string
  goalPortId: string
  startDate: GameDate
}

/** 끝난 원정 하나의 기록. 리더보드와 메타가 이것만 읽는다. */
export interface RunRecord {
  config: RunConfig
  /** 데일리면 그 날짜 키(`YYYY-MM-DD`), 자유 원정이면 `null`. */
  daily: string | null
  outcome: ExpeditionEnd
  days: number
  crewAtStart: number
  crewLeft: number
  defeated: number
  regions: number
  /** 끝났을 때의 금화. 교역(§19) 전의 기록에는 없다. 화물은 값을 매기지 않는다 — 판 것만 센다. */
  gold?: number
}

/**
 * 원정이 끝나도 남는 것 (§0 로그라이트). 배·화물·선원·금화는 여기 없다 (R42·R56).
 *
 * 런 도중에는 읽기만 한다. 갱신은 끝난 런의 기록에서만 일어난다.
 */
export interface MetaState {
  version: 1
  /** 배로 들어가 본 항구. 다음 자유 원정에서 그 둘레가 처음부터 보인다. */
  knownPortIds: string[]
  /** 들어가 본 영역. 지금은 기록용이다. */
  visitedRegions: string[]
  records: RunRecord[]
}
