import { WIND, WIND_BANDS, WIND_REGIONS } from "../../content/tuning/wind.tuning";
import { dayOfYear } from "../calendar/calendar";
import type { LatLon } from "../geo/geo.types";
import { clamp, normalizeHeading } from "../geo/geo.utils";
import type { Wind, WindBand, WindRegime } from "./wind.types";
import { blendHeadings, smoothNoise } from "./wind.utils";

const DAYS_PER_YEAR = 365;

/** 연중 위상. 기준일에 0, 반년 뒤 반대 부호가 된다. */
function seasonalPhase(dayNumber: number): number {
  return (2 * Math.PI * (dayOfYear(dayNumber) - WIND.seasonalPhaseDay)) / DAYS_PER_YEAR;
}

/** 여름에 기압대가 북상하고 겨울에 남하한다. */
function seasonalLatShift(dayNumber: number): number {
  return WIND.seasonalLatShiftDeg * Math.sin(seasonalPhase(dayNumber));
}

/** 겨울 1, 여름 0 에 가까운 계수. 지중해·편서풍 강도의 계절 변동에 쓴다. */
function winterFactor(dayNumber: number): number {
  return 0.5 - 0.5 * Math.sin(seasonalPhase(dayNumber));
}

function bandAt(effectiveLat: number): WindBand {
  const lat = Math.abs(effectiveLat);
  const bands = WIND_BANDS.value;
  for (const band of bands) {
    if (lat <= band.maxLat) {
      return band;
    }
  }
  return bands[bands.length - 1] as WindBand;
}

function isMediterranean(position: LatLon): boolean {
  const box = WIND_REGIONS.mediterranean;
  return position.lon > box.minLon && position.lat > box.minLat && position.lat < box.maxLat;
}

function isInGibraltar(position: LatLon): boolean {
  const box = WIND_REGIONS.gibraltar;
  return (
    position.lat > box.minLat &&
    position.lat < box.maxLat &&
    position.lon > box.minLon &&
    position.lon < box.maxLon
  );
}

function isInGulfOfLion(position: LatLon): boolean {
  const box = WIND_REGIONS.gulfOfLion;
  return position.lat > box.minLat && position.lon > box.minLon && position.lon < box.maxLon;
}

/**
 * 지브롤터 해협은 레반테(동풍)와 포니엔테(서풍)가 며칠 단위로 교대한다.
 * 난수가 아니라 날짜의 결정론적 함수이므로 플레이어가 관측하고 기다릴 수 있다.
 */
function gibraltarRegime(dayNumber: number): WindRegime {
  const block = Math.floor(dayNumber / WIND.gibraltarRegimeBlockDays);
  return smoothNoise(block * 0.7, 0, 0) > WIND.gibraltarLevanterThreshold ? "levanter" : "poniente";
}

function baseWind(position: LatLon, dayNumber: number): WindBand {
  if (isInGibraltar(position)) {
    const regime = gibraltarRegime(dayNumber);
    return {
      maxLat: 0,
      fromDeg: regime === "levanter" ? WIND.levanterFromDeg : WIND.ponienteFromDeg,
      speedKnots:
        WIND.gibraltarBaseKnots + WIND.gibraltarWinterBonusKnots * winterFactor(dayNumber),
      regime,
    };
  }

  if (isInGulfOfLion(position)) {
    return {
      maxLat: 0,
      fromDeg: WIND.mistralFromDeg,
      speedKnots: WIND.mistralBaseKnots + WIND.mistralWinterBonusKnots * winterFactor(dayNumber),
      regime: "mistral",
    };
  }

  if (isMediterranean(position)) {
    return {
      maxLat: 0,
      fromDeg: WIND.mediterraneanFromDeg,
      speedKnots:
        WIND.mediterraneanBaseKnots + WIND.mediterraneanWinterBonusKnots * winterFactor(dayNumber),
      regime: "mediterranean",
    };
  }

  const band = bandAt(position.lat - seasonalLatShift(dayNumber));
  return {
    ...band,
    speedKnots:
      band.regime === "westerlies"
        ? band.speedKnots *
          (WIND.westerliesSummerFactor + WIND.westerliesWinterRange * winterFactor(dayNumber))
        : band.speedKnots,
  };
}

export function windAt(position: LatLon, dayNumber: number): Wind {
  const base = baseWind(position, dayNumber);
  const noiseX = position.lon / WIND.noiseSpaceDeg;
  const noiseY = position.lat / WIND.noiseSpaceDeg;
  const noiseT = dayNumber / WIND.noiseTimeDays;

  const directionJitter =
    (smoothNoise(noiseX, noiseY, noiseT) - 0.5) * WIND.directionJitterDeg +
    (smoothNoise(noiseX * 2.7 + 5.1, noiseY * 2.7 - 3.3, noiseT * 2.3) - 0.5) *
      WIND.directionJitterFineDeg;
  const speedJitter =
    WIND.speedJitterBase +
    WIND.speedJitterCoarse * smoothNoise(noiseX + 31.7, noiseY - 12.3, noiseT) +
    WIND.speedJitterFine * smoothNoise(noiseX * 2.9 - 7.4, noiseY * 2.9 + 4.6, noiseT * 2.1);

  return {
    fromDeg: normalizeHeading(blendHeadings(base.fromDeg, base.fromDeg + directionJitter, 1)),
    speedKnots: clamp(base.speedKnots * speedJitter, 0, WIND.maxWindKnots),
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
