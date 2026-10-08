import { describe, expect, it } from "vite-plus/test";
import { findShipClass } from "../../content/ships";
import type { ShipClass } from "../../sim/ship/ship.types";
import type { Encounter } from "../encounter/encounter.types";
import { createSupplies } from "../supplies/supplies";
import { fightRound } from "./combat";

const shipClass = findShipClass("caravela-redonda") as ShipClass;

function foe(kind: Encounter["kind"], crew: number): Encounter {
  return {
    id: `${kind}-x`,
    kind,
    cell: { x: 0, y: 0 },
    crew,
    crewAtStart: crew,
    conveyance: kind === "pirate" ? "ship" : "horse",
    nextActHours: 0,
    rounds: 0,
    chasing: true,
  };
}

function rounds(
  kind: Encounter["kind"],
  crew: number,
  conveyance: "ship" | "horse",
  count: number,
) {
  const supplies = createSupplies(shipClass);
  const enemy = foe(kind, crew);
  for (let i = 0; i < count && enemy.crew > 0 && supplies.crew > 0; i += 1) {
    fightRound({ seed: 7, supplies, conveyance, foe: enemy, initiated: false });
  }
  return { supplies, enemy };
}

describe("한 합 — 머릿수가 곧 공격력이다", () => {
  it("양쪽이 동시에 잃고, 몇 번째 합인지 센다", () => {
    const supplies = createSupplies(shipClass);
    const enemy = foe("bandit", 30);
    const [round] = fightRound({
      seed: 7,
      supplies,
      conveyance: "horse",
      foe: enemy,
      initiated: true,
    });
    expect(round).toMatchObject({ type: "combat", initiated: true, hullLost: 0 });
    expect(enemy.rounds).toBe(1);
    expect(supplies.crew + (round?.type === "combat" ? round.crewLost : 0)).toBe(32);
  });

  it("해적만 배의 선체를 깎는다. 뭍에서는 선체가 그대로다", () => {
    expect(rounds("pirate", 40, "ship", 5).supplies.hull).toBeLessThan(shipClass.hullPoints);
    expect(rounds("bandit", 40, "horse", 5).supplies.hull).toBe(shipClass.hullPoints);
    expect(rounds("pirate", 40, "horse", 5).supplies.hull).toBe(shipClass.hullPoints);
  });

  it("작은 무리는 지고 큰 무리는 이긴다", () => {
    expect(rounds("beast", 6, "horse", 50).enemy.crew).toBe(0);
    expect(rounds("pirate", 200, "ship", 50).supplies.crew).toBe(0);
  });

  it("같은 시드·조우·합 번호면 같은 결과다", () => {
    expect(rounds("pirate", 40, "ship", 3)).toEqual(rounds("pirate", 40, "ship", 3));
  });

  it("쓰러뜨리면 defeated를 함께 낸다", () => {
    const supplies = createSupplies(shipClass);
    const enemy = foe("beast", 1);
    let events = fightRound({
      seed: 1,
      supplies,
      conveyance: "horse",
      foe: enemy,
      initiated: true,
    });
    for (let i = 0; i < 20 && enemy.crew > 0; i += 1) {
      events = fightRound({ seed: 1, supplies, conveyance: "horse", foe: enemy, initiated: true });
    }
    expect(events.at(-1)).toEqual({ type: "defeated", encounterId: "beast-x", kind: "beast" });
  });
});

describe("퇴각 — 절반을 잃으면 물러난다", () => {
  it("처음 머릿수의 절반 아래로 줄면 routed를 내고 격자에서 빠진다", () => {
    const supplies = createSupplies(shipClass);
    const enemy = foe("bandit", 20);
    let routed = false;
    for (let i = 0; i < 30 && enemy.crew > 0; i += 1) {
      const events = fightRound({
        seed: 3,
        supplies,
        conveyance: "horse",
        foe: enemy,
        initiated: true,
      });
      routed ||= events.some((e) => e.type === "routed");
    }
    expect(routed).toBe(true);
    expect(enemy.crew).toBe(0);
  });
});
