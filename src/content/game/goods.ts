import type { Good } from './game-content.types'

/**
 * 교역 품목. 항구 자료의 `goods`에 적힌 이름을 모두 담는다 — 검증기가 빠진 이름을 막는다.
 *
 * 순서는 시장 화면의 순서다. 산지 항구의 목록과 화물칸 목록이 이 순서를 따른다.
 */
export const GOODS: readonly Good[] = [
  { id: 'salt', name: '소금' },
  { id: 'grain', name: '곡물' },
  { id: 'wheat', name: '밀' },
  { id: 'cork', name: '코르크' },
  { id: 'tuna', name: '참치' },
  { id: 'hides', name: '가죽' },
  { id: 'wine', name: '포도주' },
  { id: 'raisins', name: '건포도' },
  { id: 'olive-oil', name: '올리브유' },
  { id: 'alum', name: '명반' },
  { id: 'woad', name: '대청' },
  { id: 'wax', name: '밀랍' },
  { id: 'sugar', name: '설탕' },
  { id: 'silk', name: '비단' },
]

export function findGoodByName(name: string): Good | undefined {
  return GOODS.find((good) => good.name === name)
}
