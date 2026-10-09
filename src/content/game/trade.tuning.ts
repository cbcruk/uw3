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

/** 시세를 찾았지만 경제의 크기를 다시 맞추기 전까지 값을 바꾸지 않은 품목 (docs/sources.md). */
const pricePending = (value: number, note: string, found: string): Tuned =>
  guess(
    value,
    '두카트/톤',
    `${note}. 감으로 정함 — 시세는 찾았다: ${found}. 보급 단가와 함께 다시 맞춘다`,
  )

/**
 * 교역의 값 (SPEC-roguelike §19). 값은 항구와 품목에서만 정해지고 런 안에서 변하지 않는다 (R54).
 *
 * 산지는 기준값보다 싸게 팔고, 산지가 아닌 항구는 비싸게 산다. 두 배율의 차이가 한 번 실어 나른 이익이다.
 */
const TRADE_SCALARS = {
  startGold: {
    value: 1000,
    unit: '두카트',
    grade: 'qualitative',
    source:
      '마젤란 함대(1519) 비용 장부: 배를 뺀 운영비가 한 척에 약 1,690두카트(교역품 제외, 2년). 콜럼버스 1492년 세 척 약 200만 마라베디 — 한 척 약 1,780두카트. 한 척·한 해 원정의 크기는 맞는다 — docs/sources.md',
  },
  localPriceRatio: {
    value: 0.8,
    unit: '배',
    grade: 'qualitative',
    source:
      '먼 시장 값 ÷ 산지 값이 1.26~2.3, 중앙값 약 1.7~1.9(1552 오르칠라 1.72, 설탕 마데이라 → 카스티야 1.9, 기름 1.6~2.2). 0.8과 1.4의 비 1.75는 그 안이다. 각 값은 저작 — docs/sources.md',
  },
  foreignPriceRatio: {
    value: 1.4,
    unit: '배',
    grade: 'qualitative',
    source:
      'localPriceRatio와 같은 근거. 산지 대비 먼 시장의 값 비(중앙값 약 1.7~1.9)를 두 배율의 비로 맞췄다 — docs/sources.md',
  },
} as const satisfies Record<string, Tuned>

/** 품목의 기준값. 서로의 차례(소금 < 곡물 < 포도주 < 설탕 < 비단)만 정했다. */
const GOOD_PRICES = {
  salt: pricePending(8, '부피에 비해 가장 싼 짐', '앤트워프 1.9, 리스본 1537 2.2 — 밀의 4분의 1'),
  grain: priceGuess(12, '마그레브 곡물'),
  wheat: pricePending(14, '아조레스 밀', '리스본 5.6, 구카스티야 5.7, 리르 7.9'),
  cork: priceGuess(15, '가볍지만 부피가 큰 짐'),
  tuna: priceGuess(20, '염장 참치'),
  hides: priceGuess(25, '마그레브 가죽'),
  wine: pricePending(30, '이베리아 포도주', '구카스티야·리스본 12~19'),
  raisins: priceGuess(30, '말라가 건포도'),
  'cotton-cloth': priceGuess(32, '카보베르데 면포. 섬에서 짜 기니 해안 교역에 쓴 천'),
  'olive-oil': pricePending(35, '포르투갈 올리브유', '리스본 1515·1517 산지 25~39'),
  'gum-arabic': priceGuess(38, '아르깅 아라비아고무. 직물 마감·약재'),
  alum: priceGuess(40, '염색 매염제'),
  woad: pricePending(45, '아조레스 대청(청색 염료)', '세비야 1500~14 128~203 — 설탕보다 비싸다'),
  orchil: pricePending(50, '카나리아 오르칠라(이끼에서 얻는 자주 염료)', '세비야 1508~15 81~102'),
  wax: pricePending(60, '마그레브 밀랍', '앤트워프 226 — 설탕의 약 1.8배'),
  sugar: pricePending(
    90,
    '안달루시아 설탕',
    '마데이라 1507 산지 55, 구카스티야 109, 앤트워프 123~135',
  ),
  silk: pricePending(
    300,
    '그라나다 비단',
    '그라나다 생사 약 1,500~6,000(1600년 값에서 거슬러 셈) — 지금 값의 열 배 가까이',
  ),
} as const satisfies Record<GoodId, Tuned>

export const TRADE_TABLES = [TRADE_SCALARS, GOOD_PRICES] as const
export const TRADE = tunedValues(TRADE_SCALARS)
export const GOOD_BASE_PRICE: Readonly<Record<GoodId, number>> = tunedValues(GOOD_PRICES)
