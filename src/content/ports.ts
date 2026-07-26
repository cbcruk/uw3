import type { LatLon } from "../sim/geo/geo.types";
import type { Port } from "./content.types";

/** SPEC 9: 수도 1 + 지방 3. 말라가는 지브롤터 해협을 통과해야만 닿는다. */
export const PORTS: readonly Port[] = [
  {
    id: "lisboa",
    name: "리스본",
    lat: 38.71,
    lon: -9.14,
    nation: "포르투갈",
    culture: "이베리아",
    language: "portuguese",
    isCapital: true,
    facilities: ["shipyard", "market", "tavern", "library", "guild", "church"],
    goods: ["소금", "올리브유", "포도주", "코르크"],
  },
  {
    id: "cadiz",
    name: "카디스",
    lat: 36.53,
    lon: -6.3,
    nation: "카스티야",
    culture: "이베리아",
    language: "castilian",
    isCapital: false,
    facilities: ["shipyard", "market", "tavern", "church"],
    goods: ["소금", "포도주", "참치"],
  },
  {
    id: "ceuta",
    name: "세우타",
    lat: 35.89,
    lon: -5.32,
    nation: "포르투갈",
    culture: "마그레브",
    language: "arabic",
    isCapital: false,
    facilities: ["market", "tavern", "church"],
    goods: ["곡물", "가죽", "밀랍"],
  },
  {
    id: "malaga",
    name: "말라가",
    lat: 36.72,
    lon: -4.42,
    nation: "카스티야",
    culture: "안달루시아",
    language: "castilian",
    isCapital: false,
    facilities: ["market", "tavern", "guild"],
    goods: ["건포도", "설탕", "명반", "비단"],
  },
];

export const PORT_ANCHORAGES: readonly LatLon[] = PORTS.map((port) => ({
  lat: port.lat,
  lon: port.lon,
}));

export function findPort(id: string): Port | undefined {
  return PORTS.find((port) => port.id === id);
}
