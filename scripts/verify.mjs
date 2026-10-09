// 데일리 기록 재현 검증 — 서버가 할 일을 손으로 해 본다 (SPEC-roguelike §39).
//
// 받은 결과는 믿지 않는다. 날짜 키로 설정을 다시 만들고 명령을 다시 돌려 기록을 셈한다.
// 규칙 버전은 지금 체크아웃의 소스에서 낸다 — 기록의 버전과 다르면 돌리지 않는다.
//
//   vp run verify -- 기록.json …     제출 형식 하나 또는 그 배열
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { rulesVersion } from './rules-version.mjs'

const files = process.argv.slice(2).filter((arg) => arg !== '--')
if (files.length === 0) {
  console.error('usage: vp run verify -- <submission.json> …')
  process.exit(2)
}

const rules = rulesVersion()
console.log(`rules ${rules}`)

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { verifySubmission } = await server.ssrLoadModule('/src/game/daily/submission.ts')
  const { createWorld } = await server.ssrLoadModule('/src/game/run/run.ts')
  const grid = createWorld()
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    for (const submission of Array.isArray(parsed) ? parsed : [parsed]) {
      const verdict = verifySubmission(submission, rules, grid)
      const label = `${file} ${submission?.daily ?? '?'}`
      if (verdict.ok) {
        const { outcome, days, crewLeft, gold } = verdict.record
        console.log(`ok  ${label} ${outcome} ${days}일 선원 ${crewLeft} 금화 ${gold}`)
      } else {
        console.log(`bad ${label} ${verdict.reason}`)
        process.exitCode = 1
      }
    }
  }
} finally {
  await server.close()
}
