import { describe, expect, it } from "vite-plus/test";
import { LEEWAY } from "../../content/tuning/leeway.tuning";
import { angleDifference } from "../geo/geo.utils";
import { leewayAngleDeg, leewayTrackDeg } from "./leeway";

/**
 * 여기서 보는 것은 압류의 **형태**다 — 근거를 댈 수 있는 부분이 그것뿐이기
 * 때문이다 (SHAPE P9). 몇 도가 나와야 하는지는 박지 않는다. 박으면 표를 고칠
 * 때마다 기대값을 따라 고치게 되고, 결국 테스트에 맞춘 튜닝이 된다 (SPEC 6).
 */
describe("압류", () => {
  const WIND = LEEWAY.referenceWindKnots;

  describe("풍향각에 따른 형태", () => {
    it("정풍에 가까울수록 크다", () => {
      expect(leewayAngleDeg(30, WIND)).toBeGreaterThan(leewayAngleDeg(60, WIND));
      expect(leewayAngleDeg(60, WIND)).toBeGreaterThan(leewayAngleDeg(80, WIND));
    });

    /** 정횡을 지나면 옆으로 미는 힘이 사라진다. 순풍에서는 압류가 없다. */
    it("정횡부터는 압류가 없다", () => {
      expect(leewayAngleDeg(90, WIND)).toBeCloseTo(0, 10);
      expect(leewayAngleDeg(135, WIND)).toBe(0);
      expect(leewayAngleDeg(180, WIND)).toBe(0);
    });

    /**
     * `referenceDeg`는 상한이 아니다 — 강풍 배율이 곱해진다. 진짜 상한은
     * 그 곱이고, 어떤 폭풍에서도 이걸 넘지 않아야 항적이 발산하지 않는다.
     */
    it("아무리 세게 불어도 기준각 × 강풍 배율을 넘지 않는다", () => {
      const bound = LEEWAY.referenceDeg * LEEWAY.windScaleCap;
      for (let angle = 0; angle <= 180; angle += 5) {
        expect(leewayAngleDeg(angle, WIND * 100)).toBeLessThanOrEqual(bound);
      }
    });
  });

  describe("풍속", () => {
    it("바람이 세면 더 밀린다", () => {
      expect(leewayAngleDeg(45, WIND * 2)).toBeGreaterThan(leewayAngleDeg(45, WIND));
    });

    it("약풍에서도 0으로 죽지는 않는다", () => {
      expect(leewayAngleDeg(45, 0)).toBeGreaterThan(0);
    });
  });

  describe("밀리는 쪽", () => {
    /** 바람을 좌현으로 받으면 우현으로, 우현으로 받으면 좌현으로 — 언제나 풍하다. */
    it("바람을 받는 현의 반대로 밀린다", () => {
      const port = leewayTrackDeg(45, 0, WIND, 5);
      const starboard = leewayTrackDeg(315, 0, WIND, 5);

      expect(port).toBeGreaterThan(45);
      expect(starboard).toBeLessThan(315);
    });

    it("양쪽 태킹에서 밀리는 크기가 같다", () => {
      const port = leewayTrackDeg(45, 0, WIND, 5) - 45;
      const starboard = 315 - leewayTrackDeg(315, 0, WIND, 5);
      expect(port).toBeCloseTo(starboard, 10);
    });

    /** 밀린 항적은 언제나 풍하 쪽이다 — 뱃머리보다 바람에서 멀어져 있다. */
    it("밀린 뒤에는 언제나 풍향각이 커진다", () => {
      for (const heading of [30, 45, 60, 80, 280, 300, 330]) {
        const track = leewayTrackDeg(heading, 0, WIND, 5);
        expect(Math.abs(angleDifference(track, 0))).toBeGreaterThan(
          Math.abs(angleDifference(heading, 0)),
        );
      }
    });
  });

  /** 돛이 물지 못하면 옆으로 미는 힘도 없다. 그때의 표류는 해류가 맡는다 (P1). */
  it("돛이 죽으면 압류도 없다", () => {
    expect(leewayTrackDeg(45, 0, WIND, 0)).toBe(45);
  });

  it("순풍에서는 뱃머리 그대로 간다", () => {
    expect(leewayTrackDeg(180, 0, WIND, 5)).toBe(180);
  });
});
