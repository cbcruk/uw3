import { createMeta } from "../../game/expedition/expedition";
import type { MetaState } from "../../game/expedition/expedition.types";
import type { SavedRun } from "./game-view.types";

const META_KEY = "uw3.roguelike.meta";
const ACTIVE_KEY = "uw3.roguelike.active";

/**
 * 메타를 읽는다. 저장소가 막혔거나 비었거나 깨졌으면 새 메타다.
 *
 * 메타는 이 브라우저에만 있다. 잃어도 런은 돌아간다 — 아는 항구가 비어 있을 뿐이다.
 */
export function loadMeta(): MetaState {
  const parsed = readJson(META_KEY);
  if (isRecord(parsed) && parsed["version"] === 1 && Array.isArray(parsed["records"])) {
    return parsed as unknown as MetaState;
  }
  return createMeta();
}

export function saveMeta(meta: MetaState): void {
  writeJson(META_KEY, meta);
}

/**
 * 진행 중인 원정. 설정과 명령 로그만 저장하고 상태는 재현으로 되살린다 (R8).
 * 상태를 통째로 저장하지 않으니 저장 형식이 상태 모양에 묶이지 않는다.
 */
export function loadActive(): SavedRun | null {
  const parsed = readJson(ACTIVE_KEY);
  if (isRecord(parsed) && isRecord(parsed["config"]) && Array.isArray(parsed["commands"])) {
    return parsed as unknown as SavedRun;
  }
  return null;
}

export function saveActive(saved: SavedRun | null): void {
  if (saved === null) {
    try {
      window.localStorage.removeItem(ACTIVE_KEY);
    } catch {
      // 저장소가 막힌 환경(사생활 모드 등)에서는 이어하기만 안 될 뿐이다.
    }
    return;
  }
  writeJson(ACTIVE_KEY, saved);
}

function readJson(key: string): unknown {
  try {
    const text = window.localStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 게임을 멈추지 않는다.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
