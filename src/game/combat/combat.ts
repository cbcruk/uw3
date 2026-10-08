import { COMBAT } from "../../content/game/combat.tuning";
import type { EncounterKindId } from "../../content/game/game-content.types";
import { createRng, hashString, mixSeed } from "../../sim/rng/rng";
import type { Rng } from "../../sim/rng/rng.types";
import type { Encounter } from "../encounter/encounter.types";
import type { Supplies } from "../supplies/supplies.types";
import type { Conveyance } from "../travel/travel.types";
import type { CombatEvent } from "./combat.types";

const FOE_LETHALITY: Readonly<Record<EncounterKindId, number>> = {
  pirate: COMBAT.pirateLethality,
  bandit: COMBAT.banditLethality,
  beast: COMBAT.beastLethality,
};

/**
 * 맞붙은 한 합을 치른다. 양쪽 머릿수와 (배라면) 선체를 제자리에서 깎는다.
 *
 * 사상자는 상대 머릿수 × 살상률이다. 머릿수가 곧 공격력이라 수가 적은 쪽이 갈수록 불리해진다.
 * 해적은 배를 탄 플레이어의 선체도 깎는다. 뭍에서는 선체가 상관없다.
 *
 * 운은 `시드 × 조우 × 몇 번째 합`에서만 나온다. 런 전체의 난수 상태를 들고 다니지 않아도
 * 재현된다 (R8, R33).
 */
export function fightRound(options: {
  seed: number;
  supplies: Supplies;
  conveyance: Conveyance;
  foe: Encounter;
  initiated: boolean;
}): CombatEvent[] {
  const { supplies, foe, conveyance, initiated } = options;
  const rng = createRng(mixSeed(options.seed, hashString(`${foe.id}#${foe.rounds}`)));
  foe.rounds += 1;

  const crewLost = Math.min(supplies.crew, casualties(foe.crew * FOE_LETHALITY[foe.kind], rng));
  const foeLost = Math.min(foe.crew, casualties(supplies.crew * COMBAT.playerLethality, rng));
  const hullLost =
    foe.kind === "pirate" && conveyance === "ship"
      ? Math.min(supplies.hull, casualties(foe.crew * COMBAT.pirateHullDamage, rng))
      : 0;

  supplies.crew -= crewLost;
  supplies.hull -= hullLost;
  foe.crew -= foeLost;

  const events: CombatEvent[] = [
    {
      type: "combat",
      encounterId: foe.id,
      kind: foe.kind,
      initiated,
      crewLost,
      hullLost,
      foeLost,
      foeLeft: foe.crew,
    },
  ];
  if (foe.crew <= 0) {
    events.push({ type: "defeated", encounterId: foe.id, kind: foe.kind });
  }
  return events;
}

/** 기댓값을 운으로 흔들고 정수로 만든다. 소수 몫은 확률로 올린다 — 작은 무리도 피해를 낸다. */
function casualties(expected: number, rng: Rng): number {
  const rolled = expected * rng.range(1 - COMBAT.rollSpread, 1 + COMBAT.rollSpread);
  const whole = Math.floor(rolled);
  return whole + (rng.chance(rolled - whole) ? 1 : 0);
}
