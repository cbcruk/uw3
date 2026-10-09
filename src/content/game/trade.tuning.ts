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
  grain: priceFound(
    5,
    '1486 마사강(모로코)에서 산 밀은 같은 해 안달루시아 밀의 0.80배(Ladero Quesada 1974–75, p. 105). 흉년이라 비만 쓴다 — 밀 6 × 0.8',
  ),
  wheat: priceFound(
    6,
    '리스본 5.6 · 구카스티야 5.7(1506–13 중앙값) · 리르 7.9 — 시장 값 ÷ 1.4 ≈ 4–6, 산지 쪽으로 6',
  ),
  cork: priceGuess(
    15,
    '가볍지만 부피가 큰 짐. 찾은 것은 잉글랜드 1566·1574 파운드당 1.5펜스(Rogers IV, p. 632)뿐이고 1500년으로 거슬러 셀 물가 지수를 확인하지 못했다',
  ),
  tuna: priceFound(
    30,
    '카디스 1485–86 모하마(말린 참치 등살) 아로바 130마라베디 = 산지 30(Ladero Quesada, pp. 102–103). 모하마는 윗길이라 통 염장 참치는 그보다 싸다 — ÷ 0.8 하지 않고 30',
  ),
  hides: priceGuess(
    45,
    '마그레브 가죽. 피사가 1464–65에 산 포르투갈·갈리시아 생가죽(peles verdes) 한 장 약 175헤이스(Sequeira, eHumanista 38, 2018). 한 장 무게를 몰라 12–20kg을 가정하면 30–63으로 퍼진다 — 무게 기록이 있어야 올린다',
  ),
  wine: priceFound(18, '구카스티야·리스본 12–19(이베리아 산지) ÷ 0.8 ≈ 15–24'),
  raisins: priceGuess(
    50,
    '말라가 건포도. 잉글랜드 c.1450–1500 건포도·무화과 한 묶음 값(Rogers IV, pp. 668–669, 한 묶음 84파운드는 Rogers의 추정)으로 먼 시장 67–77 ÷ 1.4 ≈ 48–55. 환산을 설탕으로 확인했지만 설탕도 같은 방식으로 거꾸로 센 값이라 순환이다 — 이베리아 시세가 있어야 올린다',
  ),
  'cotton-cloth': priceGuess(
    100,
    '카보베르데 면포(파누). 1500년 무렵 파누 값은 못 찾았다. 거친 천은 리스본 1521 삼베 85–136, 카디스 1485 캔버스 200–270(미터당 0.25–0.4kg 가정)이라 공산품인 천이 32일 수는 없어 올렸다',
  ),
  'olive-oil': priceFound(
    40,
    '리스본 1515·1517 산지 25–39 ÷ 0.8 ≈ 31–49. 리스본·발렌시아·안달루시아에서 밀의 약 3.5배',
  ),
  'gum-arabic': priceGuess(38, '아르깅 아라비아고무. 직물 마감·약재. 두 번 찾았으나 시세가 없다'),
  alum: priceGuess(
    40,
    '염색 매염제. 톨파 1466 계약의 광산 사용료가 칸타로(약 68kg)당 1–2두카트(de Roover, The Medici Bank, p. 47) — 광산에서 최소 약 29. 시장 시세 필요(Delumeau 1962)',
  ),
  woad: priceFound(
    120,
    '세비야 1500–14 아조레스 대청 128–203(먼 시장, Miranda Calderín 2019) ÷ 1.4 ≈ 91–145',
  ),
  orchil: priceFound(65, '세비야 1508–15 81–102(먼 시장, Miranda Calderín 2019) ÷ 1.4 ≈ 58–73'),
  wax: priceFound(
    160,
    '앤트워프 226(먼 시장, Van der Wee) ÷ 1.4 ≈ 161. 북유럽 교회용 밀랍 값이라 마그레브 밀랍의 시장 값으로는 약하다. 앤트워프에서 설탕의 약 1.8배',
  ),
  sugar: priceFound(
    90,
    '마데이라 1508 산지 59.6(Welser 계약, Pohle) ÷ 0.8 = 75, 앤트워프 정제당 123–135 ÷ 1.4 ≈ 92 — 둘 사이',
  ),
  silk: priceFound(
    3000,
    '카디스 1485–86 그라나다 비단 17온스 리브라에 750–890마라베디 ≈ 4,100–4,850(Ladero Quesada) — 그라나다가 아직 국경 밖이라 먼 시장으로 보고 ÷ 1.4 ≈ 2,900–3,500. 그라나다 전쟁 중의 값이라 높은 쪽일 수 있다',
  ),
} as const satisfies Record<GoodId, Tuned>

export const TRADE_TABLES = [TRADE_SCALARS, GOOD_PRICES] as const
export const TRADE = tunedValues(TRADE_SCALARS)
export const GOOD_BASE_PRICE: Readonly<Record<GoodId, number>> = tunedValues(GOOD_PRICES)
