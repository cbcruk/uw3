import { WIND, WIND_BANDS, WIND_REGIONS } from "../../content/tuning/wind.tuning";
import { dayOfYear } from "../calendar/calendar";
import type { LatLon } from "../geo/geo.types";
import { blendHeadings, clamp, compassIndex, normalizeHeading } from "../geo/geo.utils";
import type { Wind, WindBand, WindRegime } from "./wind.types";
import { smoothNoise } from "../rng/noise";

const DAYS_PER_YEAR = 365;

/**
 * 잡음 층을 서로 어긋나게 하는 오프셋과 배수.
 *
 * **튜닝 값이 아니다.** 서로 나누어떨어지지만 않으면 되고, 바꿔도 잡음의 통계는
 * 그대로다 — 무늬만 달라진다. 그래서 표에 넣지 않는다. 근거 등급을 달 수 없는
 * 종류의 수이고, 표에 넣으면 "조정하면 뭔가 나아지는 값"으로 오해된다.
 *
 * 층을 겹치는 이유는 한 층만으로는 격자 무늬가 눈에 보이기 때문이다.
 */
const NOISE_LAYERS = {
  /** 지브롤터 풍계 블록을 잡음 축 위에 흩는 간격. */
  regimeStride: 0.7,
  /** 잡음은 0~1로 나온다. 0.5를 빼 -0.5~0.5의 편차로 만든다. */
  centre: 0.5,
  fineFreq: 2.7,
  fineOffsetX: 5.1,
  fineOffsetY: -3.3,
  fineTimeFreq: 2.3,
  coarseOffsetX: 31.7,
  coarseOffsetY: -12.3,
  speedFreq: 2.9,
  speedOffsetX: -7.4,
  speedOffsetY: 4.6,
  speedTimeFreq: 2.1,
} as const;

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
  const { centre } = NOISE_LAYERS;
  return centre - centre * Math.sin(seasonalPhase(dayNumber));
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
  return smoothNoise(block * NOISE_LAYERS.regimeStride, 0, 0) > WIND.gibraltarLevanterThreshold
    ? "levanter"
    : "poniente";
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

  const n = NOISE_LAYERS;
  const directionJitter =
    (smoothNoise(noiseX, noiseY, noiseT) - n.centre) * WIND.directionJitterDeg +
    (smoothNoise(
      noiseX * n.fineFreq + n.fineOffsetX,
      noiseY * n.fineFreq + n.fineOffsetY,
      noiseT * n.fineTimeFreq,
    ) -
      n.centre) *
      WIND.directionJitterFineDeg;
  const speedJitter =
    WIND.speedJitterBase +
    WIND.speedJitterCoarse *
      smoothNoise(noiseX + n.coarseOffsetX, noiseY + n.coarseOffsetY, noiseT) +
    WIND.speedJitterFine *
      smoothNoise(
        noiseX * n.speedFreq + n.speedOffsetX,
        noiseY * n.speedFreq + n.speedOffsetY,
        noiseT * n.speedTimeFreq,
      );

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
  return `${points[compassIndex(fromDeg)]}풍`;
}
