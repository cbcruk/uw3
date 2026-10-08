import { describe, expect, it } from 'vite-plus/test'
import { computeSpeedKnots, effectiveWindKnots, rigThrust, sailEfficiency } from './sail'
import type { MastSail, SailingCondition, ShipClass } from './ship.types'

const HEALTHY: SailingCondition = {
  hullRatio: 1,
  crewRatio: 1,
  fatigue: 0,
  discipline: 1,
}

const TEST_SHIP: ShipClass = {
  id: 'test',
  name: '시험선',
  availableFrom: 1500,
  maxSpeedKnots: 8,
  capacityTons: 100,
  crewMin: 20,
  crewMax: 40,
  hullPoints: 100,
  masts: 2,
  defaultRig: [
    { sail: 'square', area: 1 },
    { sail: 'lateen', area: 1 },
  ],
}

describe('sailEfficiency', () => {
  it('어떤 돛도 정풍에서는 추진력이 없다', () => {
    expect(sailEfficiency('square', 0)).toBe(0)
    expect(sailEfficiency('lateen', 0)).toBe(0)
  })

  /** SPEC 8.2: 삼각돛은 역풍에 유리하고 순풍에 둔하다. */
  it('역풍 대각에서는 라틴돛이, 순풍에서는 가로돛이 우세하다', () => {
    expect(sailEfficiency('lateen', 50)).toBeGreaterThan(sailEfficiency('square', 50))
    expect(sailEfficiency('square', 170)).toBeGreaterThan(sailEfficiency('lateen', 170))
  })

  it('가로돛은 60도 안쪽에서 무력하다', () => {
    expect(sailEfficiency('square', 45)).toBe(0)
    expect(sailEfficiency('lateen', 45)).toBeGreaterThan(0.3)
  })

  it('각 돛의 최댓값은 1을 넘지 않는다', () => {
    for (let angle = 0; angle <= 180; angle += 1) {
      expect(sailEfficiency('square', angle)).toBeLessThanOrEqual(1)
      expect(sailEfficiency('lateen', angle)).toBeLessThanOrEqual(1)
    }
  })
})

describe('rigThrust', () => {
  it('돛을 접으면 추진력이 줄어든다', () => {
    const rig: MastSail[] = [
      { sail: 'square', area: 1 },
      { sail: 'square', area: 1 },
    ]
    const full = rigThrust(rig, [true, true], 150)
    const half = rigThrust(rig, [true, false], 150)
    expect(half).toBeCloseTo(full / 2, 5)
  })

  it('모든 돛을 접으면 0', () => {
    expect(rigThrust(TEST_SHIP.defaultRig, [false, false], 150)).toBe(0)
  })
})

describe('effectiveWindKnots', () => {
  /** SPEC 4.2: 강풍이 무한정 이득이 되면 안 된다. 축범해야 한다. */
  it('일정 풍속을 넘으면 유효 풍속이 오히려 줄어든다', () => {
    expect(effectiveWindKnots(20)).toBe(20)
    expect(effectiveWindKnots(40)).toBeLessThan(effectiveWindKnots(26))
    expect(effectiveWindKnots(60)).toBeGreaterThanOrEqual(6)
  })
})

describe('computeSpeedKnots', () => {
  it('정풍에서는 전진하지 못한다', () => {
    const speed = computeSpeedKnots({
      shipClass: TEST_SHIP,
      rig: TEST_SHIP.defaultRig,
      sailsSet: [true, true],
      relAngleDeg: 0,
      windSpeedKnots: 15,
      condition: HEALTHY,
    })
    expect(speed).toBe(0)
  })

  it('피로와 손상은 속력을 떨어뜨린다', () => {
    const base = {
      shipClass: TEST_SHIP,
      rig: TEST_SHIP.defaultRig,
      sailsSet: [true, true],
      relAngleDeg: 130,
      windSpeedKnots: 15,
    }
    const healthy = computeSpeedKnots({ ...base, condition: HEALTHY })
    const worn = computeSpeedKnots({
      ...base,
      condition: { hullRatio: 0.4, crewRatio: 0.5, fatigue: 0.8, discipline: 0.3 },
    })
    expect(worn).toBeLessThan(healthy * 0.6)
    expect(worn).toBeGreaterThan(0)
  })

  it('선급 최고 속력을 크게 넘지 않는다', () => {
    const speed = computeSpeedKnots({
      shipClass: TEST_SHIP,
      rig: TEST_SHIP.defaultRig,
      sailsSet: [true, true],
      relAngleDeg: 150,
      windSpeedKnots: 26,
      condition: HEALTHY,
    })
    expect(speed).toBeLessThanOrEqual(TEST_SHIP.maxSpeedKnots * 1.15)
  })
})
