/**
 * The picture's building jobs, taken in turn: each runs in an idle moment of its own, after the jobs queued before it,
 * so no two land in one frame. They're queued as the page loads, under the wake-up's loader, whose count waits on them
 * (lib/wake/built.ts): nothing is built once the visitor has woken Tycho (ADR 0018). Kept free of three.js, so page
 * code can queue on it.
 */

export const idle = () =>
  new Promise<void>((done) => {
    if (typeof requestIdleCallback === "function") requestIdleCallback(() => done(), { timeout: 1500 });
    else setTimeout(done, 16);
  });

let queue: Promise<unknown> = Promise.resolve();
/**
 * Runs `job` in an idle moment of its own, after the jobs queued before it. The queue waits on a job's promise, so a job
 * must never wait on anything queued after it (a scene's readiness, `stage.whole`): wait for that outside, then queue.
 */
export function inTurn<T>(job: () => T | Promise<T>): Promise<T> {
  const run = queue.then(idle).then(job);
  queue = run.catch(() => {});
  return run;
}
