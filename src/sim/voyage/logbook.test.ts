import { describe, expect, it } from "vite-plus/test";
import { findPort } from "../../content/ports";
import { HISTORICAL_VOYAGES, findVoyage } from "../../content/voyages";
import { findShipClass } from "../../content/ships";
import { toDayNumber } from "../calendar/calendar";
import { relativeWindAngle } from "../geo/geo.utils";
import { computeSpeedKnots } from "../ship/sail";
import { windAt } from "../wind/wind";
import { DEFAULT_CONFIG, applyAction, createGame } from "../world/world";
import { compareToRecord } from "./logbook";

const VOLTA = findVoyage("volta-do-mar")!;
const CONDITION = { hullRatio: 1, crewRatio: 1, fatigue: 0, discipline: 0.85 };

describe("재현 항해 정의", () => {
  /**
   * SPEC 3: 확인되지 않은 기준선은 없느니만 못하다.
   * 그럴듯한 숫자를 채워 넣으면 대조 자체가 거짓이 된다.
   */
  it("사료 미확인 기준선은 숫자를 지어내지 않는다", () => {
    for (const voyage of HISTORICAL_VOYAGES) {
      expect(voyage.reference.source.length).toBeGreaterThan(0);
      if (voyage.reference.days === null) {
        expect(voyage.reference.source).toContain("미확인");
      }
    }
  });

  it("출발지와 목적지가 실제 항구를 가리킨다", () => {
    for (const voyage of HISTORICAL_VOYAGES) {
      expect(findPort(voyage.startPortId)).toBeDefined();
      expect(findPort(voyage.endPortId)).toBeDefined();
    }
  });
});

describe("항해 기록", () => {
  it("출항이 기록의 시작이다", () => {
    const game = createGame();
    applyAction(game, { type: "advance-day" });
    applyAction(game, { type: "advance-day" });
    expect(game.logbook.daysAtSea).toBe(0);

    applyAction(game, { type: "depart" });
    applyAction(game, { type: "advance-day" });
    expect(game.logbook.daysAtSea).toBe(1);
  });

  it("항정과 최남단 위도를 쌓는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    applyAction(game, { type: "set-heading", headingDeg: 210 });
    for (let day = 0; day < 6; day += 1) {
      applyAction(game, { type: "advance-day" });
    }

    expect(game.logbook.distanceNm).toBeGreaterThan(0);
    expect(game.logbook.southmostLat).toBeLessThan(game.logbook.startPosition.lat);
  });

  it("도착 전에는 대조가 도착으로 표시되지 않는다", () => {
    const game = createGame();
    applyAction(game, { type: "depart" });
    const record = compareToRecord(VOLTA, game.logbook, game.voyage.atPortId);

    expect(record.arrived).toBe(false);
    expect(record.directNm).toBeGreaterThan(700);
    expect(record.reference.days).toBeNull();
  });
});

/**
 * SPEC 3.2: 충실도 주장은 실행되는 테스트여야 한다.
 * 아래는 **측정으로 확인된 것만** 담는다. 볼타 두 마르 이점 자체는 아직 재현되지
 * 않았고, 그 사실은 SPEC 10에 미결로 기록했다 — 통과하도록 모델을 만지지 않는다.
 */
describe("풍대 구조 (충실도)", () => {
  // 여기서 필요한 것은 선급과 날짜뿐이다. createGame은 육지 마스크를 두 벌 굽는데
  // (1/16° + 1/8°), 그걸 호출마다 하면 이 파일 하나가 5초를 먹는다.
  const day = toDayNumber(DEFAULT_CONFIG.startDate);
  const SHIP = findShipClass(DEFAULT_CONFIG.shipClassId)!;

  function westwardSpeed(lat: number): number {
    const ship = SHIP;
    const wind = windAt({ lat, lon: -25 }, day);
    return computeSpeedKnots({
      shipClass: ship,
      rig: ship.defaultRig,
      sailsSet: [true, true, true],
      relAngleDeg: relativeWindAngle(270, wind.fromDeg),
      windSpeedKnots: wind.speedKnots,
      condition: CONDITION,
    });
  }

  /** 편서풍대에서 서쪽으로 직진할 수 없다는 것이 볼타 두 마르의 전제다. */
  it("편서풍대에서는 서진 자체가 불가능하다", () => {
    for (const lat of [35, 38, 40, 45]) {
      expect(westwardSpeed(lat)).toBe(0);
    }
  });

  it("무역풍대에서는 서진이 빠르다", () => {
    for (const lat of [15, 20, 25]) {
      expect(westwardSpeed(lat)).toBeGreaterThan(6);
    }
  });

  it("남쪽으로 내려갈수록 서진이 유리해진다", () => {
    expect(westwardSpeed(25)).toBeGreaterThan(westwardSpeed(30));
    expect(westwardSpeed(30)).toBeGreaterThan(westwardSpeed(35));
  });
});
