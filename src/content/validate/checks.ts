import { CURRENT_STREAMS } from "../currents";
import { PORTS, PORT_ANCHORAGES } from "../ports";
import { SHIP_CLASSES } from "../ships";
import { HISTORICAL_VOYAGES } from "../voyages";
import { LAND_POLYGONS } from "../world-land";
import { DEBT_BASELINE } from "../tuning/debt-baseline";
import { SAIL_CURVES, SAIL_SCALARS } from "../tuning/sail.tuning";
import { WIND_BANDS, WIND_SCALARS } from "../tuning/wind.tuning";
import { HAZARD_TABLES } from "../tuning/hazards.tuning";
import { LEEWAY_TABLES } from "../tuning/leeway.tuning";
import { VOYAGE_TABLES } from "../tuning/voyage.tuning";
import { GRID_TABLES } from "../game/grid.tuning";
import { MOUNT_TABLES } from "../game/mounts.tuning";
import { TERRAIN_ZONES } from "../game/terrain-zones";
import { gradeTally, tuningEntries } from "../tuning/tuning";
import type { SourceGrade, Tuned } from "../tuning/tuning.types";
import { ROUTE_CELLS_PER_DEGREE, WORLD_LAND_CELLS_PER_DEGREE } from "../../sim/map/land-mask.const";
import { findSeaRoute } from "../../sim/map/sea-route";
import { createTileMap } from "../../sim/map/tile-map";
import type { Check, Finding } from "./validate.types";

/**
 * 수치 표 전부. **새 표를 만들면 여기에 등록해야** 검증과 집계에 걸린다.
 * 등록하지 않은 표는 부채로 세어지지 않으므로, 빠뜨리면 집계가 실제보다 좋아 보인다.
 */
const SCALAR_TABLES = [
  SAIL_SCALARS,
  WIND_SCALARS,
  ...HAZARD_TABLES,
  ...VOYAGE_TABLES,
  ...LEEWAY_TABLES,
];
/** 곡선·구간처럼 값이 수가 아닌 항목. 유한성 검사만 빼고 같은 규칙을 받는다. */
const CURVE_ENTRIES: readonly Tuned<unknown>[] = [...Object.values(SAIL_CURVES), WIND_BANDS];
const ALL_TUNED: readonly Tuned<unknown>[] = [...tuningEntries(SCALAR_TABLES), ...CURVE_ENTRIES];

/**
 * 게임 레이어의 표 (SPEC-roguelike §4). 근거 표기 규칙은 똑같이 받지만 **부채 래칫에는
 * 넣지 않는다** — 저 집계는 시뮬레이터의 충실도이고, 칸 폭 같은 값이 섞이면 분모가 거짓이 된다.
 */
const GAME_SCALAR_TABLES = [...GRID_TABLES, ...MOUNT_TABLES];
const GAME_TUNED: readonly Tuned<unknown>[] = tuningEntries(GAME_SCALAR_TABLES);

/** "모델 내부" 한 마디로는 검토가 안 된다. 무엇의 내부인지까지 적게 한다. */
const MIN_NA_REASON_LENGTH = 12;

function error(area: string, message: string): Finding {
  return { severity: "error", area, message };
}
function warn(area: string, message: string): Finding {
  return { severity: "warn", area, message };
}
function note(area: string, message: string): Finding {
  return { severity: "note", area, message };
}

/**
 * 근거 없는 값이 근거 있는 값인 척하면 대조 자체가 거짓이 된다 (SPEC 3).
 * 등급은 값에 붙은 주장이므로, 주장에 걸맞은 형식을 지키는지 본다.
 */
const tuningAnnotations: Check = {
  name: "튜닝 표 · 근거 표기",
  run(): Finding[] {
    const findings: Finding[] = [];

    for (const entry of [...ALL_TUNED, ...GAME_TUNED]) {
      const label = `${entry.source.slice(0, 40)}…`;
      if (entry.unit.length === 0) {
        findings.push(error("tuning", `단위가 비어 있다: ${label}`));
      }
      if (entry.source.length === 0) {
        findings.push(error("tuning", `출처가 비어 있다 (단위 ${entry.unit})`));
        continue;
      }
      // 자료에서 옮겼다면 무엇에서 옮겼는지가 적혀 있어야 한다.
      if (entry.grade === "measured" && !/[A-Za-z가-힣]{4,}/.test(entry.source)) {
        findings.push(error("tuning", `measured인데 출처가 구체적이지 않다: ${entry.source}`));
      }
      // 감으로 정한 값은 무엇을 확인해야 하는지가 다음 사람의 작업 목록이 된다.
      if (entry.grade === "unverified" && !/감으로 정함|미확인|필요/.test(entry.source)) {
        findings.push(
          error("tuning", `unverified인데 확인할 대상이 적혀 있지 않다: ${entry.source}`),
        );
      }
      // 확인 대상이 아니라는 것은 **주장**이다. 왜인지 없으면 검토할 수 없고,
      // 검토할 수 없으면 이 등급은 부채를 버리는 자리가 된다.
      if (entry.grade === "not-applicable") {
        if (/감으로 정함/.test(entry.source)) {
          findings.push(
            error(
              "tuning",
              `not-applicable인데 이유가 "감으로 정함"이다. 그것은 unverified다: ${entry.source}`,
            ),
          );
        } else if (entry.source.length < MIN_NA_REASON_LENGTH) {
          findings.push(
            error("tuning", `not-applicable인데 왜 확인 대상이 아닌지가 없다: ${entry.source}`),
          );
        }
      }
    }

    for (const table of [...SCALAR_TABLES, ...GAME_SCALAR_TABLES]) {
      for (const [key, entry] of Object.entries(table)) {
        if (!Number.isFinite(entry.value)) {
          findings.push(
            error("tuning", `값이 유한한 수가 아니다: ${key} = ${String(entry.value)}`),
          );
        }
      }
    }

    return findings;
  },
};

/**
 * 부채 래칫 (SPEC 6.1).
 *
 * 이 검사의 목적은 통과가 아니라 **방향을 강제하는 것**이다. 표는 값을 고치기 쉽게
 * 만들지만, 쉬워진 만큼 근거 없는 값을 하나 더 얹기도 쉬워진다. 그쪽 방향을 막는다.
 */
export function debtFindings(
  tally: Readonly<Record<SourceGrade, number>>,
  baseline: Readonly<Record<SourceGrade, number>>,
): Finding[] {
  const verifiable = tally.measured + tally.qualitative + tally.unverified;
  const notApplicable = tally["not-applicable"];
  const percent = verifiable === 0 ? 0 : Math.round((tally.measured / verifiable) * 100);
  const findings: Finding[] = [
    note(
      "tuning",
      `확인 대상 ${verifiable}항목 — measured ${tally.measured} (${percent}%) · ` +
        `qualitative ${tally.qualitative} · unverified ${tally.unverified}`,
    ),
    note("tuning", `확인 대상 아님 ${notApplicable}항목 (합 ${verifiable + notApplicable})`),
  ];

  // 재분류로 부채를 지우는 경로를 막는다. `unverified`를 `not-applicable`로
  // 옮기면 저쪽 래칫은 통과하지만 이쪽에 걸린다.
  if (notApplicable > baseline["not-applicable"]) {
    findings.push(
      error(
        "tuning",
        `확인 대상 아님이 늘었다: not-applicable ${baseline["not-applicable"]} → ${notApplicable}. ` +
          `근거를 못 댈 값인지 다시 보고, 맞다면 debt-baseline.ts를 고쳐라 — ` +
          `이 등급은 부채를 지우는 데 쓰이기 가장 쉽다`,
      ),
    );
  }
  if (notApplicable < baseline["not-applicable"]) {
    findings.push(
      note(
        "tuning",
        `확인 대상 아님이 줄었다: not-applicable ${baseline["not-applicable"]} → ${notApplicable}. ` +
          `debt-baseline.ts를 낮춘다`,
      ),
    );
  }

  if (tally.unverified > baseline.unverified) {
    findings.push(
      error(
        "tuning",
        `근거 없는 값이 늘었다: unverified ${baseline.unverified} → ${tally.unverified}. ` +
          `근거를 대거나, 늘린 이유를 밝히고 debt-baseline.ts를 고쳐라`,
      ),
    );
  }
  if (tally.unverified < baseline.unverified) {
    findings.push(
      note(
        "tuning",
        `부채가 줄었다: unverified ${baseline.unverified} → ${tally.unverified}. ` +
          `debt-baseline.ts를 낮춰 이 자리를 되돌려 쓰지 못하게 한다`,
      ),
    );
  }
  if (tally.measured < baseline.measured) {
    findings.push(
      error(
        "tuning",
        `자료에 근거한 값이 줄었다: measured ${baseline.measured} → ${tally.measured}`,
      ),
    );
  }
  if (tally.measured === 0) {
    findings.push(warn("tuning", "자료에서 옮긴 값이 하나도 없다. 성공 기준은 충실도다 (SPEC 3)"));
  }

  return findings;
}

const debtRatchet: Check = {
  name: "충실도 부채 래칫",
  run: (): Finding[] => debtFindings(gradeTally(ALL_TUNED), DEBT_BASELINE),
};

/**
 * 항구가 외해와 이어지지 않으면 출항 자체가 불가능하다. 두 번 겪은 문제다 —
 * 손으로 그린 해안선에서 한 번, 실제 데이터의 하구 해상도에서 한 번.
 *
 * 도달성은 항로 격자로 본다. 자동 항해가 실제로 쓰는 격자와 같아야 의미가 있다.
 */
const portsUsable: Check = {
  name: "항구 · 정박지 도달성",
  run(): Finding[] {
    const findings: Finding[] = [];
    const seen = new Set<string>();

    for (const port of PORTS) {
      if (seen.has(port.id)) {
        findings.push(error("ports", `항구 id가 중복이다: ${port.id}`));
      }
      seen.add(port.id);
      if (Math.abs(port.anchorage.lat) > 90 || Math.abs(port.anchorage.lon) > 180) {
        findings.push(error("ports", `${port.name}의 정박지 좌표가 범위를 벗어났다`));
      }
    }

    // 실제 항해가 쓰는 격자. 정박지 주변 앞바다가 뚫려 있다.
    const tileMap = createTileMap({
      polygons: LAND_POLYGONS,
      cellsPerDegree: ROUTE_CELLS_PER_DEGREE,
      navigableAnchorages: PORT_ANCHORAGES,
    });
    // 해안선 자료 그대로의 격자. 앞바다를 뚫기 **전**을 봐야 정박지가 실제로
    // 바다에 있는지 알 수 있다. 뚫은 뒤에는 어떤 좌표든 항해 가능해진다.
    //
    // 충돌 해상도로 본다. 배가 실제로 놓이는 곳을 판정하는 격자가 그쪽이고,
    // 더 촘촘한 만큼 하구가 뭍으로 잡히는 것도 이쪽이다.
    const rawMap = createTileMap({
      polygons: LAND_POLYGONS,
      cellsPerDegree: WORLD_LAND_CELLS_PER_DEGREE,
    });
    const openSea = { lat: 30, lon: -40 };

    for (const port of PORTS) {
      // 앞바다 뚫기는 하구 항구를 위한 정당한 장치지만 (SPEC 4.2), 기대는 것과
      // 모르고 의존하는 것은 다르다. 좌표가 아예 내륙이어도 조용히 통과하게 된다.
      if (!rawMap.isNavigable(port.anchorage)) {
        findings.push(
          warn(
            "ports",
            `${port.name}의 정박지가 해안선 자료상 뭍이다. 앞바다 뚫기에 기대고 있다 — ` +
              `의도한 것이면 두고, 아니면 좌표가 틀렸다`,
          ),
        );
      }
      if (findSeaRoute(tileMap, openSea, port.anchorage) === null) {
        findings.push(
          error(
            "ports",
            `${port.name}이 외해에서 닿지 않는다. 정박지를 하구 바깥으로 옮기거나 ` +
              `항로 해상도를 올려야 한다`,
          ),
        );
      }
    }

    return findings;
  },
};

/** 방위 규약이 바람과 반대다 (SPEC 6.2). 부호 하나로 항적이 180° 틀어진다. */
const currentsWellFormed: Check = {
  name: "해류 · 정의",
  run(): Finding[] {
    const findings: Finding[] = [];
    const seen = new Set<string>();

    for (const stream of CURRENT_STREAMS) {
      if (seen.has(stream.name)) {
        findings.push(error("currents", `해류 이름이 중복이다: ${stream.name}`));
      }
      seen.add(stream.name);

      if (stream.toDeg < 0 || stream.toDeg >= 360) {
        findings.push(error("currents", `${stream.name}의 toDeg가 범위 밖이다: ${stream.toDeg}`));
      }
      if (stream.speedKnots <= 0) {
        findings.push(
          error("currents", `${stream.name}의 속력이 0 이하다. 없는 해류는 지우면 된다`),
        );
      }
      if (stream.latSpan <= 0) {
        findings.push(error("currents", `${stream.name}의 latSpan이 0 이하다`));
      }
      if (stream.minLon >= stream.maxLon) {
        findings.push(
          error(
            "currents",
            `${stream.name}의 경도 구간이 뒤집혔다 (${stream.minLon}~${stream.maxLon})`,
          ),
        );
      }
      // 표층 해류가 이보다 빠르면 자료를 잘못 옮긴 것이다.
      if (stream.speedKnots > 5) {
        findings.push(
          warn(
            "currents",
            `${stream.name}이 ${stream.speedKnots}kn다. 표층 해류치고 지나치게 빠르다`,
          ),
        );
      }
    }

    return findings;
  },
};

/**
 * 사료 미확인 기준선은 `null`이다 (SHAPE G2). 그럴듯한 숫자를 채워 넣으면
 * 대조 자체가 거짓이 된다 — 검증되지 않은 기준선은 없느니만 못하다.
 */
const voyagesGrounded: Check = {
  name: "재현 항해 · 기준선",
  run(): Finding[] {
    const findings: Finding[] = [];
    const portIds = new Set(PORTS.map((port) => port.id));

    for (const voyage of HISTORICAL_VOYAGES) {
      for (const [role, id] of [
        ["출발", voyage.startPortId],
        ["도착", voyage.endPortId],
      ] as const) {
        if (!portIds.has(id)) {
          findings.push(error("voyages", `${voyage.name}의 ${role} 항구가 없다: ${id}`));
        }
      }

      const { days, source } = voyage.reference;
      if (days === null) {
        if (!/미확인|필요|찾아야/.test(source)) {
          findings.push(
            error("voyages", `${voyage.name}: 기준선이 없는데 무엇을 찾아야 하는지가 없다`),
          );
        }
        findings.push(note("voyages", `${voyage.name}: 소요 일수 미확인. 대조 불가`));
        continue;
      }
      if (days <= 0) {
        findings.push(error("voyages", `${voyage.name}의 소요 일수가 ${days}일이다`));
      }
      // 숫자를 적었다면 그것은 사료를 봤다는 주장이다. 주장에는 출처가 따라야 한다.
      if (/미확인|추정|대략|아마/.test(source)) {
        findings.push(
          error(
            "voyages",
            `${voyage.name}: 소요 일수 ${days}일을 적어 놓고 출처가 추정이다. ` +
              `확인 못 했으면 null로 두어야 한다 (SHAPE G2)`,
          ),
        );
      }
    }

    return findings;
  },
};

const shipsWellFormed: Check = {
  name: "선급 · 정의",
  run(): Finding[] {
    const findings: Finding[] = [];
    const seen = new Set<string>();

    for (const ship of SHIP_CLASSES) {
      if (seen.has(ship.id)) {
        findings.push(error("ships", `선급 id가 중복이다: ${ship.id}`));
      }
      seen.add(ship.id);

      if (ship.crewMin > ship.crewMax) {
        findings.push(error("ships", `${ship.name}의 승원 범위가 뒤집혔다`));
      }
      if (ship.defaultRig.length === 0) {
        findings.push(error("ships", `${ship.name}에 돛이 없다. 추진력이 0이 된다`));
      }
      // 마스트 수와 기본 장비가 어긋나면 면적 합성이 조용히 틀어진다.
      if (ship.defaultRig.length !== ship.masts) {
        findings.push(
          error(
            "ships",
            `${ship.name}: 마스트 ${ship.masts}개인데 기본 장비는 ${ship.defaultRig.length}개다`,
          ),
        );
      }
      if (ship.maxSpeedKnots <= 0 || ship.hullPoints <= 0 || ship.capacityTons <= 0) {
        findings.push(error("ships", `${ship.name}의 제원에 0 이하인 값이 있다`));
      }
    }

    return findings;
  },
};

/** 게임 레이어는 따로 센다. 시뮬의 래칫에 섞지 않으니 알림만 낸다. */
const gameLayer: Check = {
  name: "게임 레이어 · 표와 지형 구역",
  run(): Finding[] {
    const tally = gradeTally(GAME_TUNED);
    const findings: Finding[] = [
      note(
        "game",
        `게임 표 ${GAME_TUNED.length}항목 (시뮬 집계와 별도) — measured ${tally.measured} · ` +
          `qualitative ${tally.qualitative} · unverified ${tally.unverified} · ` +
          `not-applicable ${tally["not-applicable"]}`,
      ),
    ];
    for (const zone of TERRAIN_ZONES) {
      if (zone.minLat >= zone.maxLat || zone.minLon >= zone.maxLon) {
        findings.push(error("game", `지형 구역의 경계가 뒤집혔다: ${zone.id}`));
      }
    }
    return findings;
  },
};

export const CHECKS: readonly Check[] = [
  tuningAnnotations,
  debtRatchet,
  portsUsable,
  currentsWellFormed,
  voyagesGrounded,
  shipsWellFormed,
  gameLayer,
];
