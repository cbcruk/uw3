import type { SourceGrade, Tuned, TuningTable } from "./tuning.types";

/**
 * 표에서 값만 뽑아낸다. 시뮬 코드가 `.value`를 달고 다니면 읽기 어려워지고,
 * 읽기 어려워지면 아무도 표를 안 본다.
 */
export function tunedValues<T extends TuningTable>(table: T): { [K in keyof T]: T[K]["value"] } {
  const values = {} as { [K in keyof T]: T[K]["value"] };
  for (const key of Object.keys(table) as (keyof T)[]) {
    values[key] = (table[key] as Tuned<unknown>).value;
  }
  return values;
}

/** 표를 항목 배열로 편다. 곡선·구간처럼 표 밖에 있는 항목과 같이 다루기 위한 것. */
export function tuningEntries(tables: readonly TuningTable[]): Tuned<unknown>[] {
  return tables.flatMap((table) => Object.values(table));
}

/** 등급별 개수. 충실도 부채를 숫자로 본다. */
export function gradeTally(entries: readonly Tuned<unknown>[]): Record<SourceGrade, number> {
  const tally: Record<SourceGrade, number> = { measured: 0, qualitative: 0, unverified: 0 };
  for (const entry of entries) {
    tally[entry.grade] += 1;
  }
  return tally;
}
