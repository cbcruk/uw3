import { tunedValues } from '../tuning/tuning'
import type { Tuned } from '../tuning/tuning.types'

/**
 * 탈것의 하루 행정 (해리/일). 지형별로 다르다.
 *
 * 게임 레이어의 값이지만 **사료로 확인할 수 있는 값이다.** 대상(隊商)의 하루 행정은
 * 여행기·상업 기록에 남아 있다. 그래서 `not-applicable`로 두지 않는다 (SPEC-roguelike §4).
 */
const MOUNT_SCALARS = {
  horseGrassland: {
    value: 25,
    unit: '해리/일',
    grade: 'qualitative',
    source:
      '14세기 프랑스 도로 여행 하루 24~29해리(Boyer 1951, Speculum; Hall 2026, European Review of Economic History, Table 2). 원정 기병의 행군이 아니라 서두르지 않는 여행이라 값은 그 범위 안에서 저작했다 — docs/sources.md',
  },
  horseDesert: {
    value: 10,
    unit: '해리/일',
    grade: 'qualitative',
    source:
      "카다모스토(c.1455)가 아랍 상인에게 전해 들은 타가자 → 팀북투 'forty days journey on horseback' — 약 788km(현대 지명 간 대권)/40일 ≈ 10.6해리. 전문(傳聞)이고 같은 장의 다른 거리가 틀려 qualitative — docs/sources.md",
  },
  camelGrassland: {
    value: 18,
    unit: '해리/일',
    grade: 'qualitative',
    source:
      '랠프 피치 1583(Hakluyt): 트리폴리(시리아) → 알레포 "with the caravan… in seven days" — 약 123해리(현대 대권)/7일 ≈ 17.6해리. 사막이 아닌 대상로다. 이븐 바투타 왈라타 → 말리(약 15해리)와도 맞는다. 초지 18 < 사막 20은 게임 쪽 선택 — docs/sources.md',
  },
  camelDesert: {
    value: 20,
    unit: '해리/일',
    grade: 'qualitative',
    source:
      '이븐 바투타 1352년 시질마사 → 왈라타: 체류를 빼면 약 47일에 약 1,580km — 직선 18, 경로 20~22해리(Gibb 역 1929, pp. 317–323). 일수는 사료, 거리는 현대 지리라 qualitative — docs/sources.md',
  },
} as const satisfies Record<string, Tuned>

/**
 * 뭍의 하루 물 소모 배율. 바다·초지는 1이다 — 한 사람의 하루치가 1인 시뮬의 단위를 그대로 쓴다.
 *
 * 사막에서는 사람도 더 마시고 탈것도 마신다. 그 몫을 원정의 물에서 함께 떠낸다 — 탈것의 물을
 * 따로 세지 않는다. 낙타가 덜 드는 것은 낙타가 거의 마시지 않기 때문이다 (SPEC-roguelike §25).
 */
const MOUNT_WATER_SCALARS = {
  horseDesertWater: {
    value: 3,
    unit: '배',
    grade: 'unverified',
    source:
      '감으로 정함. 설계 가정: 말은 날마다 우물에서 마시고, 원정이 싣고 다니는 물은 사람 몫(더위에 늘어난)뿐이다. 말의 물까지 실어 나르면 사람 배급의 15~60배다(더운 날 말 70L 이상, MSD 수의학 매뉴얼·NRC 2007) — 사막은 낙타만 건넌다는 사료 쪽 결과 대신 말로도 짧게는 들어가게 두었다 — docs/sources.md',
  },
  camelDesertWater: {
    value: 1.5,
    unit: '배',
    grade: 'qualitative',
    source:
      "레오 아프리카누스: 낙타는 'once in fiue or nine daies'만 마신다(Pory/Brown 1896, vol. 3, pp. 941–942) — 실어 나르는 물은 사람 몫이다. 더위 속 사람 4~5L ÷ 배급 1.5~2L ≈ 2~3배. 1.5는 겨울 횡단의 하한 — docs/sources.md",
  },
} as const satisfies Record<string, Tuned>

export const MOUNT_TABLES = [MOUNT_SCALARS, MOUNT_WATER_SCALARS] as const
export const MOUNT = tunedValues(MOUNT_SCALARS)
export const MOUNT_WATER = tunedValues(MOUNT_WATER_SCALARS)
