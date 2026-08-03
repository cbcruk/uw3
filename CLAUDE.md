<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## 설계 문서

- `SPEC.md` — 무엇을 만드는가. 판단이 흔들리면 여기로 돌아온다
- `SHAPE.md` — **표로 바꿀 수 없는 것들.** 결과가 안 맞을 때 여기를 먼저 본다
- `SPEC-uw3-game.md` — 보류된 게임 노선. 기록용

### 결과가 안 맞을 때의 순서

1. `SHAPE.md`에서 관련 구조를 찾는다
2. 그 구조가 원인일 수 있으면 **튜닝을 멈춘다.** 표를 아무리 고쳐도 안 나온다
3. 아니면 값의 문제다. 값이 코드에 박혀 있으면 **먼저 표로 뺀다**

코드에 상태 필드나 호출 순서를 추가했다면 `SHAPE.md`에 한 줄을 추가한다.
적지 않으면 다음 사람은 그것이 조정 가능한 줄 알고 몇 주를 쓴다.
