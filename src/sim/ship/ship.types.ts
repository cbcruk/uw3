export type SailType = "square" | "lateen";

export interface MastSail {
  sail: SailType;
  area: number;
}

export interface ShipClass {
  id: string;
  name: string;
  availableFrom: number;
  maxSpeedKnots: number;
  capacityTons: number;
  crewMin: number;
  crewMax: number;
  hullPoints: number;
  masts: number;
  defaultRig: readonly MastSail[];
}

export interface SailingCondition {
  hullRatio: number;
  crewRatio: number;
  fatigue: number;
  discipline: number;
}
