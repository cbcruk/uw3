import { describe, expect, it } from "vite-plus/test";
import { commandForKey } from "./game-view.utils";

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
