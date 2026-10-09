import type { Good } from '../../content/game/game-content.types'

/** 시장 목록 한 줄. 산지 항구가 파는 품목과 그 값이다. */
export interface MarketLine {
  good: Good
  /** 한 톤을 사는 값(두카트). 말을 아는 산지에서는 파는 값과 같다. */
  price: number
}

/** 사고팔기의 결과. 실제로 오간 톤 수는 요청보다 적을 수 있다 — 금화나 자리가 모자랄 때. */
export type TradeResult = { ok: true; tons: number; gold: number } | { ok: false; reason: string }

/** 거래의 방향. 말을 모르는 항구에서는 방향마다 값이 갈린다. */
export type TradeSide = 'buy' | 'sell'

/** 항구에서 외국 상인이 떼이는 몫. 사는 값에 더하고 파는 값에서 뺀다. */
export interface PortFee {
  /** 다른 나라 항구의 관세 (R72). */
  customs: number
  /** 말을 모르는 항구의 통역료 (R58). */
  interpreter: number
  total: number
}
