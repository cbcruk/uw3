import type { FameTitle } from './game-content.types'

/**
 * 명성의 칭호. 화면에 이름을 붙일 뿐 런에 주는 몫은 없다 — 몫은 후원금(`patronGoldPerFame`) 하나다.
 *
 * 낮은 문턱부터 적는다. 명성이 문턱 이상인 것 중 마지막이 칭호다.
 */
export const FAME_TITLES: readonly FameTitle[] = [
  { minFame: 0, title: '무명 선장' },
  { minFame: 100, title: '알려진 선장' },
  { minFame: 300, title: '이름난 선장' },
  { minFame: 700, title: '왕실이 아는 선장' },
  { minFame: 1500, title: '제독감' },
]
