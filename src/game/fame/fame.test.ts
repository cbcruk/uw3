import { describe, expect, it } from 'vite-plus/test'
import { FAME } from '../../content/game/fame.tuning'
import { FAME_TITLES } from '../../content/game/fame-titles'
import { addLanguageDocks, fameTitle, learnedLanguages, patronGoldFor } from './fame'

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
})
