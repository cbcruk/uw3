import type { LatLon } from '../geo/geo.types'
import type { LandMask, LandPolygon, RingBucket } from './land-mask.types'

/**
 * 폴리곤 직접 질의(ray casting)는 질의당 밀리초 단위라 시뮬 중에 쓸 수 없다 (SPEC 4.2).
 * 기동 시 한 번 래스터로 굽고, 실행 중에는 셀 조회만 한다.
 *
 * 주사선(scanline) 방식이다. 위도 행마다 그 행을 가로지르는 변만 보면 되므로,
 * 변을 행 구간별로 미리 담아두면 전체 변을 매 행 훑지 않아도 된다.
 */
function bucketEdges(
  polygons: readonly LandPolygon[],
  height: number,
  cells: number,
): RingBucket[] {
  const buckets: RingBucket[] = Array.from({ length: height }, () => [])

  for (const rings of polygons) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j] as readonly [number, number]
        const b = ring[i] as readonly [number, number]
        if (a[1] === b[1]) {
          continue
        }
        // 행 인덱스는 북에서 남으로 증가한다. 변이 걸치는 행만 담는다.
        const top = Math.min(a[1], b[1])
        const bottom = Math.max(a[1], b[1])
        const firstRow = Math.max(0, Math.floor((90 - bottom) * cells))
        const lastRow = Math.min(height - 1, Math.ceil((90 - top) * cells))
        for (let row = firstRow; row <= lastRow; row += 1) {
          ;(buckets[row] as RingBucket).push([a, b])
        }
      }
    }
  }

  return buckets
}

/** 셀 중심 위도에서 변들과의 교차 경도를 모아 짝지어 채운다 (even-odd). */
function fillRow(
  mask: Uint32Array,
  row: number,
  lat: number,
  edges: RingBucket,
  width: number,
  cells: number,
): void {
  const crossings: number[] = []
  for (const [a, b] of edges) {
    const [ax, ay] = a
    const [bx, by] = b
    if (ay > lat === by > lat) {
      continue
    }
    crossings.push(ax + ((lat - ay) / (by - ay)) * (bx - ax))
  }
  if (crossings.length < 2) {
    return
  }
  crossings.sort((left, right) => left - right)

  const base = row * width
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    const from = crossings[i] as number
    const to = crossings[i + 1] as number
    const startCol = Math.max(0, Math.ceil((from + 180) * cells - 0.5))
    const endCol = Math.min(width - 1, Math.floor((to + 180) * cells - 0.5))
    for (let col = startCol; col <= endCol; col += 1) {
      const bit = base + col
      mask[bit >>> 5] = ((mask[bit >>> 5] ?? 0) | (1 << (bit & 31))) >>> 0
    }
  }
}

/**
 * 전 지구 육지 마스크를 굽는다. `cellsPerDegree`가 해상도를 정한다 —
 * 좁은 해협을 통과시키려면 그 폭보다 셀이 작아야 한다 (SPEC 4.1).
 */
export function bakeLandMask(polygons: readonly LandPolygon[], cellsPerDegree: number): LandMask {
  const width = Math.round(360 * cellsPerDegree)
  const height = Math.round(180 * cellsPerDegree)
  // 셀당 1비트. 1/16°에서 Uint8Array면 16MB인데 비트셋이면 2MB다.
  const mask = new Uint32Array(Math.ceil((width * height) / 32))
  const buckets = bucketEdges(polygons, height, cellsPerDegree)

  for (let row = 0; row < height; row += 1) {
    const lat = 90 - (row + 0.5) / cellsPerDegree
    fillRow(mask, row, lat, buckets[row] as RingBucket, width, cellsPerDegree)
  }

  return {
    cellsPerDegree,
    width,
    height,
    mask,
    isLand({ lat, lon }: LatLon): boolean {
      if (lat > 90 || lat < -90) {
        return true
      }
      const row = Math.min(height - 1, Math.max(0, Math.floor((90 - lat) * cellsPerDegree)))
      // 경도는 순환한다. 날짜변경선을 넘어가도 감싸 준다.
      const wrapped = ((((lon + 180) % 360) + 360) % 360) * cellsPerDegree
      const col = Math.min(width - 1, Math.max(0, Math.floor(wrapped)))
      const bit = row * width + col
      return (((mask[bit >>> 5] ?? 0) >>> (bit & 31)) & 1) === 1
    },
  }
}
