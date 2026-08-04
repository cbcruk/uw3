import type { GameDate, Season } from "./calendar.types";

export const EPOCH: GameDate = { year: 1500, month: 1, day: 1 };

/**
 * 하루와 시간의 다리. 속력은 노트(해리/시)로 오고 시뮬 단위는 하루다 (SHAPE T1).
 * 달력의 정의이지 조정 가능한 값이 아니다.
 */
export const HOURS_PER_DAY = 24;

function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function civilFromDays(days: number): GameDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const y = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  return { year: month <= 2 ? y + 1 : y, month, day };
}

const EPOCH_OFFSET = daysFromCivil(EPOCH.year, EPOCH.month, EPOCH.day);

export function toDayNumber(date: GameDate): number {
  return daysFromCivil(date.year, date.month, date.day) - EPOCH_OFFSET;
}

export function toGameDate(dayNumber: number): GameDate {
  return civilFromDays(dayNumber + EPOCH_OFFSET);
}

export function dayOfYear(dayNumber: number): number {
  const date = toGameDate(dayNumber);
  return dayNumber - toDayNumber({ year: date.year, month: 1, day: 1 }) + 1;
}

export function seasonOf(dayNumber: number): Season {
  const month = toGameDate(dayNumber).month;
  if (month <= 2 || month === 12) {
    return "winter";
  }
  if (month <= 5) {
    return "spring";
  }
  if (month <= 8) {
    return "summer";
  }
  return "autumn";
}

export function formatGameDate(dayNumber: number): string {
  const { year, month, day } = toGameDate(dayNumber);
  return `${year}년 ${month}월 ${day}일`;
}
