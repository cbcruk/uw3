import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  run: {
    tasks: {
      // 자료 검증. 테스트와 갈라 놓은 이유는 실패했을 때 볼 곳이 다르기 때문이다 —
      // 이쪽이 빨개지면 `content/`를, `vp test`가 빨개지면 `sim/`을 고친다.
      validate: {
        command: "node scripts/validate.mjs",
        cache: false,
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        // 시뮬 규칙에 새 수치가 코드로 스며드는 것을 막는다 (SPEC 6.1).
        //
        // 3단계의 래칫은 **표 안에서** 부채가 느는 것을 막는다. 이 규칙은 값이
        // 아예 **표 밖으로 새는 것**을 막는다. 표를 우회하면 근거 등급도 없고
        // 집계에도 안 잡혀서, 부채가 없는 것처럼 보이게 된다.
        //
        // 이름을 붙인 상수(`const FOO = 3`)는 통과한다. 막는 것은 식 안에 박힌
        // 익명의 수다 — 그것이 나중에 아무도 못 찾는 값이 된다.
        //
        // 여기 없는 시뮬 디렉터리(`geo` `calendar` `rng` `map`)는 **수학 기반**이다.
        // 지구 반지름·1도=60해리·2^32·비트 자리수는 조정 대상이 아니라 정의이고,
        // 표에 넣으면 근거 등급을 달 수 없는 행이 생긴다. 그 경계를 지키려고
        // `wind.utils.ts`를 `rng/noise.ts`와 `geo`로 갈라 옮겼다 — 값 잡음과 각도
        // 계산이 `wind/` 안에 있으면 그 상수가 풍계 튜닝 값으로 읽힌다.
        files: [
          "src/sim/voyage/**",
          "src/sim/ship/**",
          "src/sim/wind/**",
          "src/sim/current/**",
          "src/sim/fog/**",
        ],
        rules: {
          "no-magic-numbers": [
            "error",
            {
              // 0·1·2는 수치가 아니라 구조다 — clamp 경계, 인덱스, 반/두 배.
              // 표로 빼면 오히려 읽기 어려워진다.
              ignore: [0, 1, 2],
              ignoreArrayIndexes: true,
              ignoreDefaultValues: true,
            },
          ],
        },
      },
      {
        // 테스트는 기대값을 숫자로 적는 것이 일이다. 상수로 빼면 무엇을 검증하는지
        // 오히려 안 보인다.
        files: ["**/*.test.ts"],
        rules: { "no-magic-numbers": "off" },
      },
    ],
  },
});
