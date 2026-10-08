import type { EncounterKind } from "./game-content.types";

/**
 * 조우 종류. 원본 로그라이크의 몬스터 표에 해당한다.
 *
 * 머릿수는 감으로 정했다. 해적선은 소형 갤리·카라벨 한 척, 도적떼는 기마 약탈대 하나의 규모다.
 * 해적선은 라틴 카라벨이다 — 지중해·북아프리카 해적의 빠른 삼각돛 배. 맞바람에 강해 피하기 어렵다.
 */
export const ENCOUNTER_KINDS: readonly EncounterKind[] = [
  {
    id: "pirate",
    name: "해적선",
    terrains: ["sea"],
    crewMin: 20,
    crewMax: 60,
    conveyances: ["ship"],
    shipClassId: "caravela-latina",
  },
  {
    id: "bandit",
    name: "도적떼",
    terrains: ["grassland", "desert"],
    crewMin: 8,
    crewMax: 30,
    conveyances: ["horse", "camel"],
  },
  {
    id: "beast",
    name: "늑대 무리",
    terrains: ["grassland"],
    crewMin: 4,
    crewMax: 12,
    conveyances: ["horse"],
  },
];
