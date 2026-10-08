import type { Good } from '../../content/game/game-content.types'

/** 시장 목록 한 줄. 산지 항구가 파는 품목과 그 값이다. */
export interface MarketLine {
  good: Good
  /** 한 톤 값(두카트). 산지에서는 사는 값과 파는 값이 같다. */
  price: number
}

/** 사고팔기의 결과. 실제로 오간 톤 수는 요청보다 적을 수 있다 — 금화나 자리가 모자랄 때. */
export type TradeResult = { ok: true; tons: number; gold: number } | { ok: false; reason: string }
