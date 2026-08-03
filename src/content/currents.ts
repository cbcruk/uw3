import type { CurrentStream } from "../sim/current/current.types";

/**
 * 주요 표층 환류. 방위는 **흘러가는 쪽**이다 (SPEC 6 — 바람과 규약이 반대).
 *
 * 세기는 각 해류의 통상 표층 속력 범위에서 중간값을 잡았다. 아굴라스·멕시코 만류처럼
 * 좁고 빠른 해류(2~4kn)와 환류의 넓고 느린 구간(0.3~0.7kn)의 차이가 이 모델의 핵심이다 —
 * 대양을 가로지를 때는 느린 쪽이, 연안을 따라갈 때는 빠른 쪽이 항적을 지배한다.
 *
 * 수치를 조정하려면 먼저 대조 자료를 제시한다 (SPEC 6, 3.2).
 */
export const CURRENT_STREAMS: readonly CurrentStream[] = [
  // ── 북대서양 환류 (시계 방향) ───────────────────────────
  {
    name: "북적도해류",
    lat: 12,
    latSpan: 9,
    minLon: -60,
    maxLon: -15,
    toDeg: 280,
    speedKnots: 0.7,
  },
  {
    name: "멕시코 만류",
    lat: 33,
    latSpan: 6,
    minLon: -80,
    maxLon: -60,
    toDeg: 45,
    speedKnots: 2.6,
  },
  {
    name: "북대서양 해류",
    lat: 48,
    latSpan: 9,
    minLon: -50,
    maxLon: -10,
    toDeg: 75,
    speedKnots: 0.6,
  },
  {
    name: "카나리아 해류",
    lat: 27,
    latSpan: 8,
    minLon: -25,
    maxLon: -9,
    toDeg: 200,
    speedKnots: 0.7,
  },
  {
    name: "포르투갈 해류",
    lat: 39,
    latSpan: 5,
    minLon: -14,
    maxLon: -8.5,
    toDeg: 190,
    speedKnots: 0.4,
  },
  {
    name: "적도반류",
    lat: 6,
    latSpan: 3,
    minLon: -45,
    maxLon: 0,
    toDeg: 90,
    speedKnots: 0.5,
  },

  // ── 남대서양 환류 (반시계 방향) ─────────────────────────
  {
    name: "남적도해류",
    lat: -8,
    latSpan: 8,
    minLon: -35,
    maxLon: 10,
    toDeg: 285,
    speedKnots: 0.8,
  },
  {
    name: "브라질 해류",
    lat: -25,
    latSpan: 8,
    minLon: -50,
    maxLon: -38,
    toDeg: 200,
    speedKnots: 1.2,
  },
  {
    name: "남대서양 해류",
    lat: -42,
    latSpan: 8,
    minLon: -50,
    maxLon: 15,
    toDeg: 85,
    speedKnots: 0.6,
  },
  {
    name: "벵겔라 해류",
    lat: -25,
    latSpan: 9,
    minLon: 5,
    maxLon: 16,
    toDeg: 340,
    speedKnots: 0.6,
  },

  // ── 인도양 ──────────────────────────────────────────────
  {
    name: "아굴라스 해류",
    lat: -33,
    latSpan: 5,
    minLon: 22,
    maxLon: 38,
    toDeg: 215,
    speedKnots: 2.8,
  },
  {
    name: "남인도양 해류",
    lat: -12,
    latSpan: 9,
    minLon: 55,
    maxLon: 105,
    toDeg: 275,
    speedKnots: 0.7,
  },

  // ── 태평양 ──────────────────────────────────────────────
  {
    name: "북태평양 북적도해류",
    lat: 13,
    latSpan: 9,
    minLon: -160,
    maxLon: -100,
    toDeg: 280,
    speedKnots: 0.7,
  },
  {
    name: "쿠로시오",
    lat: 30,
    latSpan: 6,
    minLon: 125,
    maxLon: 150,
    toDeg: 55,
    speedKnots: 2.2,
  },
  {
    name: "캘리포니아 해류",
    lat: 33,
    latSpan: 8,
    minLon: -130,
    maxLon: -118,
    toDeg: 200,
    speedKnots: 0.6,
  },
  {
    name: "훔볼트 해류",
    lat: -22,
    latSpan: 9,
    minLon: -82,
    maxLon: -70,
    toDeg: 340,
    speedKnots: 0.7,
  },
  {
    name: "남태평양 남적도해류",
    lat: -8,
    latSpan: 8,
    minLon: -150,
    maxLon: -90,
    toDeg: 285,
    speedKnots: 0.8,
  },

  // ── 남극 순환류 — 지구를 감싸는 유일한 해류 ─────────────
  {
    name: "남극 순환류",
    lat: -55,
    latSpan: 12,
    minLon: -180,
    maxLon: 180,
    toDeg: 90,
    speedKnots: 0.9,
  },
];
