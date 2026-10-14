/**
 * The spatial drag: where the sky is seen whole (the hero's first frame, Contact's last), a drag turns the view on
 * both axes, round the vertical (yaw, `az`) and over it (pitch, `el`), as if the hand had hold of the sky, and it
 * coasts when let go with a massive thing's friction. The pitch is clamped either side of where the view rests, so it
 * never tips over the pole (where "up" would flip and the picture twist).
 * This is the arithmetic, kept apart from the page so it can be tested. Angles are radians, speeds radians a second,
 * lengths CSS px, times seconds unless named `ms`; nothing depends on the frame rate.
 */
export type Turn = { az: number; el: number };
type V3 = readonly [number, number, number] | readonly number[];

/** radians the view turns for each px the pointer moves, on either axis */
const TURN_PER_PX = 0.004;
/** the fastest a flick can leave it turning, on both axes together */
const MAX_SPEED = 1.8;
/** the speed kept each 60th of a second; it stops at a hundredth of its release, about 3 s on */
const KEEP = 0.975;
/** how far the pitch may go either side of where the view rests */
export const PITCH_RANGE = 0.5;

/**
 * How far a move of (`dx`, `dy`) px turns the view. A grab: the sky follows the hand, so moving right swings the
 * camera left (yaw down) and pulling down lifts the camera (pitch up).
 */
export function turnBy(dx: number, dy: number): Turn {
  return { az: -dx * TURN_PER_PX || 0, el: dy * TURN_PER_PX || 0 };
}

/** The view's speed from the pointer's last move of (`dx`, `dy`) px in `ms`, capped as a whole, its direction kept. */
export function turnSpeed(dx: number, dy: number, ms: number): Turn {
  const k = (0.35 * TURN_PER_PX * 1000) / Math.max(8, ms);
  let az = -dx * k, el = dy * k;
  const s = Math.hypot(az, el);
  if (s > MAX_SPEED) { az *= MAX_SPEED / s; el *= MAX_SPEED / s; }
  return { az: az || 0, el: el || 0 };
}

/** The view's turn once the drag lets go: both speeds, stepped once a frame. */
export function createTurnCoast() {
  let s0 = 0;
  const v: Turn = { az: 0, el: 0 };
  return {
    release(az: number, el: number) { v.az = az; v.el = el; s0 = Math.hypot(az, el); },
    stop() { v.az = v.el = 0; s0 = 0; },
    /** the pitch alone stops (it met its clamp); the yaw carries on */
    stopPitch() { v.el = 0; },
    step(dt: number): Turn {
      if (!v.az && !v.el) return { az: 0, el: 0 };
      const f = KEEP ** (dt * 60);
      v.az *= f;
      v.el *= f;
      if (Math.hypot(v.az, v.el) < s0 * 0.01) v.az = v.el = 0;
      return { az: v.az, el: v.el };
    },
    get moving() { return !!(v.az || v.el); },
    get speed() { return Math.hypot(v.az, v.el); },
  };
}

/** The pitch `el` held within `PITCH_RANGE` of where the view rests (`rest`). */
export function clampPitch(el: number, rest: number) {
  return Math.min(rest + PITCH_RANGE, Math.max(rest - PITCH_RANGE, el));
}

/**
 * A camera pose turned about the world's origin: round the vertical by `yaw`, then over by `pitch` about the
 * horizontal axis square to where the camera now is, so it rises or dips towards the pole without rolling. The target
 * turns with it, so a pose aimed off the origin keeps its aim.
 */
export function orbitTurn(pos: V3, target: V3, yaw: number, pitch: number) {
  if (!yaw && !pitch) return { pos: [pos[0]!, pos[1]!, pos[2]!], target: [target[0]!, target[1]!, target[2]!] };
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  // round +y, as three's applyAxisAngle(UP, yaw) turns
  const rotY = (p: V3) => [p[0]! * cy + p[2]! * sy, p[1]!, -p[0]! * sy + p[2]! * cy];
  const p1 = rotY(pos), t1 = rotY(target);
  // the axis: the camera's horizontal direction × up, so a positive pitch lifts it
  let ax = -p1[2]!, az = p1[0]!;
  const n = Math.hypot(ax, az);
  if (!pitch || n < 1e-9) return { pos: p1, target: t1 };
  ax /= n; az /= n;
  // Rodrigues' rotation about (ax, 0, az)
  const c = Math.cos(pitch), s = Math.sin(pitch);
  const rot = (p: number[]) => {
    const dot = ax * p[0]! + az * p[2]!;
    const cr = [-az * p[1]!, az * p[0]! - ax * p[2]!, ax * p[1]!]; // (ax,0,az) × p
    return [0, 1, 2].map((i) => p[i]! * c + cr[i]! * s + [ax, 0, az][i]! * dot * (1 - c));
  };
  return { pos: rot(p1), target: rot(t1) };
}
