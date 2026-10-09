// 규칙 버전 — 같은 명령이 같은 판이 되는 범위의 해시 (SPEC-roguelike R86).
//
// 화면(`src/ui`)은 넣지 않는다. 그림을 고친 배포가 같은 날의 데일리 기록을 가르지 않게 한다.
// 자료 검증기(`content/validate`)와 테스트도 판을 바꾸지 않으므로 뺀다.
// 해안선은 npm 패키지에서 오므로 그 버전을 함께 넣는다.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RULE_DIRS = ['src/sim', 'src/game', 'src/content']
const EXCLUDED_DIRS = ['src/content/validate']
const DATA_PACKAGES = ['world-atlas', 'topojson-client']
const DIGEST_LENGTH = 12
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))

/** 규칙 소스의 내용 해시. 파일 경로와 내용을 정렬된 순서로 섞는다. */
export function rulesVersion(root = REPO_ROOT) {
  const hash = createHash('sha256')
  for (const file of RULE_DIRS.flatMap((dir) => sourcesUnder(root, join(root, dir))).sort(byPath)) {
    // 줄바꿈을 LF로 맞춘다 — CRLF로 체크아웃한 기계에서도 같은 소스면 같은 해시다.
    const text = readFileSync(join(root, file), 'utf8').replaceAll('\r\n', '\n')
    hash.update(file).update('\0').update(text).update('\0')
  }
  for (const name of DATA_PACKAGES) {
    const { version } = JSON.parse(
      readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'),
    )
    hash.update(`${name}@${version}\0`)
  }
  return hash.digest('hex').slice(0, DIGEST_LENGTH)
}

function byPath(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function sourcesUnder(root, dir) {
  const rel = relative(root, dir).split(sep).join('/')
  if (EXCLUDED_DIRS.includes(rel)) {
    return []
  }
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return sourcesUnder(root, path)
    }
    const isSource = entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')
    return isSource ? [relative(root, path).split(sep).join('/')] : []
  })
}
