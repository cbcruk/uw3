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
- `SPEC-roguelike.md` — 시뮬 위에 얹는 로그라이크 레이어(`src/game/`). 메르카토르 격자·영역·배/말/낙타
- `SPEC-uw3-game.md` — 보류된 게임 노선. 기록용
- `docs/egress-request.md` — 사료 원문이 막혀 있다. `measured`가 0인 이유
- `db/` — 원작 도시·발견물·도서 표. 항구·발견물을 늘릴 때 **고르는** 목록이다. 좌표는 옮기지 않는다 (`db/README.md`)

### 결과가 안 맞을 때의 순서

1. `SHAPE.md`에서 관련 구조를 찾는다
2. 그 구조가 원인일 수 있으면 **튜닝을 멈춘다.** 표를 아무리 고쳐도 안 나온다
3. 아니면 값의 문제다. 값이 코드에 박혀 있으면 **먼저 표로 뺀다**

코드에 상태 필드나 호출 순서를 추가했다면 `SHAPE.md`에 한 줄을 추가한다.
적지 않으면 다음 사람은 그것이 조정 가능한 줄 알고 몇 주를 쓴다.

## 검증

`vp test`와 `vp run validate`는 보는 것이 다르다. 실패했을 때 열 파일이 갈린다.

| 명령              | 보는 것            | 빨개지면 고칠 곳 |
| ----------------- | ------------------ | ---------------- |
| `vp test`         | 코드가 맞게 도는가 | `src/sim/`       |
| `vp run validate` | 자료가 쓸 만한가   | `src/content/`   |

`vp run harness`는 세 번째다 — **통과·실패가 없다.** 시뮬을 여러 시드로 돌려
수치를 낼 뿐이고, 읽는 것은 사람이다. 물리나 표를 건드렸으면 전후로 돌려
무엇이 움직였는지 본다 (`-- --json`으로 diff 뜨기 좋은 형태).

단일 시드로 충실도를 판단하지 않는다. SPEC 3.3의 표가 한 번 그렇게 틀렸다.

수치를 새로 넣을 때:

1. 코드에 박지 말고 `content/tuning/`의 표에 넣는다
2. **근거 등급을 단다** — `measured` / `qualitative` / `unverified`, 그리고
   현실에 대응물이 없으면 `not-applicable`(판정 반경·압력 가중치·적분 스텝 따위).
   판정: 이 값 하나만 놓고 "사료에서 이 수를 찾았다"고 말할 수 있는가?
   애매하면 확인 대상에 남긴다 — 이 등급은 부채를 지우는 데 쓰이기 가장 쉽다
3. 새 표를 만들었으면 `content/validate/checks.ts`의 `SCALAR_TABLES`에 등록한다.
   등록하지 않으면 부채 집계에 잡히지 않아 실제보다 좋아 보인다
4. `unverified`가 늘면 검증기가 막는다. `not-applicable`이 늘어도 막는다 —
   등급을 바꿔 부채를 지우는 경로다. 늘려야 한다면 `debt-baseline.ts`를 함께
   고치고, 그 diff로 무엇을 늘렸는지를 남긴다

`voyage` `ship` `wind` `current` `fog`에는 **식 안에 숫자를 못 박는다**
(`no-magic-numbers`). 0·1·2와 이름 붙인 상수는 통과한다. 걸리면 둘 중 하나다.

- **조정 가능한 값이면** → `content/tuning/`의 표로
- **정의이거나 임의의 수면** → 이름 붙인 상수로. 왜 표가 아닌지를 주석에 적는다
  (예: 잡음 층 오프셋은 바꿔도 통계가 그대로라 근거 등급을 달 수 없다)

`geo` `calendar` `rng` `map`은 수학 기반이라 이 규칙에서 빠져 있다. 거기에 튜닝
값을 두면 규칙을 우회하게 되므로, 그런 값이 생기면 파일을 옮긴다.
