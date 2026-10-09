import type { EncounterKind } from './game-content.types'

/**
 * 조우 종류. 원본 로그라이크의 몬스터 표에 해당한다.
 *
 * 머릿수는 감으로 정했다. 해적선은 소형 갤리·카라벨 한 척, 도적떼는 기마 약탈대 하나의 규모다.
 * 해적선은 라틴 카라벨이다 — 지중해·북아프리카 해적의 빠른 삼각돛 배. 맞바람에 강해 피하기 어렵다.
 */
export const ENCOUNTER_KINDS: readonly EncounterKind[] = [
  {
    id: 'pirate',
    name: '해적선',
    terrains: ['sea'],
    crewMin: 20,
    crewMax: 60,
    conveyances: ['ship'],
    carriesGold: true,
    shipClassId: 'caravela-latina',
  },
  {
    id: 'bandit',
    name: '도적떼',
    terrains: ['grassland', 'desert'],
    crewMin: 8,
    crewMax: 30,
    conveyances: ['horse', 'camel'],
    carriesGold: true,
  },
  {
    id: 'beast',
    name: '늑대 무리',
    terrains: ['grassland'],
    crewMin: 4,
    crewMax: 12,
    conveyances: ['horse'],
    carriesGold: false,
  },
  /**
   * 해적 선단 — 갈리오트 두세 척이 함께 다닌다 (R83). 피에르 당(1649)은 알제 해적이 "배 두세 척으로 한 척을" 덮쳤다고 썼고,
   * 하에도(1612)는 스무 벤치 갈리오트에 전투원 약 40명을 적었다(`combat-3.md`). 그래서 90–150명이다.
   * 큰 배만 노리고(`minPreyTons`) 머릿수로 앞서 덮친다(R80·R83). 표의 맨 뒤에 둔다 — 앞 종류의 생성 난수가 바뀌지 않는다.
   */
  {
    id: 'corsairs',
    name: '해적 선단',
    terrains: ['sea'],
    crewMin: 90,
    crewMax: 150,
    conveyances: ['ship'],
    carriesGold: true,
    shipClassId: 'caravela-latina',
    // 카라벨(60–90톤)과 나우(220톤) 사이. 그 사이 어느 값이든 결과가 같다 — 근거 등급을 달 값이 아니다.
    minPreyTons: 150,
  },
]
