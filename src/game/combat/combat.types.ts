import type { EncounterKindId } from "../../content/game/game-content.types";

/** 한 합의 결과. 양쪽이 동시에 잃는다 — 백병전은 일방적이지 않다. */
export type CombatEvent =
  | {
      type: "combat";
      encounterId: string;
      kind: EncounterKindId;
      /** 플레이어가 먼저 들이받았는가. */
      initiated: boolean;
      crewLost: number;
      hullLost: number;
      foeLost: number;
      foeLeft: number;
    }
  | { type: "defeated"; encounterId: string; kind: EncounterKindId };
