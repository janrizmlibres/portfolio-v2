/**
 * 3D value noise, four octaves, in 0..1, from a seed: the gas's dark lanes and brighter knots, and a world's relief.
 */
export function noise3(seed: number) {
  const h = (x: number, y: number, z: number) => {
    let n = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const s = (t: number) => t * t * (3 - 2 * t), L = (a: number, b: number, t: number) => a + (b - a) * t;
  const n = (x: number, y: number, z: number) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = s(x - X), fy = s(y - Y), fz = s(z - Z);
    return L(
      L(L(h(X, Y, Z), h(X + 1, Y, Z), fx), L(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), fx), fy),
      L(L(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), fx), L(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), fx), fy),
      fz,
    );
  };
  return (x: number, y: number, z: number) => {
    let v = 0, a = 0.5, f = 1;
    for (let o = 0; o < 4; o++) { v += a * n(x * f, y * f, z * f); a *= 0.5; f *= 2.03; }
    return v / 0.9375;
  };
}
