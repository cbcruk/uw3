export type RngStreamName = "rivals" | "voyage" | "economy" | "combat";

export interface Rng {
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
  range(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T;
  getState(): number;
  setState(state: number): void;
}

export type RngSet = Readonly<Record<RngStreamName, Rng>>;

export type RngSnapshot = Record<RngStreamName, number>;
