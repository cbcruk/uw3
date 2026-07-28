import { describe, expect, it } from "vite-plus/test";
import { readDebugOptions } from "./debug-options";

describe("readDebugOptions", () => {
  it("기본값은 안개 켬이다", () => {
    expect(readDebugOptions("").fog).toBe(true);
    expect(readDebugOptions("?seed=1").fog).toBe(true);
  });

  it("fog=off로만 안개를 끈다", () => {
    expect(readDebugOptions("?fog=off").fog).toBe(false);
    expect(readDebugOptions("?fog=on").fog).toBe(true);
    expect(readDebugOptions("?fog=").fog).toBe(true);
  });
});
