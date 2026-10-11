# Orchestration — the build wave (2026-10-04)

Janriz asked for every remaining build ticket to be finished and polished, top to bottom, in parallel where the blockers allow. One orchestrator session (`portfolio-v2-fd`) spawns one subagent per ticket. Finalize the score (63) runs in its own session (`portfolio-v2-7f`). Tickets 22 and 23 are left alone.

## Your job, as a ticket's builder

1. Read `map.md`'s Notes, your ticket in full (question and every comment, especially the 2026-10-04 "orchestration brief" ones, which are Janriz's latest word and override older answers), its finalization ticket's **Answer**, and the code it names. AGENTS.md and CLAUDE.md rules all hold (GSAP only, real HTML text, culling, reduced-motion and phone branches, comments that cite nothing outside the checkout).
2. Set your ticket's `Status: claimed` and post on the board (below).
3. Build it to the finish bar, test-first where there's logic (Red → Green → Refactor, with a named Refactor verdict). Visual work: an MP4 recording plus screenshots at every reading spot, at 1440 and 390, and look at them yourself; fix what you see. Polish is part of the job: Janriz wants it finished, not a stand-in.
4. **Performance is part of done.** Cull what's out of frame or out of its scene's time (as *Finalize the hero and home* did for scene 1). Measure frame cost on a fast scroll through your scenes at 1440 and 390 and hold 60 fps. Janriz gets massive frame drops on the Work route when scrolling fast; don't add to it.
5. Finish: write `## Answer` (what was built, what changed from the storyboard and why, numbers measured, and a short "for Janriz to look at" list), set `Status: resolved`, add a one-line entry under the map's "Decisions so far", post a comment on each ticket your work hands something to, and post "done" on the board.
6. Your final message to the orchestrator: at most 150 words — resolved or not, what Janriz should look at, anything that blocks a dependent ticket. No file dumps.

## Shared checkout — everyone works in the same tree

- **Never commit, stash, reset, checkout or otherwise touch git state.** The redesign is uncommitted on `redesign`; Janriz commits.
- **The board:** `.scratch/redesign/.locks/board.md`. Append a line (`HH:MM <ticket> <what>`) when you claim, before editing a file another ticket may own, and when you finish. Read it before editing any shared file. Also message peers with `SendMessage` where you can (`ListAgents` shows who's up; Finalize the score is `portfolio-v2-7f`).
- **Shared files** (`lib/voyage/stage.ts`, `lib/voyage/takes.ts`, `lib/voyage/script.ts`, `lib/voyage/world.ts`, `lib/film/runtime.ts`, `components/voyage/Voyage.tsx`, `app/voyage.css`, `lib/audio/*`, `lib/voyage/home.ts`): re-read just before each edit and use exact-string `Edit`s, never whole-file `Write`. Prefer hooks (register/subscribe modules in your own files) over editing another ticket's scene code. `takes.ts` is append-only: add only your own keys with your ticket's prefix, test only your own keys.
- **The dev server on :3000 is Janriz's.** Never stop or restart it. Another ticket's edit hot-reloads the page mid-capture: wait for `window.__film` and the universe before each shot, and re-shoot any run that broke.
- **Janriz's machine lags under load (2026-10-04): one heavy job at a time, machine-wide.** Heavy = any headless browser run (capture, recording, screenshots, perf measurement, e2e), a production build, Blender renders/bakes, `pnpm audio:export`, a vitest/typecheck/lint run. All of them take the single lock `.scratch/redesign/.locks/heavy` (this replaces capture-1/capture-2/test/build below, which no longer apply). Hold it as briefly as possible: shortest clip that shows the thing, only the reading spots you need, one viewport per run when you can, close the browser at once. Never leave a browser, Blender job or watcher running in the background. Reading code, editing and thinking need no lock.
- **Locks** (superseded by the heavy lock above; kept for reference):
  - captures/recordings/perf measurements: `mkdir .scratch/redesign/.locks/capture-1` or `capture-2` (at most two at once, machine-wide); if both exist, wait and retry.
  - unit tests, typecheck, lint, e2e: `mkdir .scratch/redesign/.locks/test` (one at a time). Vitest: `--maxWorkers=2` (scope to your files: `pnpm vitest run <paths> --maxWorkers=2`). Exit codes from unpiped runs (`cmd > out.txt 2>&1; echo "exit $?"`).
  - a production build for perf: `.scratch/redesign/.locks/build`.
  - Stale lock (older than 20 min, its owner gone per the board): remove it and note it on the board.
- E2E: point a temporary Playwright config at :3000 (no `webServer`), headless, `--workers=2`; delete it afterwards.
- Recordings: scripted headless Playwright per `research/capture/` (and `~/.claude/templates/record-walkthrough.js`), MP4 (libx264, yuv420p). Put them in your ticket's research folder.

## Waves

- Wave 1 (now): 36, 39, 40, 43, 45, 49, 67.
- Rolling (one heavy job machine-wide; orchestrator keeps at most 4 builders running from here on): 37 & 38 after 36; 41 after 40; 42 after 41; 44, 46, 66 after 49; 68 after 45 and 66; 47 after 63; 69 last.

## Running (orchestrator's ledger)

| Ticket | Agent id | Started | State |
|---|---|---|---|
| 36 | a603bd332e9fc2c7d | 16:17 | resolved |
| 39 | abed641c24381b1df | 16:17 | resolved |
| 40 | ac656d3ce563af9c7 | 16:17 | resolved |
| 43 | a737bbe5e3a13d673 | 16:17 | resolved |
| 45 | a97355e47ca83112e | 16:17 | resolved |
| 49 | ab1512128c140c464 | 16:17 | resolved |
| 67 | ad05f49911513f63d | 16:17 | resolved |
| 66 | a435027ab99967dd3 | 17:52 | resolved |
| 41 | af0f3b5a36229ad1b | 18:04 | resolved |
| 46 | a51c12ad005d87916 | 18:06 | resolved |
| 37 | a9ff9121cc72a09a0 | 18:13 | resolved |
| 38 | a004111c8d20fa160 | 18:34 | resolved |
| 68 | ab4ea9a8d82f2ea27 | 18:41 | resolved |
| 42 | a18f7c685243ffe0e | 18:50 | resolved |
| 44 | ac495099ecf9dd797 | 19:02 | resolved |
| 70 | a5b292a3621db7dc1 | 19:30 | resolved |
| 47 | aa2a87b0ca0dc152d | 20:15 | resolved |
| dark-models fix | a154d1f85310cc000 | 20:25 | resolved |
| 69 | aeb77cf85dc42f855 | 20:57 | resolved |
| 63 | session portfolio-v2-7f | — | resolved |
