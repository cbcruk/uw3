import { describe, expect, it } from 'vite-plus/test'
import { FAME } from '../../content/game/fame.tuning'
import { FAME_TITLES } from '../../content/game/fame-titles'
import { TRADE } from '../../content/game/trade.tuning'
import { createRun, createWorld } from '../run/run'
import type { RunState } from '../run/run.types'
import { addLanguageDocks, fameEarned, fameTitle, learnedLanguages, patronGoldFor } from './fame'

const grid = createWorld()

function arrivedWith(gold: number): RunState {
  const run = createRun(
    {
      seed: 1,
      startDate: { year: 1502, month: 3, day: 14 },
      startPortId: 'lisboa',
      shipClassId: 'caravela-redonda',
    },
    grid,
  )
  run.ended = 'arrived'
  run.supplies.gold = gold
  return run
}

describe('명성과 어학의 환산', () => {
  it('칭호는 문턱 이상인 것 중 가장 높은 것이다', () => {
    expect(fameTitle(0)).toBe(FAME_TITLES[0]?.title)
    const second = FAME_TITLES[1]
    expect(fameTitle(second?.minFame ?? 0)).toBe(second?.title)
    expect(fameTitle(Number.MAX_SAFE_INTEGER)).toBe(FAME_TITLES.at(-1)?.title)
  })

  it('후원금은 명성에 비례하되 음수가 없고 상한에서 멈춘다', () => {
    expect(patronGoldFor(-10)).toBe(0)
    expect(patronGoldFor(10)).toBe(10 * FAME.patronGoldPerFame)
    expect(patronGoldFor(Number.MAX_SAFE_INTEGER)).toBe(FAME.patronGoldMax)
  })

  it('문턱을 넘은 말만 배우고, 모국어는 목록에 넣지 않는다', () => {
    const docks = addLanguageDocks(
      { castilian: FAME.languageDocksToLearn - 1, portuguese: 10 },
      { castilian: 1, arabic: 1 },
    )
    expect(docks).toEqual({ castilian: FAME.languageDocksToLearn, portuguese: 10, arabic: 1 })
    expect(learnedLanguages(docks)).toEqual(['castilian'])
  })

  it('이익의 명성은 이익에 비례하되 상한에서 멈춘다 (R82)', () => {
    const per = FAME.fameGoldDivisor
    expect(fameEarned(arrivedWith(TRADE.startGold + 7 * per), []).profit).toBe(7)
    const atCap = TRADE.startGold + FAME.fameProfitMax * per
    expect(fameEarned(arrivedWith(atCap - 1), []).profit).toBe(FAME.fameProfitMax - 1)
    expect(fameEarned(arrivedWith(atCap), []).profit).toBe(FAME.fameProfitMax)
    expect(fameEarned(arrivedWith(TRADE.startGold + 10_000_000), []).profit).toBe(
      FAME.fameProfitMax,
    )
    const lost = arrivedWith(TRADE.startGold + 10_000_000)
    lost.ended = 'crew-lost'
    expect(fameEarned(lost, []).profit).toBe(0)
  })
})
