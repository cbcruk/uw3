import type { Season } from '../calendar/calendar.types'
import type { ExplorationState } from '../fog/fog-of-war.types'
import type { LatLon } from '../geo/geo.types'
import type { TileMap } from '../map/tile-map.types'
import type { Rng } from '../rng/rng.types'
import type { MastSail, ShipClass } from '../ship/ship.types'
import type { Wind } from '../wind/wind.types'
import type { Current } from '../current/current.types'

/**
 * 조타 방식. 3편의 조작은 침로만 지정하고 배가 계속 그 방향으로 가는 것이다.
 * 해안을 읽고 우회로를 잡는 판단은 플레이어 몫이다 (SPEC 2 — 알아도 도달하기 어렵다).
 * 자동은 이미 아는 바다를 되짚을 때를 위한 선택지일 뿐 기본이 아니다.
 */
export type SteeringMode = 'manual' | 'auto'

/** SPEC 8.3 항해 상태 벡터. 트러블 확률과 종료 조건이 전부 여기서 파생된다. */
export interface VoyageState {
  position: LatLon
  day: number
  headingDeg: number
  steering: SteeringMode
  /** 자동 조타에서 항해사에게 맡긴 목적지. */
  destination: LatLon | null
  sailsSet: boolean[]
  rig: MastSail[]
  food: number
  water: number
  timber: number
  ammo: number
  crew: number
  sick: number
  fatigue: number
  discipline: number
  hull: number
  hullMax: number
  anchored: boolean
  atPortId: string | null
  /** 출항한 항구. 그 입항 반경을 실제로 벗어나기 전까지 재입항 후보에서 제외한다. */
  departedPortId: string | null
  daysAtSea: number
}

export interface PortAnchorage {
  id: string
  lat: number
  lon: number
}

export interface VoyageContext {
  tileMap: TileMap
  routeMap: TileMap
  exploration: ExplorationState
  shipClass: ShipClass
  rng: Rng
  ports: readonly PortAnchorage[]
  dockingRangeNm: number
}

export type HazardKind = 'storm' | 'disease' | 'calm' | 'unrest' | 'wreck' | 'pirate'

export interface HazardContext {
  state: VoyageState
  wind: Wind
  season: Season
  tileMap: TileMap
  shipClass: ShipClass
  rng: Rng
}

export interface HazardDefinition {
  id: string
  name: string
  kind: HazardKind
  baseWeight: number
  /** 0..1. 상태 벡터에서 파생된 발생 압력. 순수 주사위 금지 (SPEC 4.2). */
  pressure(context: HazardContext): number
  /** 압력이 임계를 넘으면 부관이 미리 알린다 (SPEC 4.2 텔레그래프). */
  warning: string
  warningThreshold: number
  /** 자원을 깎아 항해 계획의 재조정을 강제한다. 즉사 금지 (SPEC 4.2). */
  apply(context: HazardContext): string
}

export interface DayReport {
  day: number
  /** 그 날 항해를 마친 위치. 항적 기록에 쓴다. */
  position: LatLon
  wind: Wind
  current: Current
  /** 해류를 더한 실제 진행 방위. 침로와 다를 수 있다. */
  trackDeg: number
  speedKnots: number
  distanceNm: number
  blockedByLand: boolean
  dockedPortId: string | null
  revealedTiles: number
  hazardId: string | null
  logs: string[]
  warnings: string[]
  ended: VoyageEnd | null
}

export type VoyageEnd = 'crew-lost' | 'hull-lost'
