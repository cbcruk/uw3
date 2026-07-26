import { dayOfYear } from "../calendar/calendar";
import type { LatLon } from "../geo/geo.types";
import { clamp, normalizeHeading } from "../geo/geo.utils";
import type { Wind, WindBand, WindRegime } from "./wind.types";
import { blendHeadings, smoothNoise } from "./wind.utils";

const GLOBAL_BANDS: readonly WindBand[] = [
  { maxLat: 5, fromDeg: 90, speedKnots: 3, regime: "doldrums" },
  { maxLat: 28, fromDeg: 55, speedKnots: 14, regime: "trades" },
  { maxLat: 33, fromDeg: 100, speedKnots: 6, regime: "horse-latitudes" },
  { maxLat: 90, fromDeg: 255, speedKnots: 16, regime: "westerlies" },
];

const MEDITERRANEAN = {
  minLon: -5.4,
  minLat: 30,
  maxLat: 44,
} as const;

const GIBRALTAR = {
  minLat: 35.5,
  maxLat: 36.5,
  minLon: -6.4,
  maxLon: -4.5,
} as const;

const GULF_OF_LION = {
  minLat: 41.3,
  minLon: 2.0,
  maxLon: 7.0,
} as const;

/** 여름에 기압대가 북상하고 겨울에 남하한다. */
function seasonalLatShift(dayNumber: number): number {
  return 4.5 * Math.sin((2 * Math.PI * (dayOfYear(dayNumber) - 80)) / 365);
}

/** 겨울 1, 여름 0 에 가까운 계수. 지중해·편서풍 강도의 계절 변동에 쓴다. */
function winterFactor(dayNumber: number): number {
  return 0.5 - 0.5 * Math.sin((2 * Math.PI * (dayOfYear(dayNumber) - 80)) / 365);
}

function bandAt(effectiveLat: number): WindBand {
  const lat = Math.abs(effectiveLat);
  for (const band of GLOBAL_BANDS) {
    if (lat <= band.maxLat) {
      return band;
    }
  }
  return GLOBAL_BANDS[GLOBAL_BANDS.length - 1] as WindBand;
}

function isMediterranean(position: LatLon): boolean {
  return (
    position.lon > MEDITERRANEAN.minLon &&
    position.lat > MEDITERRANEAN.minLat &&
    position.lat < MEDITERRANEAN.maxLat
  );
}

function isInGibraltar(position: LatLon): boolean {
  return (
    position.lat > GIBRALTAR.minLat &&
    position.lat < GIBRALTAR.maxLat &&
    position.lon > GIBRALTAR.minLon &&
    position.lon < GIBRALTAR.maxLon
  );
}

function isInGulfOfLion(position: LatLon): boolean {
  return (
    position.lat > GULF_OF_LION.minLat &&
    position.lon > GULF_OF_LION.minLon &&
    position.lon < GULF_OF_LION.maxLon
  );
}

/**
 * 지브롤터 해협은 레반테(동풍)와 포니엔테(서풍)가 며칠 단위로 교대한다.
 * 난수가 아니라 날짜의 결정론적 함수이므로 플레이어가 관측하고 기다릴 수 있다.
 */
function gibraltarRegime(dayNumber: number): WindRegime {
  const block = Math.floor(dayNumber / 4);
  return smoothNoise(block * 0.7, 0, 0) > 0.45 ? "levanter" : "poniente";
}

function baseWind(position: LatLon, dayNumber: number): WindBand {
  if (isInGibraltar(position)) {
    const regime = gibraltarRegime(dayNumber);
    return {
      maxLat: 0,
      fromDeg: regime === "levanter" ? 85 : 265,
      speedKnots: 18 + 6 * winterFactor(dayNumber),
      regime,
    };
  }

  if (isInGulfOfLion(position)) {
    return {
      maxLat: 0,
      fromDeg: 330,
      speedKnots: 12 + 12 * winterFactor(dayNumber),
      regime: "mistral",
    };
  }

  if (isMediterranean(position)) {
    return {
      maxLat: 0,
      fromDeg: 295,
      speedKnots: 8 + 7 * winterFactor(dayNumber),
      regime: "mediterranean",
    };
  }

  const band = bandAt(position.lat - seasonalLatShift(dayNumber));
  return {
    ...band,
    speedKnots:
      band.regime === "westerlies"
        ? band.speedKnots * (0.8 + 0.5 * winterFactor(dayNumber))
        : band.speedKnots,
  };
}

export function windAt(position: LatLon, dayNumber: number): Wind {
  const base = baseWind(position, dayNumber);
  const noiseX = position.lon / 2.5;
  const noiseY = position.lat / 2.5;
  const noiseT = dayNumber / 3;

  const directionJitter =
    (smoothNoise(noiseX, noiseY, noiseT) - 0.5) * 80 +
    (smoothNoise(noiseX * 2.7 + 5.1, noiseY * 2.7 - 3.3, noiseT * 2.3) - 0.5) * 45;
  const speedJitter =
    0.5 +
    0.8 * smoothNoise(noiseX + 31.7, noiseY - 12.3, noiseT) +
    0.4 * smoothNoise(noiseX * 2.9 - 7.4, noiseY * 2.9 + 4.6, noiseT * 2.1);

  return {
    fromDeg: normalizeHeading(blendHeadings(base.fromDeg, base.fromDeg + directionJitter, 1)),
    speedKnots: clamp(base.speedKnots * speedJitter, 0, 45),
    regime: base.regime,
  };
}

export const WIND_REGIME_LABELS: Readonly<Record<WindRegime, string>> = {
  doldrums: "적도무풍대",
  trades: "북동무역풍",
  "horse-latitudes": "아열대무풍대",
  westerlies: "편서풍",
  mediterranean: "지중해 서풍",
  mistral: "미스트랄",
  levanter: "레반테",
  poniente: "포니엔테",
};

export function describeWindDirection(fromDeg: number): string {
  const points = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  const index = Math.round(normalizeHeading(fromDeg) / 45) % 8;
  return `${points[index]}풍`;
}
