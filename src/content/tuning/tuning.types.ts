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
  | "unverified"
  /**
   * **확인 대상이 아니다.** 시뮬이 스스로를 운영·표시하기 위한 값이라 현실에
   * 대응물이 없다 — 압력 결합 가중치, 판정 반경, 수치 적분 스텝, 경고 임계 따위.
   *
   * `unverified`와 다르다. 저쪽은 "아직 근거를 못 댔다"이고 이쪽은 "댈 근거가
   * 애초에 없다"이다. 둘을 섞으면 분모가 부풀어 충실도가 실제보다 나빠 보인다.
   *
   * **판정 기준**: 이 값 하나만 놓고 "사료에서 이 수를 찾았다"고 말할 수 있는가?
   * 말할 수 있으면 확인 대상이다. 애매하면 확인 대상으로 둔다 — 이 등급은
   * 부채를 지우는 데 쓰이기 가장 쉬운 등급이므로 보수적으로 붙인다.
   */
  | "not-applicable";

/** 사료로 확인할 수 있는 등급. 충실도의 분모가 되는 것들이다. */
export const VERIFIABLE_GRADES = ["measured", "qualitative", "unverified"] as const;

export interface Tuned<T = number> {
  value: T;
  unit: string;
  grade: SourceGrade;
  /**
   * 근거. 등급마다 적을 것이 다르다.
   * `unverified`면 **무엇을 확인해야 하는지**, `not-applicable`이면
   * **왜 확인 대상이 아닌지**를 적는다.
   */
  source: string;
}

export type TuningTable = Readonly<Record<string, Tuned<unknown>>>;
