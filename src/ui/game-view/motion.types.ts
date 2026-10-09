import type { EncounterKindId } from '../../content/game/game-content.types'
import type { RegionId } from '../../game/region/region.types'

/** 칸 좌표. 연출 중에는 칸 사이의 소수 자리에 있다. */
export interface Point {
  x: number
  y: number
}

/** 명령을 적용하기 직전의 위치. 연출의 출발점이다. */
export interface Snapshot {
  region: RegionId
  player: Point
  /** 조우 id마다 칸. 명령 중에 사라진 조우도 여기에는 있다. */
  encounters: ReadonlyMap<string, Point>
  /** 조우 id마다 종류. 사라진 조우를 흐리게 그릴 때 쓴다. */
  kinds: ReadonlyMap<string, EncounterKindId>
}

/** 명령 중에 사라진 조우 하나. 있던 칸에서 흐려지며 가라앉는다. */
export interface Vanishing {
  kind: EncounterKindId
  at: Point
}

/** 영역이 바뀌었을 때 밀어내는 방향. 나간 쪽으로 옛 영역이 밀려난다. */
export interface Slide {
  from: RegionId
  /** -1·0·1. 경도가 한 바퀴 돈 영역도 가까운 쪽으로 친다. */
  dx: number
  dy: number
}

/** 칸 위로 떠오르는 숫자 한 개. 전투의 손실을 보여 준다. */
export interface Floater {
  /** 띄울 칸. 플레이어 칸이면 미끄러지는 배를 따라간다(`onPlayer`). */
  at: Point
  onPlayer: boolean
  text: string
  /** 플레이어에게 나쁜 숫자인가(잃은 선원·선체), 좋은 숫자인가(상대가 잃은 머릿수). */
  tone: 'bad' | 'good'
}

/** 명령 하나가 만든 연출. 게임 상태는 이미 끝에 있고, 그림만 따라잡는다 (R52). */
export interface Motion {
  from: Snapshot
  startedAt: number
  floaters: readonly Floater[]
  shake: boolean
  vanishing: readonly Vanishing[]
  slide: Slide | null
}

/** 한 시각에 그릴 자세. 렌더러는 이것으로 위치를 덮어 그린다. */
export interface Pose {
  player: Point
  encounters: ReadonlyMap<string, Point>
  /** 화면 흔들림. 칸 크기에 곱하는 비율이다. */
  shake: Point
  floaters: readonly (Floater & { rise: number; alpha: number })[]
  /** 사라지는 조우. `sink`는 가라앉은 깊이(칸)다. */
  vanishing: readonly (Vanishing & { alpha: number; sink: number })[]
  /** 밀어내기의 진행(0→1). 영역이 바뀌지 않았으면 `null`. */
  slide: (Slide & { t: number }) | null
}
