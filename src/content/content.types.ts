import type { LatLon } from "../sim/geo/geo.types";
export type LanguageId = "portuguese" | "castilian" | "arabic" | "italian" | "latin";

export type PortFacility = "shipyard" | "market" | "tavern" | "library" | "guild" | "church";

export interface Port {
  id: string;
  name: string;
  /** 도시 위치. 표시용이다 — 항구 도시는 대개 뭍에 있다. */
  lat: number;
  lon: number;
  /**
   * 정박지. 배가 실제로 머무는 바다 위 지점이다.
   * 도시 좌표를 그대로 쓰면 배가 하구 안쪽에 갇힌다 — 리스본의 테주강 하구는
   * 1/16° 격자에서 바다로 이어지지 않는다. 항구는 외해와 통해야 한다.
   */
  anchorage: LatLon;
  nation: string;
  culture: string;
  language: LanguageId;
  isCapital: boolean;
  foundedYear?: number;
  facilities: readonly PortFacility[];
  goods: readonly string[];
}

export const LANGUAGE_LABELS: Readonly<Record<LanguageId, string>> = {
  portuguese: "포르투갈어",
  castilian: "카스티야어",
  arabic: "아랍어",
  italian: "이탈리아어",
  latin: "라틴어",
};

export const FACILITY_LABELS: Readonly<Record<PortFacility, string>> = {
  shipyard: "조선소",
  market: "시장",
  tavern: "술집",
  library: "도서관",
  guild: "조합",
  church: "교회",
};
