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
  },
});
