/**
 * 검증기는 **자료가 쓸 만한가**를 본다. 코드가 맞게 도는가는 테스트가 본다.
 *
 * 이 경계가 중요한 이유: 실패했을 때 어디를 봐야 하는지가 달라진다.
 * 검증기가 빨개지면 `content/`를 고치고, 테스트가 빨개지면 `sim/`을 고친다.
 */
export type Severity = "error" | "warn" | "note";

export interface Finding {
  severity: Severity;
  /** 어느 자료를 봐야 하는지. 파일 이름에 가깝게 적는다. */
  area: string;
  message: string;
}

export interface Check {
  name: string;
  run(): Finding[];
}

export interface ValidationReport {
  findings: readonly Finding[];
  errors: number;
  warnings: number;
  ok: boolean;
}
