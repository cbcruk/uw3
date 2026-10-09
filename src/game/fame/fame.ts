import { FAME } from '../../content/game/fame.tuning'
import { FAME_TITLES } from '../../content/game/fame-titles'
import { TRADE } from '../../content/game/trade.tuning'
import type { LanguageId } from '../../content/content.types'
import { findPort } from '../../content/ports'
import type { RunState } from '../run/run.types'
import { NATIVE_LANGUAGE } from '../trade/trade'
import type { FameGain, LanguageDocks } from './fame.types'

/**
 * 끝난 원정이 번 명성. 메타에 더하기 전에 계산한다 — 처음 들어간 항구는 메타에 없던 것만 센다.
 *
 * 죽어도 물리친 조우와 처음 들어간 항구의 몫은 남는다 (R42). 도착과 이익의 몫은 도착한 원정만 받는다 —
 * 가라앉은 배의 금화는 없는 금화다. 이익의 몫은 `fameProfitMax`에서 멈춘다 (R82).
 */
export function fameEarned(run: RunState, knownPortIds: readonly string[]): FameGain {
  const known = new Set(knownPortIds)
  const arrived = run.ended === 'arrived' ? FAME.fameArrived : 0
  const defeated = run.defeated * FAME.fameDefeated
  const discovery = [...run.dockedPorts].filter((id) => !known.has(id)).length * FAME.fameDiscovery
  const startGold = TRADE.startGold + (run.config.patronGold ?? 0)
  const profit =
    run.ended === 'arrived'
      ? Math.min(
          FAME.fameProfitMax,
          Math.floor(Math.max(0, run.supplies.gold - startGold) / FAME.fameGoldDivisor),
        )
      : 0
  return { arrived, defeated, discovery, profit, total: arrived + defeated + discovery + profit }
}

/** 명성이 출항 금화에 더하는 후원금. 상한이 있다. */
export function patronGoldFor(fame: number): number {
  return Math.min(FAME.patronGoldMax, Math.floor(Math.max(0, fame) * FAME.patronGoldPerFame))
}

/** 명성의 칭호. 문턱 이상인 것 중 가장 높은 것. */
export function fameTitle(fame: number): string {
  return FAME_TITLES.findLast((entry) => fame >= entry.minFame)?.title ?? ''
}

/** 이 원정에서 들어간 항구를 말마다 센다. 같은 원정에서 같은 항구는 한 번이다. */
export function languageDocksOf(run: RunState): LanguageDocks {
  const docks: LanguageDocks = {}
  for (const portId of run.dockedPorts) {
    const language = findPort(portId)?.language
    if (language !== undefined) {
      docks[language] = (docks[language] ?? 0) + 1
    }
  }
  return docks
}

/** 두 집계를 더한다. 새 값을 돌려준다. */
export function addLanguageDocks(base: LanguageDocks, extra: LanguageDocks): LanguageDocks {
  const sum: LanguageDocks = { ...base }
  for (const [language, count] of Object.entries(extra) as [LanguageId, number][]) {
    sum[language] = (sum[language] ?? 0) + count
  }
  return sum
}

/** 배운 말. 모국어는 늘 알아서 넣지 않는다. 순서는 말 이름 순이라 같은 메타면 같은 설정이다 (R8). */
export function learnedLanguages(docks: LanguageDocks): LanguageId[] {
  return (Object.entries(docks) as [LanguageId, number][])
    .filter(
      ([language, count]) => language !== NATIVE_LANGUAGE && count >= FAME.languageDocksToLearn,
    )
    .map(([language]) => language)
    .sort()
}
