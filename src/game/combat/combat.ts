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
  bandit: COMBAT.skirmishLethality,
  beast: COMBAT.beastLethality,
}

const FOE_BREAK_LOSS: Readonly<Record<EncounterKindId, number>> = {
  pirate: COMBAT.raiderBreakLoss,
  bandit: COMBAT.raiderBreakLoss,
  beast: COMBAT.beastBreakLoss,
}

/**
 * 맞붙은 한 합을 치른다. 양쪽 머릿수와 (배라면) 선체를 제자리에서 깎고, 무너진 쪽을 가린다.
 *
 * 한 합은 세 단계다 (R76).
 *
 * 1. **견제.** 사상자는 상대 머릿수 × 살상률이다. 배와 배는 `boardingFrontage`만큼만 붙고(R75), 뭍의 사람
 *    무리끼리는 투창만 주고받아 `skirmishLethality`로 거의 죽지 않는다. 해적과 배끼리 맞붙으면 `holingChance`로
 *    흘수선 아래를 맞아 선체의 `holingShare`를 잃는다 — 머릿수와 상관없다 (R79).
 * 2. **무너짐.** 조우가 먼저, 플레이어가 다음이다. 잃은 몫 ÷ 문턱의 확률로 무너지고, 들이받힌 쪽은
 *    `chargeShock` × 머릿수 비의 제곱이 더해진다. 원정 쪽의 문턱은 바다면 `defenderBreakLoss`, 뭍이면
 *    약탈대와 같은 `raiderBreakLoss`이고, 바다에서는 선원과 선체 중 많이 잃은 쪽을 센다 (R79). 알아채지 못한 조우의 첫 합은 `surpriseFactor`배다.
 *    플레이어는 사람 무리에게만 무너진다 — 늑대는 들이받지 않는다.
 * 3. **추격.** 뭍에서 무너진 쪽은 남은 머릿수 × `pursuitLoss`를 더 잃고, 그 `captureShare`가 포로다.
 *    바다에서 무너진 해적은 제 배로 물러날 뿐이다. 바다에서 무너진 플레이어는 배를 빼앗긴다 — 끝은 런이 정한다.
 *
 * 운은 `시드 × 조우 × 몇 번째 합`에서만 나온다. 런 전체의 난수 상태를 들고 다니지 않아도
 * 재현된다 (R8, R33). 한 합 안에서 뽑는 순서는 SHAPE.md §6.5에 적었다.
 */
export function fightRound(options: {
  seed: number
  /** 싸우는 무리. 배라면 선체도 깎인다 — 뭍 무리에는 선체가 없다. */
  supplies: Provisioned & { hull?: number; hullMax?: number }
  conveyance: Conveyance
  foe: Encounter
  initiated: boolean
}): CombatEvent[] {
  const { supplies, foe, conveyance, initiated } = options
  const rng = createRng(mixSeed(options.seed, hashString(`${foe.id}#${foe.rounds}`)))
  const surprised = initiated && foe.rounds === 0 && !foe.chasing
  foe.rounds += 1
  foe.opposedCrew ??= supplies.crew
  foe.opposedHull ??= supplies.hull

  const atSea = foe.conveyance === 'ship' && conveyance === 'ship'
  const skirmish = foe.kind !== 'beast' && foe.conveyance !== 'ship' && conveyance !== 'ship'
  const engaged = (crew: number): number => (atSea ? Math.min(crew, COMBAT.boardingFrontage) : crew)
  const foeFighting = engaged(foe.crew)
  const playerFighting = engaged(supplies.crew)
  const playerLethality = skirmish ? COMBAT.skirmishLethality : COMBAT.playerLethality
  const crewLost = Math.min(supplies.crew, casualties(foeFighting * FOE_LETHALITY[foe.kind], rng))
  const foeLost = Math.min(foe.crew, casualties(playerFighting * playerLethality, rng))
  const { hull, hullMax } = supplies
  const shelled = foe.kind === 'pirate' && atSea && hull !== undefined && hullMax !== undefined
  const hullLost =
    shelled && rng.chance(COMBAT.holingChance)
      ? Math.min(hull, Math.ceil(hullMax * COMBAT.holingShare))
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
    return events
  }
  // 선원이나 선체가 바닥난 쪽은 무너질 것도 없다 — 끝은 런이 정한다.
  if (supplies.crew <= 0 || (supplies.hull !== undefined && supplies.hull <= 0)) {
    return events
  }

  const foeBreaks = rng.chance(
    breakChance({
      crew: foe.crew,
      crewAtStart: foe.crewAtStart,
      hullShare: 0,
      breakLoss: FOE_BREAK_LOSS[foe.kind],
      charger: initiated ? playerFighting / foeFighting : null,
      surprised,
    }),
  )
  const playerBreaks =
    foe.kind !== 'beast' &&
    rng.chance(
      breakChance({
        crew: supplies.crew,
        crewAtStart: foe.opposedCrew,
        hullShare: atSea ? lostShare(foe.opposedHull, supplies.hull) : 0,
        breakLoss: conveyance === 'ship' ? COMBAT.defenderBreakLoss : COMBAT.raiderBreakLoss,
        charger: initiated || atSea ? null : foeFighting / playerFighting,
        surprised: false,
      }),
    )
  const pursued = foe.conveyance !== 'ship' && conveyance !== 'ship'

  if (foeBreaks) {
    const lost = pursued ? Math.min(foe.crew, casualties(foe.crew * COMBAT.pursuitLoss, rng)) : 0
    const captured = foe.kind === 'beast' ? 0 : Math.floor(lost * COMBAT.captureShare)
    events.push({
      type: 'routed',
      encounterId: foe.id,
      kind: foe.kind,
      fled: foe.crew - lost,
      lost,
      captured,
    })
    // 물러난 무리는 격자에서 지운다. 돌아오게 하려면 조우마다 퇴각 상태와 회복이 필요하다.
    foe.crew = 0
  } else if (playerBreaks) {
    const lost = pursued
      ? Math.min(supplies.crew, casualties(supplies.crew * COMBAT.pursuitLoss, rng))
      : 0
    supplies.crew -= lost
    events.push({
      type: 'broken',
      encounterId: foe.id,
      kind: foe.kind,
      atSea,
      lost,
      captured: Math.floor(lost * COMBAT.captureShare),
    })
    // 이긴 약탈대는 포로와 짐을 끌고 돌아간다. 남아서 다시 덮치면 무너진 무리가 달아날 길이 없다.
    foe.crew = 0
  }
  return events
}

/**
 * 한 무리가 이번 합에 무너질 확률.
 *
 * 잃은 몫이 문턱에 닿으면 1이다. 들이받혔으면 (상대 머릿수 ÷ 자기 머릿수)² × `chargeShock`가 더해진다 —
 * 수가 많은 쪽에게 받힌 무리는 손실 없이도 무너진다.
 */
function breakChance(side: {
  crew: number
  crewAtStart: number
  /** 잃은 선체의 몫. 바다의 원정 쪽만 센다 — 선원과 선체 중 많이 잃은 쪽이 무너짐을 정한다 (R79). */
  hullShare: number
  breakLoss: number
  /** 이번 합에 이쪽을 들이받았다면 합 전에 싸우던 머릿수의 비(들이받은 쪽 ÷ 이쪽). 받지 않았으면 `null`. */
  charger: number | null
  surprised: boolean
}): number {
  const crewShare = Math.max(0, side.crewAtStart - side.crew) / side.crewAtStart
  const lossRatio = Math.max(crewShare, side.hullShare)
  const shock = side.charger === null ? 0 : COMBAT.chargeShock * side.charger ** 2
  const chance = (lossRatio / side.breakLoss + shock) * (side.surprised ? COMBAT.surpriseFactor : 1)
  return Math.min(1, chance)
}

/** 싸움을 시작할 때보다 잃은 선체의 몫. 선체가 없거나 처음부터 0이면 0이다 (R79). */
function lostShare(atStart: number | undefined, now: number | undefined): number {
  return atStart === undefined || now === undefined || atStart <= 0
    ? 0
    : Math.max(0, atStart - now) / atStart
}

/** 기댓값을 운으로 흔들고 정수로 만든다. 소수 몫은 확률로 올린다 — 작은 무리도 피해를 낸다. */
function casualties(expected: number, rng: Rng): number {
  const rolled = expected * rng.range(1 - COMBAT.rollSpread, 1 + COMBAT.rollSpread)
  const whole = Math.floor(rolled)
  return whole + (rng.chance(rolled - whole) ? 1 : 0)
}
