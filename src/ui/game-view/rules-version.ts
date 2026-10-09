declare const __RULES_VERSION__: string | undefined

/**
 * 이 빌드의 규칙 버전. 빌드 때 `scripts/rules-version.mjs`가 규칙 소스를 해시해 넣는다 (R86).
 *
 * 개발 서버 밖(테스트·검증기)에서는 넣는 쪽이 없어 `'dev'`다.
 */
export const RULES_VERSION: string =
  typeof __RULES_VERSION__ === 'string' ? __RULES_VERSION__ : 'dev'
