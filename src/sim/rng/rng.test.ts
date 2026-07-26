import { describe, expect, it } from "vite-plus/test";
import { createRng, createRngSet, restoreRngSet, snapshotRngSet } from "./rng";

describe("createRng", () => {
  it("같은 시드는 같은 수열을 낸다", () => {
    const a = createRng(1234);
    const b = createRng(1234);
    const drawsA = Array.from({ length: 50 }, () => a.next());
    const drawsB = Array.from({ length: 50 }, () => b.next());
    expect(drawsA).toEqual(drawsB);
  });

  it("다른 시드는 다른 수열을 낸다", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("0과 1 사이 값을 낸다", () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("가중 추출은 가중치에 비례한다", () => {
    const rng = createRng(7);
    const items = [
      { id: "a", weight: 1 },
      { id: "b", weight: 9 },
    ];
    let bCount = 0;
    for (let i = 0; i < 2000; i += 1) {
      if (rng.weighted(items, (item) => item.weight).id === "b") {
        bCount += 1;
      }
    }
    expect(bCount / 2000).toBeGreaterThan(0.85);
    expect(bCount / 2000).toBeLessThan(0.95);
  });

  it("상태를 복원하면 같은 수열로 이어진다", () => {
    const rng = createRng(555);
    rng.next();
    const saved = rng.getState();
    const expected = [rng.next(), rng.next(), rng.next()];
    rng.setState(saved);
    expect([rng.next(), rng.next(), rng.next()]).toEqual(expected);
  });
});

describe("createRngSet", () => {
  it("스트림마다 다른 수열을 낸다", () => {
    const streams = createRngSet(42);
    expect(streams.voyage.next()).not.toBe(streams.rivals.next());
  });

  /** SPEC 8.1: 항해 중 주사위 횟수가 달라져도 라이벌 궤적이 흔들리면 안 된다. */
  it("항해 스트림 소비가 라이벌 스트림에 영향을 주지 않는다", () => {
    const baseline = createRngSet(42);
    const expected = Array.from({ length: 10 }, () => baseline.rivals.next());

    const perturbed = createRngSet(42);
    for (let i = 0; i < 137; i += 1) {
      perturbed.voyage.next();
      perturbed.economy.next();
    }
    const actual = Array.from({ length: 10 }, () => perturbed.rivals.next());

    expect(actual).toEqual(expected);
  });

  it("스냅샷과 복원이 모든 스트림을 되돌린다", () => {
    const streams = createRngSet(2024);
    streams.voyage.next();
    streams.rivals.next();
    const snapshot = snapshotRngSet(streams);
    const expected = [streams.voyage.next(), streams.rivals.next()];

    restoreRngSet(streams, snapshot);
    expect([streams.voyage.next(), streams.rivals.next()]).toEqual(expected);
  });
});
