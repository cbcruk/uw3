// 검증기를 Vite의 모듈 러너로 돌린다.
//
// 왜 `node`로 직접 못 돌리는가: 시뮬 코드는 확장자 없는 TS 임포트를 쓴다.
// Node의 타입 스트리핑은 그것을 해석하지 못하고, Vitest 4는 vite-node를 걷어냈다.
// Vite 자신에게 시키면 앱과 **똑같은 해석 규칙**으로 읽는다 — 의존성도 안 는다.
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { runValidation, formatReport } = await server.ssrLoadModule(
    '/src/content/validate/validate.ts',
  )

  const report = runValidation()
  console.log(formatReport(report))

  if (!report.ok) {
    process.exitCode = 1
  }
} finally {
  await server.close()
}
