import { internal, tunedValues } from "../tuning/tuning";
import type { Tuned } from "../tuning/tuning.types";

/**
 * 게임 격자의 모양. 전부 화면과 판정을 위한 값이라 사료에 대응물이 없다.
 *
 * 칸 폭을 바꾸면 해협이 닫힐 수 있다. `world-grid.test.ts`가 주요 해협을 본다.
 */
const GRID_SCALARS = {
  cellDeg: internal(
    0.25,
    "°",
    "게임 격자 한 칸의 경도 폭. 한 영역이 로그라이크 화면 한 장에 들어오도록 정한 표시 해상도다",
  ),
  maxLat: internal(
    75,
    "°",
    "메르카토르 격자의 위도 한계. 극으로 갈수록 칸이 발산해서 자르는 표시상의 경계다",
  ),
  regionCols: internal(
    60,
    "칸",
    "영역(던전 층) 하나의 가로 칸 수. 360°/칸 폭을 나누어떨어지게 하는 화면 크기다",
  ),
  regionRows: internal(40, "칸", "영역(던전 층) 하나의 세로 칸 수. 화면 크기에서 정했다"),
  seaFractionMin: internal(
    0.5,
    "비",
    "칸 안 표본점 중 바다가 이 비율 이상이면 바다 칸. 래스터 분류 임계라 현실 대응물이 없다",
  ),
  samplesPerAxis: internal(
    4,
    "점",
    "칸 하나를 분류할 때 한 축의 표본 수. 수치 적분 해상도라 현실 대응물이 없다",
  ),
} as const satisfies Record<string, Tuned>;

export const GRID_TABLES = [GRID_SCALARS] as const;
export const GRID = tunedValues(GRID_SCALARS);
