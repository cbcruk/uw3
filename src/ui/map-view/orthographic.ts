import type { LatLon } from "../../sim/geo/geo.types";
import { normalizeHeading } from "../../sim/geo/geo.utils";
import type { Orthographic, OrthographicOptions, ScreenPoint } from "./orthographic.types";

const DEG = Math.PI / 180;

/**
 * 정사도법 — 우주에서 지구를 본 그림이다. 회전하면 지구본으로 보인다.
 *
 * 3D 엔진을 들이지 않는 이유는 SPEC 5에 있다. 렌더링은 화면이지 시뮬레이션이 아니고,
 * 지구본은 투영 함수 하나로 충분하다.
 */
export function createOrthographic(options: OrthographicOptions): Orthographic {
  let centerLat = options.centerLat;
  let centerLon = options.centerLon;
  let radiusPx = options.radiusPx;

  return {
    get centerLat() {
      return centerLat;
    },
    get centerLon() {
      return centerLon;
    },
    get radiusPx() {
      return radiusPx;
    },

    rotateTo(lat: number, lon: number): void {
      // 극을 넘어가면 화면이 뒤집힌다. 위도만 묶고 경도는 순환시킨다.
      centerLat = Math.max(-89.9, Math.min(89.9, lat));
      centerLon = normalizeHeading(lon + 180) - 180;
    },

    zoomTo(nextRadiusPx: number): void {
      radiusPx = Math.max(options.minRadiusPx, Math.min(options.maxRadiusPx, nextRadiusPx));
    },

    project({ lat, lon }: LatLon): ScreenPoint {
      const phi = lat * DEG;
      const lambda = (lon - centerLon) * DEG;
      const phi0 = centerLat * DEG;

      const cosC =
        Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);

      return {
        // 캔버스 y는 아래로 증가하므로 부호를 뒤집는다.
        x: radiusPx * Math.cos(phi) * Math.sin(lambda),
        y:
          -radiusPx *
          (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
        // cosC < 0이면 지구 반대편이다. 그리면 안 된다.
        visible: cosC >= 0,
      };
    },

    invert(x: number, y: number): LatLon | null {
      const rho = Math.hypot(x, y);
      if (rho > radiusPx) {
        return null;
      }
      if (rho === 0) {
        return { lat: centerLat, lon: centerLon };
      }

      const c = Math.asin(Math.min(1, rho / radiusPx));
      const phi0 = centerLat * DEG;
      const flippedY = -y;

      const lat = Math.asin(
        Math.cos(c) * Math.sin(phi0) + (flippedY * Math.sin(c) * Math.cos(phi0)) / rho,
      );
      const lon =
        centerLon * DEG +
        Math.atan2(
          x * Math.sin(c),
          rho * Math.cos(c) * Math.cos(phi0) - flippedY * Math.sin(c) * Math.sin(phi0),
        );

      return { lat: lat / DEG, lon: normalizeHeading(lon / DEG + 180) - 180 };
    },
  };
}
