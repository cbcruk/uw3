import type { GameDate } from '../../sim/calendar/calendar.types'
import type { ExpeditionEnd } from '../supplies/supplies.types'
import type { RunConfig } from '../run/run.types'
import type { LanguageDocks } from '../fame/fame.types'

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
  /** 이 원정이 번 명성. 메타에 더할 때 붙는다 — 교역·명성(§20) 전의 기록에는 없다. */
  fame?: number
  /** 끝났을 때의 금화. 교역(§19) 전의 기록에는 없다. 화물은 값을 매기지 않는다 — 판 것만 센다. */
  gold?: number
}

/**
 * 원정이 끝나도 남는 것 (§0 로그라이트). 배·화물·선원·금화는 여기 없다 (R42·R56).
 *
 * 런 도중에는 읽기만 한다. 갱신은 끝난 런의 기록에서만 일어난다.
 */
export interface MetaState {
  version: 2
  /** 배로 들어가 본 항구. 다음 자유 원정에서 그 둘레가 처음부터 보인다. */
  knownPortIds: string[]
  /** 들어가 본 영역. 지금은 기록용이다. */
  visitedRegions: string[]
  records: RunRecord[]
  /** 끝난 원정이 번 명성의 합. 출항 금화의 후원금이 된다 (§20). */
  fame: number
  /** 말마다 그 말을 쓰는 항구에 들른 횟수. 문턱을 넘은 말을 배운 것으로 친다. */
  languageDocks: LanguageDocks
}

/** 명성·어학(§20) 전의 메타. 읽을 때 2로 올린다. */
export interface MetaStateV1 {
  version: 1
  knownPortIds: string[]
  visitedRegions: string[]
  records: RunRecord[]
}
