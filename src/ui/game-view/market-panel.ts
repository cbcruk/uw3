import { findPort } from '../../content/ports'
import { cargoTons, provisionLimit } from '../../game/supplies/supplies'
import { cargoGoods, knownLanguages, marketAt, priceAt } from '../../game/trade/trade'
import { LANGUAGE_LABELS } from '../../content/content.types'
import type { RunState } from '../../game/run/run.types'
import { TRADE_LOT_TONS, goodName } from './game-view.utils'

/**
 * 시장 패널. 배로 정박해 있을 때만 그린다 — 사고팔기는 정박 중에만 된다.
 *
 * 화물 줄마다 여기서 받는 값을 붙여, 이 항구에서 팔지 다음 항구까지 실고 갈지를 읽게 한다.
 * 식량·물이 화물에 밀리므로 화물을 실었을 때 남는 식량·물의 상한도 함께 보인다 (R53).
 */
export function renderMarket(run: RunState): string {
  const portId = run.player.conveyance === 'ship' ? run.grid.portAt(run.player.cell) : null
  const port = portId === null ? undefined : findPort(portId)
  if (portId === null || port === undefined) {
    return ''
  }
  const { supplies } = run
  const languages = knownLanguages(run.config)
  const market = marketAt(portId, languages)
  const interpreter = languages.has(port.language)
    ? ''
    : ` · ${LANGUAGE_LABELS[port.language]}를 몰라 통역이 뗀다`
  const forSale =
    market.length === 0
      ? '<li class="rl-market__empty">시장이 없다</li>'
      : market
          .map(
            (line, i) =>
              `<li><kbd>${i + 1}</kbd> ${line.good.name} <span class="rl-market__price">${line.price}</span></li>`,
          )
          .join('')
  const held = cargoGoods(supplies)
  const hold =
    held.length === 0
      ? '<li class="rl-market__empty">비었다</li>'
      : held
          .map((goodId, i) => {
            const price = priceAt(portId, goodId, 'sell', languages)
            const offer = price === null ? '못 판다' : `여기서 ${price}`
            return `<li><kbd>⇧${i + 1}</kbd> ${goodName(goodId)} ${supplies.cargo[goodId] ?? 0}톤 <span class="rl-market__price">${offer}</span></li>`
          })
          .join('')
  return `
    <section class="rl-market">
      <h2 class="rl-market__title">${port.name} 시장 · 한 짐 ${TRADE_LOT_TONS}톤 · 값은 톤당 두카트${interpreter}</h2>
      <ol class="rl-market__list">${forSale}</ol>
      <h3 class="rl-market__title">화물 ${cargoTons(supplies.cargo)}/${supplies.holdTons}톤 · 식량·물 상한 ${provisionLimit(supplies).toLocaleString()}</h3>
      <ol class="rl-market__list">${hold}</ol>
    </section>
  `
}
