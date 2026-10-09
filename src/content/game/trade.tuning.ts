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

const priceFound = (value: number, found: string): Tuned => ({
  value,
  unit: '두카트/톤',
  grade: 'qualitative',
  source: `${found} — docs/sources.md`,
})

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
      '먼 시장 값이 산지 값보다 비싸다는 방향과 그 비의 대략(1.26~2.3)만 댄다. 1552 오르칠라 장부 1.72(운임 포함 비용 대 카디스 판매가), 설탕 마데이라 → 카스티야 1.9, 기름(1550년대 안달루시아 → 카스티야 내륙) 1.6~2.2. 0.8과 1.4의 비 1.75는 그 안에서 저작했다 — docs/sources.md',
  },
  foreignPriceRatio: {
    value: 1.4,
    unit: '배',
    grade: 'qualitative',
    source:
      'localPriceRatio와 같은 근거. 산지 대비 먼 시장의 값 비(중앙값 약 1.7~1.9)를 두 배율의 비로 맞췄다 — docs/sources.md',
  },
} as const satisfies Record<string, Tuned>

/**
 * 품목의 기준값. 시세를 찾은 품목은 산지 값 ÷ `localPriceRatio` 또는 먼 시장 값 ÷ `foreignPriceRatio`로 거꾸로 셌다 (docs/sources.md).
 * 기준값은 어디서도 관찰되지 않는 모델의 값이라 시세를 찾은 품목도 `qualitative`다. 나머지는 감으로 정한 차례다.
 */
const GOOD_PRICES = {
  salt: priceFound(3, '리스본 1537 산지 2.2 ÷ 0.8 = 2.75. 앤트워프 1.9 — 밀의 약 4분의 1'),
  grain: priceGuess(5, '마그레브 곡물. 밀(6)보다 조금 싸다는 방향만 둔 값'),
  wheat: priceFound(
    6,
    '리스본 5.6 · 구카스티야 5.7(1506–13 중앙값) · 리르 7.9 — 시장 값 ÷ 1.4 ≈ 4–6, 산지 쪽으로 6',
  ),
  cork: priceGuess(15, '가볍지만 부피가 큰 짐'),
  tuna: priceGuess(20, '염장 참치'),
  hides: priceGuess(25, '마그레브 가죽'),
  wine: priceFound(18, '구카스티야·리스본 12–19(이베리아 산지) ÷ 0.8 ≈ 15–24'),
  raisins: priceGuess(30, '말라가 건포도'),
  'cotton-cloth': priceGuess(32, '카보베르데 면포. 섬에서 짜 기니 해안 교역에 쓴 천'),
  'olive-oil': priceFound(
    40,
    '리스본 1515·1517 산지 25–39 ÷ 0.8 ≈ 31–49. 리스본·발렌시아·안달루시아에서 밀의 약 3.5배',
  ),
  'gum-arabic': priceGuess(38, '아르깅 아라비아고무. 직물 마감·약재'),
  alum: priceGuess(40, '염색 매염제'),
  woad: priceFound(
    120,
    '세비야 1500–14 아조레스 대청 128–203(먼 시장, Miranda Calderín 2019) ÷ 1.4 ≈ 91–145',
  ),
  orchil: priceFound(65, '세비야 1508–15 81–102(먼 시장, Miranda Calderín 2019) ÷ 1.4 ≈ 58–73'),
  wax: priceFound(
    160,
    '앤트워프 226(먼 시장, Van der Wee) ÷ 1.4 ≈ 161. 앤트워프에서 설탕의 약 1.8배',
  ),
  sugar: priceFound(
    90,
    '마데이라 1508 산지 59.6(Welser 계약, Pohle) ÷ 0.8 = 75, 앤트워프 정제당 123–135 ÷ 1.4 ≈ 92 — 둘 사이',
  ),
  silk: priceFound(
    1500,
    '그라나다 생사 약 1,500–6,000(1600년 무렵 값에서 거슬러 셈, 근거가 약하다). 범위의 아래 끝 — 설탕의 열 배 넘게',
  ),
} as const satisfies Record<GoodId, Tuned>

export const TRADE_TABLES = [TRADE_SCALARS, GOOD_PRICES] as const
export const TRADE = tunedValues(TRADE_SCALARS)
export const GOOD_BASE_PRICE: Readonly<Record<GoodId, number>> = tunedValues(GOOD_PRICES)
