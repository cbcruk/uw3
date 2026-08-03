/**
 * 값의 **근거 등급**. SPEC 6은 "수치는 실제 자료에서 온다"고 정했지만,
 * 실제로 그런 값과 감으로 정한 값이 섞여 있다. 섞인 채로 두면 어느 쪽인지 알 수 없고,
 * 알 수 없으면 고칠 우선순위도 못 정한다.
 *
 * 이 등급의 분포가 곧 **이 시뮬레이터의 실제 충실도**다.
 */
export type SourceGrade =
  /** 특정 자료의 수치를 그대로 옮겼다. `source`에 무엇인지 적는다. */
  | "measured"
  /** 방향·순서·대략적 범위는 자료에 근거하나, 정확한 값은 저작했다. */
  | "qualitative"
  /** 근거 없음. 감으로 정했다. */
  | "unverified";

export interface Tuned<T = number> {
  value: T;
  unit: string;
  grade: SourceGrade;
  /** 근거. `unverified`면 무엇을 확인해야 하는지 적는다. */
  source: string;
}

export type TuningTable = Readonly<Record<string, Tuned<unknown>>>;
