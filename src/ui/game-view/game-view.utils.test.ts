import { describe, expect, it } from 'vite-plus/test'
import { createRun, createWorld } from '../../game/run/run'
import type { Cell } from '../../game/grid/world-grid.types'
import { TRADE_LOT_TONS, commandForKey, tradeCommandForKey, withParticle } from './game-view.utils'

describe('키 → 명령', () => {
  it('방향키 하나가 한 칸 이동이다', () => {
    expect(commandForKey('ArrowUp', 'ArrowUp')).toEqual({ type: 'move', dir: 'n' })
    expect(commandForKey('ArrowLeft', 'ArrowLeft')).toEqual({ type: 'move', dir: 'w' })
  })

  it('대각선은 vi 키와 숫자패드로 낸다', () => {
    expect(commandForKey('y', 'KeyY')).toEqual({ type: 'move', dir: 'nw' })
    expect(commandForKey('N', 'KeyN')).toEqual({ type: 'move', dir: 'se' })
    expect(commandForKey('9', 'Numpad9')).toEqual({ type: 'move', dir: 'ne' })
  })

  it('하선·승선·기다림', () => {
    expect(commandForKey('h', 'KeyH')).toEqual({ type: 'disembark', mount: 'horse' })
    expect(commandForKey('c', 'KeyC')).toEqual({ type: 'disembark', mount: 'camel' })
    expect(commandForKey('e', 'KeyE')).toEqual({ type: 'embark' })
    expect(commandForKey('r', 'KeyR')).toEqual({ type: 'hire' })
    expect(commandForKey('f', 'KeyF')).toEqual({ type: 'repair' })
    expect(commandForKey('t', 'KeyT')).toEqual({ type: 'tribute' })
    expect(commandForKey('.', 'Period')).toEqual({ type: 'wait' })
  })

  it('스페이스바는 이동이 아니다', () => {
    expect(commandForKey(' ', 'Space')).toBeNull()
  })
})

describe('시장의 키 — 숫자는 사기, Shift+숫자는 팔기', () => {
  const grid = createWorld()
  const config = {
    seed: 1,
    startDate: { year: 1502, month: 3, day: 1 },
    startPortId: 'angra',
    shipClassId: 'caravela-redonda',
  }

  it('정박 중이면 시장 목록과 화물 목록의 N번째를 한 짐씩 오간다', () => {
    const run = createRun(config, grid)
    expect(tradeCommandForKey('Digit3', false, run)).toEqual({
      type: 'buy',
      goodId: 'woad',
      tons: TRADE_LOT_TONS,
    })
    expect(tradeCommandForKey('Digit9', false, run)).toBeNull()
    expect(tradeCommandForKey('Digit1', true, run)).toBeNull()
    run.supplies.cargo = { salt: 4 }
    expect(tradeCommandForKey('Digit1', true, run)).toEqual({
      type: 'sell',
      goodId: 'salt',
      tons: TRADE_LOT_TONS,
    })
  })

  it('바다에서는 숫자키가 아무 명령도 아니고, 숫자패드는 여전히 이동이다', () => {
    const run = createRun(config, grid)
    run.player.cell = grid.cellOf({ lat: 36, lon: -14 }) as Cell
    expect(tradeCommandForKey('Digit1', false, run)).toBeNull()
    expect(commandForKey('1', 'Digit1')).toBeNull()
  })
})

describe('조사 — 받침에 따라 이/가, 을/를', () => {
  it('받침이 있으면 앞의 것, 없으면 뒤의 것', () => {
    expect(withParticle('해적선', '이', '가')).toBe('해적선이')
    expect(withParticle('도적떼', '이', '가')).toBe('도적떼가')
    expect(withParticle('늑대 무리', '을', '를')).toBe('늑대 무리를')
  })
})
