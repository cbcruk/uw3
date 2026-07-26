import { lerp, smoothstep } from "../geo/geo.utils";

function hash3(x: number, y: number, z: number): number {
  let h =
    Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x85ebca6b) ^ Math.imul(z | 0, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** 공간·시간에 대해 매끄럽게 변하는 결정론적 잡음. 같은 입력이면 항상 같은 값. */
export function smoothNoise(x: number, y: number, t: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const t0 = Math.floor(t);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);
  const ft = smoothstep(t - t0);

  const corner = (dx: number, dy: number, dt: number): number => hash3(x0 + dx, y0 + dy, t0 + dt);

  const near = lerp(
    lerp(corner(0, 0, 0), corner(1, 0, 0), fx),
    lerp(corner(0, 1, 0), corner(1, 1, 0), fx),
    fy,
  );
  const far = lerp(
    lerp(corner(0, 0, 1), corner(1, 0, 1), fx),
    lerp(corner(0, 1, 1), corner(1, 1, 1), fx),
    fy,
  );
  return lerp(near, far, ft);
}

/** 방향 각도를 벡터로 섞어 경계에서 튀지 않게 한다. */
export function blendHeadings(a: number, b: number, t: number): number {
  const ar = (a * Math.PI) / 180;
  const br = (b * Math.PI) / 180;
  const x = lerp(Math.cos(ar), Math.cos(br), t);
  const y = lerp(Math.sin(ar), Math.sin(br), t);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
