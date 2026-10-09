import { COMBAT } from '../../content/game/combat.tuning'
import type { EncounterKindId } from '../../content/game/game-content.types'
import { createRng, hashString, mixSeed } from '../../sim/rng/rng'
import type { Rng } from '../../sim/rng/rng.types'
import type { Encounter } from '../encounter/encounter.types'
import type { Provisioned } from '../supplies/supplies.types'
import type { Conveyance } from '../travel/travel.types'
import type { CombatEvent } from './combat.types'

const FOE_LETHALITY: Readonly<Record<EncounterKindId, number>> = {
  pirate: COMBAT.pirateLethality,
  bandit: COMBAT.banditLethality,
  beast: COMBAT.beastLethality,
}

/**
 * 맞붙은 한 합을 치른다. 양쪽 머릿수와 (배라면) 선체를 제자리에서 깎는다.
 *
 * 사상자는 상대 머릿수 × 살상률이다. 머릿수가 곧 공격력이라 수가 적은 쪽이 갈수록 불리해진다.
 * 해적은 배를 탄 플레이어의 선체도 깎는다. 뭍에서는 선체가 상관없다.
 *
 * 운은 `시드 × 조우 × 몇 번째 합`에서만 나온다. 런 전체의 난수 상태를 들고 다니지 않아도
 * 재현된다 (R8, R33).
 *
 * 처음 머릿수의 절반 아래로 줄면 물러난다 (R46). 짐승도 같다 — 무리가 반으로 줄면 흩어진다.
 *
 * 배와 배가 맞붙으면 한 합에 싸우는 머릿수가 양쪽 모두 `boardingFrontage`를 넘지 않는다 (R75). 손실은 여전히 무리 전체에서 난다.
 * 뭍은 트인 땅이라 상한이 없다 — 머릿수가 그대로 공격력이다.
 */
export function fightRound(options: {
  seed: number
  /** 싸우는 무리. 배라면 선체도 깎인다 — 뭍 무리에는 선체가 없다. */
  supplies: Provisioned & { hull?: number }
  conveyance: Conveyance
  foe: Encounter
  initiated: boolean
}): CombatEvent[] {
  const { supplies, foe, conveyance, initiated } = options
  const rng = createRng(mixSeed(options.seed, hashString(`${foe.id}#${foe.rounds}`)))
  foe.rounds += 1

  const boarding = foe.conveyance === 'ship' && conveyance === 'ship'
  const engaged = (crew: number): number =>
    boarding ? Math.min(crew, COMBAT.boardingFrontage) : crew
  const foeFighting = engaged(foe.crew)
  const crewLost = Math.min(supplies.crew, casualties(foeFighting * FOE_LETHALITY[foe.kind], rng))
  const foeLost = Math.min(
    foe.crew,
    casualties(engaged(supplies.crew) * COMBAT.playerLethality, rng),
  )
  const hullLost =
    foe.kind === 'pirate' && conveyance === 'ship' && supplies.hull !== undefined
      ? Math.min(supplies.hull, casualties(foeFighting * COMBAT.pirateHullDamage, rng))
      : 0

  supplies.crew -= crewLost
  if (supplies.hull !== undefined) {
    supplies.hull -= hullLost
  }
  foe.crew -= foeLost

  const events: CombatEvent[] = [
    {
      type: 'combat',
      encounterId: foe.id,
      kind: foe.kind,
      initiated,
      crewLost,
      hullLost,
      foeLost,
      foeLeft: foe.crew,
    },
  ]
  if (foe.crew <= 0) {
    events.push({ type: 'defeated', encounterId: foe.id, kind: foe.kind })
  } else if (foe.crew <= foe.crewAtStart * COMBAT.routRatio) {
    // 물러난 무리는 격자에서 지운다. 돌아오게 하려면 조우마다 퇴각 상태와 회복이 필요하다.
    events.push({ type: 'routed', encounterId: foe.id, kind: foe.kind, fled: foe.crew })
    foe.crew = 0
  }
  return events
}

/** 기댓값을 운으로 흔들고 정수로 만든다. 소수 몫은 확률로 올린다 — 작은 무리도 피해를 낸다. */
function casualties(expected: number, rng: Rng): number {
  const rolled = expected * rng.range(1 - COMBAT.rollSpread, 1 + COMBAT.rollSpread)
  const whole = Math.floor(rolled)
  return whole + (rng.chance(rolled - whole) ? 1 : 0)
}
