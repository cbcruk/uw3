import { describe, expect, it } from 'vite-plus/test'
import { currentAt, describeCurrentDirection, groundTrack } from './current'

/** 방위가 대략 그 방향인가. 해류는 갈래들의 합이라 정확히 한 값이 아니다. */
function headsToward(toDeg: number, expectedDeg: number, toleranceDeg = 60): boolean {
  const difference = Math.abs(((toDeg - expectedDeg + 540) % 360) - 180)
  return difference <= toleranceDeg
}

describe('해류 벡터장', () => {
  /**
   * SPEC 3.1: 주요 환류와 대조한다. 방향이 틀리면 재현 항해가 전부 어긋난다.
   * 방위는 **흘러가는 쪽**이다 (바람과 규약이 반대).
   */
  it('주요 해류가 실제 방향으로 흐른다', () => {
    // 북대서양 환류는 시계 방향으로 돈다.
    expect(headsToward(currentAt({ lat: 12, lon: -40 }).toDeg, 280)).toBe(true) // 북적도 서향
    expect(headsToward(currentAt({ lat: 33, lon: -72 }).toDeg, 45)).toBe(true) // 만류 북동향
    expect(headsToward(currentAt({ lat: 48, lon: -30 }).toDeg, 75)).toBe(true) // 북대서양 동향
    expect(headsToward(currentAt({ lat: 27, lon: -18 }).toDeg, 200)).toBe(true) // 카나리아 남향

    // 남대서양 환류는 반시계 방향이다.
    expect(headsToward(currentAt({ lat: -8, lon: -20 }).toDeg, 285)).toBe(true)
    expect(headsToward(currentAt({ lat: -25, lon: -44 }).toDeg, 200)).toBe(true) // 브라질 남향
    expect(headsToward(currentAt({ lat: -25, lon: 11 }).toDeg, 340)).toBe(true) // 벵겔라 북향

    expect(headsToward(currentAt({ lat: -33, lon: 30 }).toDeg, 215)).toBe(true) // 아굴라스 남서향
    expect(headsToward(currentAt({ lat: -55, lon: 0 }).toDeg, 90)).toBe(true) // 남극 순환류 동향
  })

  it('빠른 해류와 느린 해류의 차이가 유지된다', () => {
    const gulfStream = currentAt({ lat: 33, lon: -72 }).speedKnots
    const openOcean = currentAt({ lat: 48, lon: -30 }).speedKnots

    expect(gulfStream).toBeGreaterThan(2)
    expect(openOcean).toBeLessThan(1)
  })

  /** 경계에서 뚝 끊기면 하루 사이에 항적이 꺾여 시뮬이 거짓말처럼 보인다. */
  it('해류는 가장자리로 갈수록 부드럽게 약해진다', () => {
    const speeds = [0, 3, 6, 9, 12].map(
      (offset) => currentAt({ lat: 27 + offset, lon: -18 }).speedKnots,
    )
    for (let i = 1; i < speeds.length; i += 1) {
      const jump = Math.abs((speeds[i] as number) - (speeds[i - 1] as number))
      expect(jump).toBeLessThan(0.5)
    }
  })

  it('환류 바깥 바다는 해류가 없다', () => {
    expect(currentAt({ lat: 0, lon: -30 }).speedKnots).toBeLessThan(0.4)
  })

  it('같은 지점은 항상 같은 해류다', () => {
    expect(currentAt({ lat: 27, lon: -18 })).toEqual(currentAt({ lat: 27, lon: -18 }))
  })

  it('흘러가는 쪽으로 이름 붙인다', () => {
    expect(describeCurrentDirection(0)).toBe('북향')
    expect(describeCurrentDirection(180)).toBe('남향')
    expect(describeCurrentDirection(90)).toBe('동향')
  })
})

describe('대지 항적', () => {
  const eastward = { toDeg: 90, speedKnots: 2, name: '시험류' }

  /** 배는 침로대로 가지 않는다. 이 어긋남이 해류를 넣는 이유 전부다. */
  it('가로지르는 해류는 배를 옆으로 민다', () => {
    const track = groundTrack(0, 4, eastward)

    expect(track.headingDeg).toBeGreaterThan(0)
    expect(track.headingDeg).toBeLessThan(90)
    expect(track.speedKnots).toBeGreaterThan(4)
  })

  it('순류는 빠르게, 역류는 느리게 만든다', () => {
    expect(groundTrack(90, 4, eastward).speedKnots).toBeCloseTo(6, 6)
    expect(groundTrack(270, 4, eastward).speedKnots).toBeCloseTo(2, 6)
    expect(groundTrack(270, 4, eastward).headingDeg).toBeCloseTo(270, 6)
  })

  /** 돛이 죽어도 배는 멈추지 않는다. 표류는 실제 항해의 일부다. */
  it('돛이 죽으면 해류에 그대로 떠밀린다', () => {
    const track = groundTrack(180, 0, eastward)

    expect(track.headingDeg).toBeCloseTo(90, 6)
    expect(track.speedKnots).toBeCloseTo(2, 6)
  })

  it('해류가 돛을 정확히 상쇄하면 제자리다', () => {
    expect(groundTrack(270, 2, eastward).speedKnots).toBeCloseTo(0, 6)
  })
})
