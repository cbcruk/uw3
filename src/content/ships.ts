import type { ShipClass } from '../sim/ship/ship.types'

export const SHIP_CLASSES: readonly ShipClass[] = [
  {
    id: 'caravela-latina',
    name: '라틴 카라벨',
    availableFrom: 1440,
    maxSpeedKnots: 7.5,
    capacityTons: 60,
    crewMin: 18,
    crewMax: 30,
    hullPoints: 90,
    masts: 3,
    defaultRig: [
      { sail: 'lateen', area: 1 },
      { sail: 'lateen', area: 1.1 },
      { sail: 'lateen', area: 0.8 },
    ],
  },
  {
    id: 'caravela-redonda',
    name: '혼합 카라벨',
    availableFrom: 1480,
    maxSpeedKnots: 8.2,
    capacityTons: 90,
    crewMin: 24,
    crewMax: 40,
    hullPoints: 120,
    masts: 3,
    defaultRig: [
      { sail: 'square', area: 1.2 },
      { sail: 'lateen', area: 1 },
      { sail: 'lateen', area: 0.7 },
    ],
  },
  {
    id: 'nau',
    name: '나우',
    availableFrom: 1500,
    maxSpeedKnots: 7.8,
    capacityTons: 220,
    crewMin: 40,
    crewMax: 70,
    hullPoints: 200,
    masts: 3,
    defaultRig: [
      { sail: 'square', area: 1.5 },
      { sail: 'square', area: 1.3 },
      { sail: 'lateen', area: 0.8 },
    ],
  },
]

export function findShipClass(id: string): ShipClass | undefined {
  return SHIP_CLASSES.find((shipClass) => shipClass.id === id)
}
