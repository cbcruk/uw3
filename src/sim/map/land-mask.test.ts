import { describe, expect, it } from 'vite-plus/test'
import { LAND_POLYGONS } from '../../content/world-land'
import { advance, bearingDeg, haversineNm } from '../geo/geo.utils'
import { WORLD_LAND_CELLS_PER_DEGREE } from './land-mask.const'
import { bakeLandMask } from './land-mask'
import type { LandMask } from './land-mask.types'

const mask = bakeLandMask(LAND_POLYGONS, WORLD_LAND_CELLS_PER_DEGREE)

/** 실제 항로처럼 하루 스텝 단위로 걸어가며 전 구간이 바다인지 본다. */
function transitClear(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  step = 3.75,
): boolean {
  const heading = bearingDeg(from, to)
  const steps = Math.ceil(haversineNm(from, to) / step)
  let position = from
  for (let i = 0; i < steps; i += 1) {
    position = advance(position, heading, step)
    if (mask.isLand(position)) {
      return false
    }
  }
  return true
}

describe('육지 마스크', () => {
  it('바다를 바다로, 뭍을 뭍으로 판정한다', () => {
    expect(mask.isLand({ lat: 30, lon: -40 })).toBe(false)
    expect(mask.isLand({ lat: 38.7, lon: -9.5 })).toBe(false)
    expect(mask.isLand({ lat: 38.5, lon: -28.0 })).toBe(false)

    expect(mask.isLand({ lat: 25, lon: 5 })).toBe(true)
    expect(mask.isLand({ lat: 40.4, lon: -3.7 })).toBe(true)
    expect(mask.isLand({ lat: -5, lon: -60 })).toBe(true)
  })

  /** 점 하나가 바다인 것과 해협을 통과할 수 있는 것은 다르다. 통항으로 확인한다. */
  it('좁은 해협을 실제로 통과할 수 있다', () => {
    expect(transitClear({ lat: 35.9, lon: -6.5 }, { lat: 36.0, lon: -4.5 })).toBe(true)
    expect(transitClear({ lat: 50.6, lon: 0.6 }, { lat: 51.4, lon: 2.4 })).toBe(true)
  })

  /** v1의 첫 재현 항해 구간이다 (SPEC 9). 여기가 막히면 아무것도 못 한다. */
  it('리스본에서 아조레스까지 열려 있다', () => {
    expect(transitClear({ lat: 38.6, lon: -9.6 }, { lat: 38.5, lon: -28.0 })).toBe(true)
  })

  it('경도는 날짜변경선을 넘어 감싼다', () => {
    const east = mask.isLand({ lat: 0, lon: 179.9 })
    expect(mask.isLand({ lat: 0, lon: 179.9 + 360 })).toBe(east)
    expect(mask.isLand({ lat: 0, lon: 179.9 - 360 })).toBe(east)
  })

  it('극지 바깥은 육지로 막는다', () => {
    expect(mask.isLand({ lat: 95, lon: 0 })).toBe(true)
    expect(mask.isLand({ lat: -95, lon: 0 })).toBe(true)
  })

  /** SPEC 8.3: 육지 판정은 마이크로초 단위여야 한다. */
  it('질의가 마이크로초 단위다', () => {
    const runs = 200000
    const started = performance.now()
    for (let i = 0; i < runs; i += 1) {
      mask.isLand({ lat: (i % 180) - 90, lon: (i % 360) - 180 })
    }
    const perQueryUs = ((performance.now() - started) * 1000) / runs
    expect(perQueryUs).toBeLessThan(1)
  })

  it('메모리 예산 안에 든다', () => {
    const megabytes = (mask as LandMask).mask.byteLength / 1024 / 1024
    expect(megabytes).toBeLessThan(4)
  })
})
