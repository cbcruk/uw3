import { describe, expect, it } from "vite-plus/test";
import { commandForKey, withParticle } from "./game-view.utils";

describe("키 → 명령", () => {
  it("방향키 하나가 한 칸 이동이다", () => {
    expect(commandForKey("ArrowUp", "ArrowUp")).toEqual({ type: "move", dir: "n" });
    expect(commandForKey("ArrowLeft", "ArrowLeft")).toEqual({ type: "move", dir: "w" });
  });

  it("대각선은 vi 키와 숫자패드로 낸다", () => {
    expect(commandForKey("y", "KeyY")).toEqual({ type: "move", dir: "nw" });
    expect(commandForKey("N", "KeyN")).toEqual({ type: "move", dir: "se" });
    expect(commandForKey("9", "Numpad9")).toEqual({ type: "move", dir: "ne" });
  });

  it("하선·승선·기다림", () => {
    expect(commandForKey("h", "KeyH")).toEqual({ type: "disembark", mount: "horse" });
    expect(commandForKey("c", "KeyC")).toEqual({ type: "disembark", mount: "camel" });
    expect(commandForKey("e", "KeyE")).toEqual({ type: "embark" });
    expect(commandForKey(".", "Period")).toEqual({ type: "wait" });
  });

  it("스페이스바는 이동이 아니다", () => {
    expect(commandForKey(" ", "Space")).toBeNull();
  });
});

describe("조사 — 받침에 따라 이/가, 을/를", () => {
  it("받침이 있으면 앞의 것, 없으면 뒤의 것", () => {
    expect(withParticle("해적선", "이", "가")).toBe("해적선이");
    expect(withParticle("도적떼", "이", "가")).toBe("도적떼가");
    expect(withParticle("늑대 무리", "을", "를")).toBe("늑대 무리를");
  });
});
