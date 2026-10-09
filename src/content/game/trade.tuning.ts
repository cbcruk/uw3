import { tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'
import type { GoodId } from './game-content.types'

const guess = (value: number, unit: string, note: string): Tuned => ({
  value,
  unit,
  grade: 'unverified',
  source: `감으로 정함. ${note}`,
})

const priceGuess = (value: number, note: string): Tuned =>
  guess(value, '두카트/톤', `${note}. 1500년 전후 리스본·세비야 시세 기록 필요`)

/**
 * 교역의 값 (SPEC-roguelike §19). 값은 항구와 품목에서만 정해지고 런 안에서 변하지 않는다 (R54).
 *
 * 산지는 기준값보다 싸게 팔고, 산지가 아닌 항구는 비싸게 산다. 두 배율의 차이가 한 번 실어 나른 이익이다.
 */
const TRADE_SCALARS = {
  startGold: guess(
    1000,
    '두카트',
    '카라벨 한 척 원정의 운영 자금. 식량·물을 한 번 다 채울 만큼이 안 된다는 방향만 둔 값',
  ),
  localPriceRatio: guess(0.8, '배', '산지 값 / 기준값. 산지 시세와 먼 시장 시세의 비 기록 필요'),
  foreignPriceRatio: guess(1.4, '배', '산지가 아닌 항구의 값 / 기준값. 운임·위험을 얹은 값'),
} as const satisfies Record<string, Tuned>

/** 품목의 기준값. 서로의 차례(소금 < 곡물 < 포도주 < 설탕 < 비단)만 정했다. */
const GOOD_PRICES = {
  salt: priceGuess(8, '부피에 비해 가장 싼 짐'),
  grain: priceGuess(12, '마그레브 곡물'),
  wheat: priceGuess(14, '아조레스 밀'),
  cork: priceGuess(15, '가볍지만 부피가 큰 짐'),
  tuna: priceGuess(20, '염장 참치'),
  hides: priceGuess(25, '마그레브 가죽'),
  wine: priceGuess(30, '이베리아 포도주'),
  raisins: priceGuess(30, '말라가 건포도'),
  'cotton-cloth': priceGuess(32, '카보베르데 면포. 섬에서 짜 기니 해안 교역에 쓴 천'),
  'olive-oil': priceGuess(35, '포르투갈 올리브유'),
  'gum-arabic': priceGuess(38, '아르깅 아라비아고무. 직물 마감·약재'),
  alum: priceGuess(40, '염색 매염제'),
  woad: priceGuess(45, '아조레스 대청(청색 염료)'),
  orchil: priceGuess(50, '카나리아 오르칠라(이끼에서 얻는 자주 염료)'),
  wax: priceGuess(60, '마그레브 밀랍'),
  sugar: priceGuess(90, '안달루시아 설탕'),
  silk: priceGuess(300, '그라나다 비단'),
} as const satisfies Record<GoodId, Tuned>

export const TRADE_TABLES = [TRADE_SCALARS, GOOD_PRICES] as const
export const TRADE = tunedValues(TRADE_SCALARS)
export const GOOD_BASE_PRICE: Readonly<Record<GoodId, number>> = tunedValues(GOOD_PRICES)
