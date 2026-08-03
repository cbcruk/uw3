import { CURRENT_STREAMS } from "../../content/currents";
import type { LatLon } from "../geo/geo.types";
import { normalizeHeading } from "../geo/geo.utils";
import type { Current, CurrentStream } from "./current.types";

const DEG = Math.PI / 180;
/** 경도 구간 밖으로 이만큼까지는 서서히 약해지며 이어진다. */
const LON_FEATHER_DEG = 6;

function span(value: number, center: number, half: number): number {
  const distance = Math.abs(value - center);
  return distance >= half ? 0 : Math.cos(((distance / half) * Math.PI) / 2);
}

/** 경도는 순환한다. 중심 기준 최단 차이로 잰다. */
function lonWeight(lon: number, stream: CurrentStream): number {
  if (stream.maxLon - stream.minLon >= 360) {
    return 1;
  }
  const center = (stream.minLon + stream.maxLon) / 2;
  const half = (stream.maxLon - stream.minLon) / 2;
  const difference = Math.abs(((lon - center + 540) % 360) - 180);
  if (difference <= half) {
    return 1;
  }
  const beyond = difference - half;
  return beyond >= LON_FEATHER_DEG ? 0 : 1 - beyond / LON_FEATHER_DEG;
}

/**
 * 그 지점의 표층 해류. 갈래들의 벡터 합이다.
 *
 * 가장자리에서 뚝 끊지 않고 부드럽게 약해진다 — 경계를 넘는 하루 사이에 항적이
 * 꺾이면 시뮬이 거짓말처럼 보인다. 난수는 없다. 같은 지점은 항상 같은 해류다 (SPEC 8.1).
 */
export function currentAt(position: LatLon): Current {
  let east = 0;
  let north = 0;
  let strongest = 0;
  let name = "무해류";

  for (const stream of CURRENT_STREAMS) {
    const weight = span(position.lat, stream.lat, stream.latSpan) * lonWeight(position.lon, stream);
    if (weight <= 0) {
      continue;
    }
    const speed = stream.speedKnots * weight;
    east += speed * Math.sin(stream.toDeg * DEG);
    north += speed * Math.cos(stream.toDeg * DEG);
    if (speed > strongest) {
      strongest = speed;
      name = stream.name;
    }
  }

  const speedKnots = Math.hypot(east, north);
  if (speedKnots < 0.01) {
    return { toDeg: 0, speedKnots: 0, name: "무해류" };
  }
  return { toDeg: normalizeHeading(Math.atan2(east, north) / DEG), speedKnots, name };
}

/**
 * 돛이 내는 속력에 해류를 더한 **대지 항적**. 배는 침로대로 가지 않는다 —
 * 이 어긋남이 항해의 본질이고, 침로만 지정하는 조작(SPEC 7)에서 유일한 외란이다.
 */
export function groundTrack(
  headingDeg: number,
  sailKnots: number,
  current: Current,
): { headingDeg: number; speedKnots: number } {
  const east =
    sailKnots * Math.sin(headingDeg * DEG) + current.speedKnots * Math.sin(current.toDeg * DEG);
  const north =
    sailKnots * Math.cos(headingDeg * DEG) + current.speedKnots * Math.cos(current.toDeg * DEG);

  const speedKnots = Math.hypot(east, north);
  if (speedKnots < 0.001) {
    return { headingDeg, speedKnots: 0 };
  }
  return { headingDeg: normalizeHeading(Math.atan2(east, north) / DEG), speedKnots };
}

/**
 * 흘러가는 방위를 방위명으로. 바람은 "서풍"이 서에서 오는 것이지만
 * 해류는 "남향류"가 남으로 가는 것이다. 표기에서도 규약 차이를 드러낸다.
 */
export function describeCurrentDirection(toDeg: number): string {
  const points = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  const index = Math.round(normalizeHeading(toDeg) / 45) % 8;
  return `${points[index]}향`;
}
