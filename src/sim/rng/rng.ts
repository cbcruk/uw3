import type { Rng, RngSet, RngSnapshot, RngStreamName } from './rng.types'

export const RNG_STREAM_NAMES: readonly RngStreamName[] = ['rivals', 'voyage', 'economy', 'combat']

export function hashString(text: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

export function mixSeed(seed: number, salt: number): number {
  let value = (seed ^ salt) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad) >>> 0
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97) >>> 0
  return (value ^ (value >>> 15)) >>> 0
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int(minInclusive: number, maxExclusive: number): number {
      return minInclusive + Math.floor(next() * (maxExclusive - minInclusive))
    },
    range(min: number, max: number): number {
      return min + next() * (max - min)
    },
    chance(probability: number): boolean {
      return next() < probability
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)]
      if (item === undefined) {
        throw new Error('cannot pick from an empty list')
      }
      return item
    },
    weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
      const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0)
      if (total <= 0) {
        throw new Error('cannot pick from a zero-weight list')
      }
      let roll = next() * total
      for (const item of items) {
        roll -= Math.max(0, weightOf(item))
        if (roll <= 0) {
          return item
        }
      }
      return items[items.length - 1] as T
    },
    getState(): number {
      return state
    },
    setState(nextState: number): void {
      state = nextState >>> 0
    },
  }
}

export function createRngSet(seed: number): RngSet {
  const streams = {} as Record<RngStreamName, Rng>
  for (const name of RNG_STREAM_NAMES) {
    streams[name] = createRng(mixSeed(seed, hashString(name)))
  }
  return streams
}

export function snapshotRngSet(streams: RngSet): RngSnapshot {
  const snapshot = {} as RngSnapshot
  for (const name of RNG_STREAM_NAMES) {
    snapshot[name] = streams[name].getState()
  }
  return snapshot
}

export function restoreRngSet(streams: RngSet, snapshot: RngSnapshot): void {
  for (const name of RNG_STREAM_NAMES) {
    streams[name].setState(snapshot[name])
  }
}
