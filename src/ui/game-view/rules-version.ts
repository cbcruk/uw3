declare const __RULES_VERSION__: string | undefined

/**
 * 이 빌드의 규칙 버전. `vite.config.ts`의 `define`이 `scripts/rules-version.mjs`의 해시를 넣는다 (R86).
 *
 * 설정 파일 없이 읽힐 때만 넣는 쪽이 없어 `'dev'`다. `vp dev`는 띄울 때 한 번 셈하므로,
 * 띄운 채 규칙 소스를 고치면 다시 띄울 때까지 옛 해시가 붙는다.
 */
export const RULES_VERSION: string =
  typeof __RULES_VERSION__ === 'string' ? __RULES_VERSION__ : 'dev'
