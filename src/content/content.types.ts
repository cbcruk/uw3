export type LanguageId = "portuguese" | "castilian" | "arabic" | "italian" | "latin";

export type PortFacility = "shipyard" | "market" | "tavern" | "library" | "guild" | "church";

export interface Port {
  id: string;
  name: string;
  lat: number;
  lon: number;
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
