/**
 * The film drawn at 60 fps, whatever the display's rate. A 120 Hz phone asks for a frame every 8.3 ms; a GPU that can
 * almost hold 60 then swings between 120, 60 and 40 fps, which reads as judder. So on a display faster than about
 * 75 Hz the film, the sky, Tycho's canvas and the warp draw on every other display frame (every Nth: the step nearest
 * 60 fps that isn't under it), and on the rest nothing heavy runs. Motion keeps to real time: whatever draws reads the
 * time since the last drawn frame (`drawnMs`), never one display frame's.
 * - The display's interval is measured as the governor measures its frames' (governor.ts): the median of each 30
 *   frames, the steadiest yet kept, which a display held to 30 fps never beats.
 * - A frame is drawn once it's within half a display frame of its turn, so one that came late is drawn at once, and a
 *   window moved to a 60 Hz screen is drawn every frame.
 * The governor's frames are the sky's, so it judges missed frames against the drawn interval, not the display's.
 */
import gsap from "gsap";

/** the rate drawn at, at most, on a fast display */
const FPS = 60;
/** display frames per judgement of the display's interval */
const WINDOW = 30;
/** an interval this long is a stall (a hidden tab, a long task), not the display */
const STALL_MS = 100;

/** Display frames per frame drawn, on a display a frame every `ms`. */
export function framesPerDraw(ms: number) {
  return Math.max(1, Math.floor(1000 / ms / FPS + 0.1));
}

/** Which display frames are drawn: told each one's time (ms), it says whether to draw it. */
export function createPacer() {
  let display = Infinity, n = 0, prev = NaN, last = -Infinity;
  const dts = new Float64Array(WINDOW);
  return {
    /** display frames per frame drawn */
    get every() { return framesPerDraw(display); },
    /** the display's interval (ms), as measured */
    get display() { return display; },
    tick(now: number) {
      const dt = now - prev;
      prev = now;
      if (dt > 0 && dt < STALL_MS) {
        dts[n++] = dt;
        if (n === WINDOW) {
          n = 0;
          display = Math.min(display, dts.sort()[WINDOW >> 1]!);
        }
      }
      const k = framesPerDraw(display);
      if (k > 1 && now - last < (k - 0.5) * display) return false;
      last = now;
      return true;
    },
  };
}

const pacer = createPacer();
let drawn = true, since = 0, lastMs = 0, ticks = 0, draws = 0;
// first on GSAP's ticker, so everything after it this frame reads the same answer
if (typeof window !== "undefined")
  gsap.ticker.add(
    (_t: number, deltaMs: number) => {
      // the frame's own time, which every callback of the frame shares
      const now = Number(document.timeline?.currentTime ?? performance.now());
      since += deltaMs;
      drawn = pacer.tick(now);
      ticks++;
      if (drawn) { lastMs = since; since = 0; draws++; }
    },
    false,
    true,
  );

/** Whether this display frame is drawn. */
export const drawsNow = () => drawn;
/** ms since the frame drawn before this one (GSAP's time, a long stall smoothed as its ticker smooths it). */
export const drawnMs = () => lastMs;
/** The display's interval (ms) and display frames per frame drawn, for the frame readout. */
export const pace = () => ({ display: pacer.display, every: pacer.every });
// for the evidence scripts: also GSAP's ticks and the frames drawn, so far
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") Object.assign(window, { __pace: () => ({ ...pace(), ticks, draws }) });
