import type { TerrainZone } from './game-content.types'

/**
 * 사막 구역. 여기 없는 뭍은 초지다.
 *
 * 사각형이라 가장자리가 거칠다 — 나일 계곡은 사하라 사각형 안에서 사막으로 잡힌다.
 * 대략의 범위는 지리 상식에서 왔고 경계 좌표는 저작했다.
 */
export const TERRAIN_ZONES: readonly TerrainZone[] = [
  {
    id: 'sahara',
    name: '사하라',
    terrain: 'desert',
    minLat: 15,
    maxLat: 31,
    minLon: -17,
    maxLon: 33,
  },
  {
    id: 'arabia',
    name: '아라비아',
    terrain: 'desert',
    minLat: 15,
    maxLat: 31,
    minLon: 35,
    maxLon: 57,
  },
  {
    id: 'syria',
    name: '시리아 사막',
    terrain: 'desert',
    minLat: 31,
    maxLat: 36,
    minLon: 36.5,
    maxLon: 42,
  },
  {
    id: 'karakum',
    name: '카라쿰·키질쿰',
    terrain: 'desert',
    minLat: 37,
    maxLat: 45,
    minLon: 53,
    maxLon: 66,
  },
  {
    id: 'taklamakan',
    name: '타클라마칸',
    terrain: 'desert',
    minLat: 36.5,
    maxLat: 41,
    minLon: 77,
    maxLon: 90,
  },
  {
    id: 'gobi',
    name: '고비',
    terrain: 'desert',
    minLat: 38,
    maxLat: 46,
    minLon: 95,
    maxLon: 115,
  },
  {
    id: 'thar',
    name: '타르',
    terrain: 'desert',
    minLat: 24,
    maxLat: 29,
    minLon: 69,
    maxLon: 75,
  },
]
