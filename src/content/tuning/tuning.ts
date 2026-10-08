import type { SourceGrade, Tuned, TuningTable } from './tuning.types'

/**
 * 표에서 값만 뽑아낸다. 시뮬 코드가 `.value`를 달고 다니면 읽기 어려워지고,
 * 읽기 어려워지면 아무도 표를 안 본다.
 */
export function tunedValues<T extends TuningTable>(table: T): { [K in keyof T]: T[K]['value'] } {
  const values = {} as { [K in keyof T]: T[K]['value'] }
  for (const key of Object.keys(table) as (keyof T)[]) {
    values[key] = (table[key] as Tuned<unknown>).value
  }
  return values
}

/** 표를 항목 배열로 편다. 곡선·구간처럼 표 밖에 있는 항목과 같이 다루기 위한 것. */
export function tuningEntries(tables: readonly TuningTable[]): Tuned<unknown>[] {
  return tables.flatMap((table) => Object.values(table))
}

/** 시뮬 내부 값. 현실에 대응물이 없어 확인 대상이 아니다 — `why`에 왜인지 적는다. */
export function internal<T = number>(value: T, unit: string, why: string): Tuned<T> {
  return { value, unit, grade: 'not-applicable', source: why }
}

/** 등급별 개수. 충실도 부채를 숫자로 본다. */
export function gradeTally(entries: readonly Tuned<unknown>[]): Record<SourceGrade, number> {
  const tally: Record<SourceGrade, number> = {
    measured: 0,
    qualitative: 0,
    unverified: 0,
    'not-applicable': 0,
  }
  for (const entry of entries) {
    tally[entry.grade] += 1
  }
  return tally
}

export interface FidelityDebt {
  tally: Record<SourceGrade, number>
  /** 사료로 확인할 수 있는 값의 수. **이것이 충실도의 분모다.** */
  verifiable: number
  /** 확인 대상이 아닌 값. 분모에 넣으면 충실도가 실제보다 나빠 보인다. */
  notApplicable: number
  total: number
  /** 확인 대상 중 자료에서 옮긴 비율. 확인 대상이 없으면 null. */
  measuredRatio: number | null
}

/**
 * 부채를 분모와 함께 낸다.
 *
 * 분모를 가르는 것이 요점이다. 판정 반경이나 압력 가중치를 "근거 없는 값"에
 * 세면 영원히 갚을 수 없는 부채가 쌓이고, 그러면 수치가 아무것도 말해주지 않는다.
 */
export function fidelityDebt(entries: readonly Tuned<unknown>[]): FidelityDebt {
  const tally = gradeTally(entries)
  const verifiable = tally.measured + tally.qualitative + tally.unverified

  return {
    tally,
    verifiable,
    notApplicable: tally['not-applicable'],
    total: verifiable + tally['not-applicable'],
    measuredRatio: verifiable === 0 ? null : tally.measured / verifiable,
  }
}
