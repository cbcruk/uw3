import type { LanguageId } from '../../content/content.types'

/** 말마다 그 말을 쓰는 항구에 들른 횟수. 원정마다 항구 하나에 한 번 센다. */
export type LanguageDocks = Partial<Record<LanguageId, number>>

/** 끝난 원정 하나가 번 명성의 내역. 기록과 화면이 쓴다. */
export interface FameGain {
  arrived: number
  defeated: number
  discovery: number
  profit: number
  total: number
}
