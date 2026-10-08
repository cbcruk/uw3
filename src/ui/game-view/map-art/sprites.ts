import type { PixelSprite } from './map-art.types'

const SKIN = '#f0c8a0'

/** 말 탄 사람. 오른쪽을 본다. `t` 옷, `h` 말, `m` 갈기·꼬리. */
const RIDER_ROWS = [
  '......ss......',
  '.....tttt.....',
  '.....tttt...mh',
  '......tt...hhh',
  '.mhhhhhhhhhhh.',
  'mhhhhhhhhhhh..',
  'm.hhhhhhhhh...',
  '..h.h....h.h..',
  '..h.h....h.h..',
] as const

/** 낙타 탄 사람. 혹 위에 앉고, 목이 길게 앞으로 나온다. */
const CAMEL_ROWS = [
  '.....ss.......',
  '....tttt....hh',
  '....tttt...hhh',
  '...hhtthh..h..',
  '..hhhhhhhhhh..',
  '.hhhhhhhhhh...',
  '.h.hhhhhhh....',
  '...h.h..h.h...',
  '...h.h..h.h...',
  '...h.h..h.h...',
] as const

/** 늑대 무리. 앞의 하나와 뒤에 반쯤 가린 하나. `e` 눈. */
const WOLF_ROWS = [
  '...........g.g',
  '..g.g.....gggg',
  '.gggg.....ggeg',
  'ggegggggggggg.',
  '.gggg.gggggg..',
  '..g.g.g.g.g.g.',
  '......g.g.g.g.',
] as const

/** 항구: 붉은 지붕 집 하나와 깃발, 아래에 잔교. */
const PORT_ROWS = [
  '.......pff..',
  '.......pff..',
  '.......p....',
  '...rrrrrrr..',
  '..rrrrrrrrr.',
  '.rrrrrrrrrrr',
  '..wwwwwwwww.',
  '..wwdwwwdww.',
  '..wwdwwwdww.',
  'bbbbbbbbbbbb',
  '.b..b..b..b.',
] as const

export const SPRITES = {
  horse: { rows: RIDER_ROWS, palette: { s: SKIN, t: '#f2c45a', h: '#f2ead6', m: '#b8a888' } },
  camel: { rows: CAMEL_ROWS, palette: { s: SKIN, t: '#f2c45a', h: '#d89848' } },
  bandit: { rows: RIDER_ROWS, palette: { s: SKIN, t: '#c83c30', h: '#5a3a24', m: '#2a1a10' } },
  beast: { rows: WOLF_ROWS, palette: { g: '#9a968c', e: '#f0d040' } },
  port: {
    rows: PORT_ROWS,
    palette: { p: '#3a2a1a', f: '#e04030', r: '#c84830', w: '#f4ecd8', d: '#5a3a24', b: '#8a6a3a' },
  },
} as const satisfies Record<string, PixelSprite>
