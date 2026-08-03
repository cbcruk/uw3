import type { LatLon } from "../geo/geo.types";

/**
 * 해류. **바람과 방향 규약이 반대다** — 바람은 불어오는 쪽(fromDeg),
 * 해류는 흘러가는 쪽(toDeg)으로 부른다. 항해 관례 그대로다.
 * 두 규약을 섞으면 부호 하나로 항적이 180° 틀어진다.
 */
export interface Current {
  toDeg: number;
  speedKnots: number;
  /** 가장 크게 기여한 해류의 이름. HUD와 검증용이다. */
  name: string;
}

/**
 * 하나의 해류 갈래. 중심선과 폭으로 정의하고, 가장자리로 갈수록 부드럽게 약해진다.
 * 경계에서 뚝 끊기면 하루 사이에 항적이 꺾여 시뮬이 거짓말처럼 보인다.
 */
export interface CurrentStream {
  name: string;
  /** 중심 위도. */
  lat: number;
  /** 중심선에서 이만큼 벗어나면 세기가 0이 된다. */
  latSpan: number;
  /** 경도 구간. 지구를 감싸는 해류는 -180..180으로 준다. */
  minLon: number;
  maxLon: number;
  /** 흘러가는 방위. */
  toDeg: number;
  /** 중심선에서의 세기 (노트). */
  speedKnots: number;
}

export interface CurrentSample {
  position: LatLon;
  current: Current;
}
