import landTopology from 'world-atlas/land-50m.json'
import { feature } from 'topojson-client'
import type { LandPolygon } from '../sim/map/land-mask.types'

interface RawGeometry {
  type: string
  coordinates: unknown
}

interface RawCollection {
  features?: { geometry: RawGeometry }[]
  geometry?: RawGeometry
}

/**
 * Natural Earth 1:50m 해안선. 해상도 선택 근거는 SPEC 4.1 — 110m는 근해가 뭉개지고
 * 10m는 보스포루스가 실제 폭으로 좁아진다. 50m가 필요한 해협을 전부 열어주는 최소치다.
 *
 * world-atlas의 TopoJSON 타입은 느슨하다. 경계에서 한 번만 좁히고 아래로는 정확한 타입을 넘긴다.
 */
export const LAND_POLYGONS: readonly LandPolygon[] = (() => {
  const topology = landTopology as unknown as Parameters<typeof feature>[0]
  const collection = feature(topology, topology.objects.land as never) as unknown as RawCollection
  const geometries =
    collection.features === undefined
      ? [collection.geometry]
      : collection.features.map((entry) => entry.geometry)

  const polygons: LandPolygon[] = []
  for (const geometry of geometries) {
    if (geometry === undefined) {
      continue
    }
    if (geometry.type === 'Polygon') {
      polygons.push(geometry.coordinates as LandPolygon)
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates as LandPolygon[]) {
        polygons.push(polygon)
      }
    }
  }
  return polygons
})()
