import { findPort } from "../../content/ports";
import { haversineNm } from "../geo/geo.utils";
import type { DayReport } from "./voyage.types";
import type { HistoricalVoyage, Logbook, VoyageComparison } from "./logbook.types";

export function createLogbook(
  startDay: number,
  startPosition: { lat: number; lon: number },
): Logbook {
  return {
    startDay,
    startPosition: { ...startPosition },
    daysAtSea: 0,
    distanceNm: 0,
    southmostLat: startPosition.lat,
    northmostLat: startPosition.lat,
    stalledDays: 0,
    hazardDays: 0,
  };
}

/** 하루치 보고를 기록에 누적한다. 대조의 근거이므로 시뮬이 직접 쌓는다. */
export function recordVoyageDay(logbook: Logbook, report: DayReport): void {
  logbook.daysAtSea += 1;
  logbook.distanceNm += report.distanceNm;
  logbook.southmostLat = Math.min(logbook.southmostLat, report.position.lat);
  logbook.northmostLat = Math.max(logbook.northmostLat, report.position.lat);
  if (report.speedKnots === 0) {
    logbook.stalledDays += 1;
  }
  if (report.hazardId !== null) {
    logbook.hazardDays += 1;
  }
}

/**
 * 기록을 사료와 나란히 놓는다. 기준선이 없으면 없는 대로 내놓는다 —
 * 확인되지 않은 숫자로 대조하는 것보다 "아직 대조할 수 없다"가 정직하다 (SPEC 3).
 */
export function compareToRecord(
  voyage: HistoricalVoyage,
  logbook: Logbook,
  atPortId: string | null,
): VoyageComparison {
  const start = findPort(voyage.startPortId);
  const end = findPort(voyage.endPortId);
  const directNm =
    start === undefined || end === undefined ? 0 : haversineNm(start.anchorage, end.anchorage);

  return {
    voyage,
    arrived: atPortId === voyage.endPortId,
    days: logbook.daysAtSea,
    distanceNm: logbook.distanceNm,
    directNm,
    detourRatio: directNm > 0 ? logbook.distanceNm / directNm : 0,
    southmostLat: logbook.southmostLat,
    stalledDays: logbook.stalledDays,
    reference: voyage.reference,
  };
}
