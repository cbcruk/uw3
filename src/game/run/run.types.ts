import type { GoodId } from '../../content/game/game-content.types'
import type { LanguageId } from '../../content/content.types'
import type { GameDate } from '../../sim/calendar/calendar.types'
import type { ShipClass } from '../../sim/ship/ship.types'
import type { Encounter } from '../encounter/encounter.types'
import type { PursuitEvent } from '../encounter/pursuit.types'
import type { ExploredMap } from '../fog/fog.types'
import type { Direction } from '../grid/direction.types'
import type { Cell, WorldGrid } from '../grid/world-grid.types'
import type { RegionId } from '../region/region.types'
import type { ExpeditionEnd, Supplies } from '../supplies/supplies.types'
import type { EastNorth } from '../travel/drift.types'
import type { Conveyance, Mount } from '../travel/travel.types'

export interface RunConfig {
  seed: number
  startDate: GameDate
  startPortId: string
  shipClassId: string
  /** 계약한 목표 항구. 배로 입항하면 원정이 성공으로 끝난다. 없으면 끝없는 항해다. */
  goalPortId?: string
  /**
   * 메타에서 넘어온 아는 항구. 그 둘레가 처음부터 탐사된 채 시작한다.
   * 메타가 런을 바꾸는 유일한 통로다 — 데일리에서는 비운다 (§0 경계).
   */
  knownPortIds?: readonly string[]
  /** 메타의 명성에서 나온 후원금. 출항 금화에 더한다 (§20). 데일리에서는 0이다. */
  patronGold?: number
  /**
   * 메타에서 배운 말. 원정의 모국어(포르투갈어)는 늘 안다 — 여기에는 그 밖의 말만 둔다.
   * 그 말을 쓰는 항구에서는 통역 없이 거래한다 (R58). 데일리에서는 비운다.
   */
  languages?: readonly LanguageId[]
}

/** 격자 위를 움직이는 것. 원본의 `Actor`에서 전투 상태를 뺀 것이다 (전투는 P3). */
export interface Traveler {
  id: string
  cell: Cell
  conveyance: Conveyance
  /**
   * 마지막으로 움직인 방향. 화면의 뱃머리다 (R18). 막히거나 기다리거나 해류에 밀려도
   * 바뀌지 않는다 — 정박한 배는 마지막에 향하던 쪽을 보고 있다.
   */
  facing: Direction
  /**
   * 칸 중심에서 벗어난 거리(해리). 해류의 옆 성분이 여기 쌓이고, 칸 한 변의 절반을 넘으면
   * 옆 칸으로 밀린다 (R15). 정박·하선하면 0이다.
   */
  driftNm: EastNorth
}

/**
 * 명령 하나 = 한 칸 (R5). 방향키 한 번이 한 칸이다.
 *
 * 시간은 명령마다 고정으로 흐르지 않는다. 그 칸을 지나는 데 걸린 만큼 흐른다 —
 * 순풍의 배는 한 칸에 두 시간, 초지의 말은 반나절이다.
 */
export type Command =
  | { type: 'move'; dir: Direction }
  | { type: 'wait' }
  | { type: 'disembark'; mount: Mount }
  | { type: 'embark' }
  | { type: 'hire' }
  | { type: 'tribute' }
  | { type: 'buy'; goodId: GoodId; tons: number }
  | { type: 'sell'; goodId: GoodId; tons: number }

/**
 * 막힌 이유. 막힌 걸음은 시간을 쓰지 않는다 — 원본에서 벽에 부딪힌 것과 같다.
 * `wind`는 무풍일 때뿐이다. 맞바람은 태킹으로 느리게 갈 뿐 막지 않는다.
 * `current`는 역류가 돛의 전진보다 셀 때다. 조우가 선 칸은 막힘이 아니라 들이받기다 (P3d).
 */
export type BlockReason = 'terrain' | 'edge' | 'wind' | 'current'

/** 코어가 내는 렌더·로그용 이벤트. 렌더러는 이 배열만 소비한다 (원본 `GridEvent`). */
export type RunEvent =
  | { type: 'move'; actorId: string; from: Cell; to: Cell; hours: number }
  | { type: 'blocked'; actorId: string; at: Cell; reason: BlockReason }
  | { type: 'drift'; actorId: string; from: Cell; to: Cell }
  | { type: 'region'; region: RegionId }
  | { type: 'dock'; portId: string }
  | { type: 'disembark'; mount: Mount; portId: string }
  | { type: 'embark'; portId: string }
  | { type: 'rejected'; command: Command['type']; reason: string }
  | { type: 'day-start'; day: number }
  | { type: 'ration'; lost: number; starving: boolean; thirsty: boolean }
  | {
      type: 'resupply'
      portId: string
      /** 바뀐 양. 화물에 밀려 되팔았으면 음수다. */
      food: number
      water: number
      /** 바뀐 금화. 샀으면 음수, 되팔았으면 양수. */
      gold: number
      short: boolean
    }
  | { type: 'hire'; portId: string; hired: number; wage: number }
  | {
      type: 'trade'
      portId: string
      side: 'buy' | 'sell'
      goodId: GoodId
      tons: number
      gold: number
    }
  | {
      type: 'tribute'
      encounterId: string
      kind: Encounter['kind']
      food: number
      water: number
    }
  | { type: 'ended'; reason: ExpeditionEnd }
  | { type: 'sighted'; encounterId: string; kind: Encounter['kind']; crew: number }
  | PursuitEvent

/** 하선 중 항구에 남겨 둔 배. */
export interface Berth {
  portId: string
  cell: Cell
}

export interface RunState {
  config: RunConfig
  grid: WorldGrid
  shipClass: ShipClass
  /** 출발 후 흐른 시간. 날짜는 여기서 파생한다 — 바람은 날마다 바뀐다. */
  elapsedHours: number
  player: Traveler
  /** 이 원정이 잃을 수 있는 것. 죽으면 사라지고 메타로 넘어가지 않는다 (§0 로그라이트). */
  supplies: Supplies
  /** 원정이 끝났으면 그 이유. 끝난 런은 더 이상 명령을 받지 않는다. */
  ended: ExpeditionEnd | null
  /** 출항 때의 선원. 기록에 "몇 명 중 몇 명이 돌아왔나"로 남긴다. */
  crewAtStart: number
  /** 물리친 조우 수. */
  defeated: number
  /** 배로 들어가 본 항구. 메타의 "아는 항구"로 넘어간다. */
  dockedPorts: Set<string>
  berth: Berth | null
  region: RegionId
  /** 한 번이라도 본 칸. 명령 로그에서 파생되므로 재현하면 같아진다 (R8). */
  explored: ExploredMap
  /**
   * 격자 위의 조우. 영역에 처음 들어갈 때 그 영역 몫이 더해진다 (R4).
   * 안개 밖에 있어도 여기 있다 — 보이느냐는 그릴 때 시야로 가른다.
   */
  encounters: Encounter[]
  /** 한 번이라도 시야에 들어온 조우. 처음 보일 때만 알린다. */
  sighted: Set<string>
  /** 들어가 본 영역. 던전에서 내려가 본 층에 해당한다. */
  visitedRegions: Set<string>
  /** `seed + 명령 로그 = 완전 재현` (R8). */
  commands: Command[]
}
