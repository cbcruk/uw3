// 헤드리스 충실도 측정. 검증기와 같은 이유로 Vite 모듈 러너를 쓴다
// (scripts/validate.mjs 주석 참조).
//
// `--json`을 주면 기계가 읽을 형태로 낸다. 커밋 간 diff를 뜨는 용도다 —
// 시뮬을 고쳤을 때 어떤 수가 움직였는지가 이 diff에 남는다.
import { createServer } from "vite";

const asJson = process.argv.includes("--json");

const server = await createServer({
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { runHarness } = await server.ssrLoadModule("/src/harness/harness.ts");
  const { formatReport } = await server.ssrLoadModule("/src/harness/report.ts");

  const results = runHarness();

  if (asJson) {
    // 시드별 원자료는 빼고 집계만 낸다. 원자료까지 넣으면 diff가 읽히지 않는다.
    console.log(
      JSON.stringify(
        results.map((result) => ({
          voyageId: result.voyageId,
          fastestRouteId: result.fastestRouteId,
          detourAdvantageDays: result.detourAdvantageDays,
          fidelity: result.fidelity,
          routes: result.routes.map((route) => ({
            id: route.route.id,
            arrivalRate: route.arrivalRate,
            days: route.days,
            distanceNm: route.distanceNm,
            southmostLat: route.southmostLat,
            stalledDays: route.stalledDays,
          })),
        })),
        null,
        2,
      ),
    );
  } else {
    console.log(formatReport(results));
  }
} finally {
  await server.close();
}
