import type { RunRecord } from '../expedition/expedition.types'
import type { Command } from '../run/run.types'

/**
 * 서버에 낼 데일리 기록 하나. 결과는 없다 — 받는 쪽이 다시 돌려 셈한다 (R8).
 *
 * 설정도 없다. 데일리의 설정은 날짜 키에서만 나오므로(R41) 받는 쪽이 키로 다시 만든다.
 */
export interface Submission {
  /** 낸 쪽의 규칙 버전. 받는 쪽의 버전과 다르면 같은 명령이 다른 판이 된다. */
  rules: string
  /** 데일리 날짜 키(`YYYY-MM-DD`, UTC). */
  daily: string
  /** 받아들여진 명령만. 끝난 원정의 `run.commands` 그대로다. */
  commands: Command[]
}

/** 기록을 받지 않은 이유. */
export type RejectReason =
  /** 규칙 버전이 다르다. */
  | 'rules'
  /** 모양이 틀렸다 — 날짜 키·명령의 꼴이 맞지 않는다. */
  | 'malformed'
  /** 다시 돌리니 받아들여지지 않는 명령이 있었다. */
  | 'rejected'
  /** 원정이 끝난 뒤에도 명령이 남았다. */
  | 'trailing'
  /** 명령을 다 돌려도 원정이 끝나지 않았다. */
  | 'unfinished'

/** 재현 검증의 판정. 받으면 다시 돌려 셈한 기록을 낸다 — 낸 쪽이 적은 결과는 없다. */
export type Verdict = { ok: true; record: RunRecord } | { ok: false; reason: RejectReason }
