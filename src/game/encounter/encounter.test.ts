import { describe, expect, it } from 'vite-plus/test'
import { ENCOUNTER_KINDS } from '../../content/game/encounter-kinds'
import { ENCOUNTER_DENSITY, ENCOUNTER_ZONE_FACTOR } from '../../content/game/encounters.tuning'
import { isWithinNm, sightRadiusNm } from '../fog/fog'
import type { Cell } from '../grid/world-grid.types'
import { regionOf } from '../region/region'
import { createWorld } from '../run/run'
import { spawnEncounters, zoneAt } from './encounter'
import { GRID } from '../../content/game/grid.tuning'

const grid = createWorld()

function regionAt(lat: number, lon: number) {
  return regionOf(grid.cellOf({ lat, lon }) as Cell)
}

const OPEN_ATLANTIC = regionAt(30, -40)
const IBERIA = regionAt(39, -8)
const SAHARA = regionAt(24, 5)
const BARBARY = regionAt(36, 3)

/** 영역의 바다 칸 천 개당 해적 수의 평균. 시드 여럿으로 낸다 — 한 시드로는 밀도를 말할 수 없다. */
function piratesPerThousandSea(region: ReturnType<typeof regionAt>, seeds: number): number {
  let pirates = 0
  for (let seed = 0; seed < seeds; seed += 1) {
    pirates += spawnEncounters(grid, seed, region).filter((e) => e.kind === 'pirate').length
  }
  let sea = 0
  for (let y = region.ry * GRID.regionRows; y < (region.ry + 1) * GRID.regionRows; y += 1) {
    for (let x = region.rx * GRID.regionCols; x < (region.rx + 1) * GRID.regionCols; x += 1) {
      sea += grid.terrainAt({ x, y }) === 'sea' ? 1 : 0
    }
  }
  return (pirates / seeds / sea) * 1000
}

describe('조우 생성 — 시드 × 영역만으로 정해진다', () => {
  it('같은 시드·같은 영역이면 같은 조우가 나온다', () => {
    expect(spawnEncounters(grid, 7, IBERIA)).toEqual(spawnEncounters(grid, 7, IBERIA))
  })

  it('시드가 다르면 배치가 달라진다', () => {
    const cellsOf = (seed: number) =>
      JSON.stringify(spawnEncounters(grid, seed, OPEN_ATLANTIC).map((e) => e.cell))
    expect(cellsOf(1)).not.toBe(cellsOf(2))
  })

  it('종류마다 제 지형에만 놓인다', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      for (const region of [OPEN_ATLANTIC, IBERIA, SAHARA]) {
        for (const encounter of spawnEncounters(grid, seed, region)) {
          const kind = ENCOUNTER_KINDS.find((entry) => entry.id === encounter.kind)
          expect(kind?.terrains).toContain(grid.terrainAt(encounter.cell))
          expect(encounter.crew).toBeGreaterThanOrEqual(kind?.crewMin ?? 0)
          expect(encounter.crew).toBeLessThanOrEqual(kind?.crewMax ?? 0)
        }
      }
    }
  })

  it('항구에서 배의 시야 안에는 놓지 않는다 — 출항한 배가 먼저 보인다', () => {
    const lisboa = grid.cellOfPort('lisboa') as Cell
    for (let seed = 0; seed < 20; seed += 1) {
      for (const { cell } of spawnEncounters(grid, seed, regionOf(lisboa))) {
        expect(isWithinNm(grid, lisboa, cell, sightRadiusNm('ship'))).toBe(false)
      }
    }
  })

  it('한 칸에 둘이 겹치지 않는다', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const keys = spawnEncounters(grid, seed, IBERIA).map((e) => grid.indexOf(e.cell))
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('대양 한복판 영역의 해적 수는 평균적으로 밀도 표 × 구역 배율을 따른다', () => {
    const expected = ENCOUNTER_DENSITY.pirate * ENCOUNTER_ZONE_FACTOR.openAtlanticPirates
    const measured = piratesPerThousandSea(OPEN_ATLANTIC, 400)
    expect(Math.abs(measured - expected) / expected).toBeLessThan(0.2)
  })

  it('사막에는 늑대가 없고 도적은 있다', () => {
    let bandits = 0
    for (let seed = 0; seed < 20; seed += 1) {
      const encounters = spawnEncounters(grid, seed, SAHARA)
      expect(
        encounters.some((e) => e.kind === 'beast' && grid.terrainAt(e.cell) === 'desert'),
      ).toBe(false)
      bandits += encounters.filter((e) => e.kind === 'bandit').length
    }
    expect(bandits).toBeGreaterThan(0)
  })
})

describe('밀도 구역 — 해적은 몰려 있었다', () => {
  it('바르바리 해안 영역의 바다는 대서양 한가운데보다 해적이 훨씬 짙다', () => {
    const barbary = piratesPerThousandSea(BARBARY, 200)
    const atlantic = piratesPerThousandSea(OPEN_ATLANTIC, 200)
    expect(barbary).toBeGreaterThan(atlantic * 5)
  })

  it('구역은 그 종류에만 걸린다 — 바르바리 해안의 늑대·도적은 바탕 밀도다', () => {
    const pirate = ENCOUNTER_KINDS.find((kind) => kind.id === 'pirate')
    const bandit = ENCOUNTER_KINDS.find((kind) => kind.id === 'bandit')
    const cell = grid.cellOf({ lat: 36, lon: 3 }) as Cell
    expect(pirate && zoneAt(grid, pirate, cell)?.id).toBe('barbary')
    expect(bandit && zoneAt(grid, bandit, cell)).toBeNull()
  })

  it('구역이 닿지 않는 영역은 구역을 넣기 전과 같은 조우가 나온다 — 해적 후보가 없는 내륙도', () => {
    // 구역 배율을 넣기 전(main 48c3395)의 결과를 그대로 적어 둔다. 해적 후보가 0칸이어도
    // 개수를 정하는 데 난수 하나를 쓰므로, 빈 무리를 빼면 도적의 자리가 밀린다 (R67).
    const spawned = spawnEncounters(grid, 7, SAHARA).map((e) => [
      e.kind,
      e.cell.x,
      e.cell.y,
      e.crew,
    ])
    expect(spawned).toEqual([
      ['bandit', 735, 398, 18],
      ['bandit', 753, 360, 26],
    ])
  })
})
