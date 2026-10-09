import type { EncounterKindId } from '../../content/game/game-content.types'
import type { Cell } from '../grid/world-grid.types'
import type { Conveyance } from '../travel/travel.types'

/** 격자 위에 놓인 조우 하나. 원본의 몬스터 액터에 해당한다. */
export interface Encounter {
  /** 영역과 순번에서 만든다. 같은 시드면 같은 영역에서 같은 id가 나온다. */
  id: string
  kind: EncounterKindId
  cell: Cell
  crew: number
  /** 태어날 때의 머릿수. 잃은 몫이 여기서 나와 무너짐을 정한다 (R76). */
  crewAtStart: number
  /**
   * 이 조우와 첫 합을 치를 때 플레이어 무리의 머릿수. 플레이어가 잃은 몫을 여기에 견준다 (R76).
   * 아직 맞붙지 않았으면 없다.
   */
  opposedCrew?: number
  /** 지금 타고 있는 것. 시야 반경과 하루 행정이 여기서 나온다. */
  conveyance: Conveyance
  /**
   * 다음에 움직일 수 있는 시각(출발 후 시간). 원본의 에너지 스케줄러에 해당한다 —
   * 한 칸 움직이면 그 칸에 걸린 시간만큼 뒤로 밀린다 (R27).
   */
  nextActHours: number
  /** 지금까지 치른 합의 수. 전투의 운이 여기서 갈린다 (R33). */
  rounds: number
  /** 플레이어를 보고 쫓는 중인가. 놓치면 다시 `false`가 된다. */
  chasing: boolean
}
