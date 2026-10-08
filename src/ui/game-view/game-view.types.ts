import type { Command, RunConfig } from '../../game/run/run.types'

/** 키 하나가 내는 명령. 명령이 아닌 키면 `null`. */
export type KeyBinding = (key: string, code: string) => Command | null

export interface LogLine {
  text: string
  tone: 'info' | 'warn' | 'good' | 'bad'
}

/** 저장해 둔 진행 중 원정. 재현으로 되살린다. */
export interface SavedRun {
  config: RunConfig
  commands: Command[]
  /** 데일리면 그 날짜 키. */
  daily: string | null
}
