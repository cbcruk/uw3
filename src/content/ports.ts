import type { LatLon } from '../sim/geo/geo.types'
import type { Port } from './content.types'

/** SPEC 9: v1의 첫 재현 항해는 리스본 → 아조레스(앙그라) → 리스본이다. */
export const PORTS: readonly Port[] = [
  {
    id: 'lisboa',
    name: '리스본',
    lat: 38.71,
    lon: -9.14,
    anchorage: { lat: 38.68, lon: -9.45 },
    nation: '포르투갈',
    culture: '이베리아',
    language: 'portuguese',
    isCapital: true,
    facilities: ['shipyard', 'market', 'tavern', 'library', 'guild', 'church'],
    goods: ['소금', '올리브유', '포도주', '코르크'],
  },
  {
    id: 'cadiz',
    name: '카디스',
    lat: 36.53,
    lon: -6.3,
    anchorage: { lat: 36.5, lon: -6.4 },
    nation: '카스티야',
    culture: '이베리아',
    language: 'castilian',
    isCapital: false,
    facilities: ['shipyard', 'market', 'tavern', 'church'],
    goods: ['소금', '포도주', '참치'],
  },
  {
    id: 'ceuta',
    name: '세우타',
    lat: 35.89,
    lon: -5.32,
    // 만 안쪽(-5.32)은 1/16° 격자에서 뭍으로 잡혀 앞바다 뚫기에 기대고 있었다.
    // 세우타 항은 실제로 북동으로 열려 있으므로 그쪽 해상으로 옮긴다.
    anchorage: { lat: 35.93, lon: -5.28 },
    nation: '포르투갈',
    culture: '마그레브',
    language: 'arabic',
    isCapital: false,
    facilities: ['market', 'tavern', 'church'],
    goods: ['곡물', '가죽', '밀랍'],
  },
  {
    id: 'malaga',
    name: '말라가',
    lat: 36.72,
    lon: -4.42,
    anchorage: { lat: 36.65, lon: -4.42 },
    nation: '카스티야',
    culture: '안달루시아',
    language: 'castilian',
    isCapital: false,
    facilities: ['market', 'tavern', 'guild'],
    goods: ['건포도', '설탕', '명반', '비단'],
  },
  {
    id: 'angra',
    name: '앙그라',
    lat: 38.66,
    lon: -27.22,
    anchorage: { lat: 38.6, lon: -27.25 },
    nation: '포르투갈',
    culture: '이베리아',
    language: 'portuguese',
    isCapital: false,
    facilities: ['market', 'tavern', 'church'],
    goods: ['대청', '포도주', '밀'],
  },
]

export const PORT_ANCHORAGES: readonly LatLon[] = PORTS.map((port) => port.anchorage)

export function findPort(id: string): Port | undefined {
  return PORTS.find((port) => port.id === id)
}
