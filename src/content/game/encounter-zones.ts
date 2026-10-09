import { ENCOUNTER_ZONE_FACTOR } from './encounters.tuning'
import type { EncounterZone } from './game-content.types'

/**
 * 조우 밀도 구역 (SPEC-roguelike §24). 사각형으로 손저작했다 — 지형 구역(`terrain-zones.ts`)과 같은 방식이다.
 *
 * 경계는 지리 상식에서 잡았다. 바르바리 구역은 북아프리카 해안만이 아니라 맞은편 이베리아 남해안까지 덮는다 —
 * 사략선은 건너편 해안을 털러 다녔다. 대서양 구역은 아조레스(27°W) 서쪽부터다. 섬 앞바다는 옅게 하지 않는다.
 */
export const ENCOUNTER_ZONES: readonly EncounterZone[] = [
  {
    id: 'barbary',
    name: '바르바리 해안',
    kind: 'pirate',
    minLat: 32,
    maxLat: 38,
    minLon: -6,
    maxLon: 12,
    factor: ENCOUNTER_ZONE_FACTOR.barbaryPirates,
  },
  {
    id: 'open-atlantic',
    name: '대서양 한가운데',
    kind: 'pirate',
    minLat: 15,
    maxLat: 50,
    minLon: -60,
    maxLon: -30,
    factor: ENCOUNTER_ZONE_FACTOR.openAtlanticPirates,
  },
  {
    id: 'malacca',
    name: '말라카 해협',
    kind: 'pirate',
    minLat: -1,
    maxLat: 7,
    minLon: 98,
    maxLon: 105,
    factor: ENCOUNTER_ZONE_FACTOR.malaccaPirates,
  },
]
