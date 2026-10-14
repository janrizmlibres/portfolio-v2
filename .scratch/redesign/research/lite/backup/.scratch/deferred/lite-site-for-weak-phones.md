# A lighter site for phones that can't hold the film

Status: claimed
Deferred: 2026-10-14, after Janriz tried the deployed redesign on a phone

## What happened

Janriz opened the production site (PR #1, `ab8f71b`) in Chrome on an Android phone, a **Poco X7 Pro**, and found it "still very laggy". That was after the quality levels (ADR 0017) and the whole voyage loading under the loader (ADR 0018). He suggested "a non-3D version or at least less 3D version of the site".

## The phone is mid-range, not low-end

From its published specs, not measured: a MediaTek Dimensity 8400-Ultra, a Mali-G720 MC7 GPU, 8 or 12 GB of RAM, and a 6.67" 1.5K display (2712×1220, a DPR of about 2.75) that runs at up to **120 Hz**.

So the fix isn't only for truly weak hardware. What today's code does with this phone:
- `startQuality` (`lib/universe/tier.ts`) starts it at `mid`. A coarse pointer takes off one level. `deviceMemory` caps at 8, so the phone never counts as lean. Mali-G720 isn't in `WEAK_GPU`.
- Chrome on Android has no GPU timer query, so the governor judges only by missed frames. It can lower the pixel ratio to 1 and then step to `low`.
- **Hypothesis to check first: 120 Hz.** At 120 Hz, `requestAnimationFrame` runs at 120 a second and a frame has 8.3 ms. The film draws every rAF, so a GPU that can almost hold 60 swings between 120, 60 and 40 fps, which reads as judder. The governor measures misses against the display's own interval, so it would also step down hard and still not settle.
  - Capping the film's draws at 60 fps on high-refresh displays (drawing every other rAF, with the clock still on real time) may fix most of this without touching the 3D.
  - Measure before building anything.

## The proposal (the coordinator's, 2026-10-14)

Use the two lighter versions the site already has, rather than building a new reduced-3D film:

| Version | What it is | Who gets it today |
|---|---|---|
| `film` | the full voyage, drawn every frame | everyone else |
| `still` | the same scenes, drawn once per reading spot and crossfaded, with nothing moving between; almost no ongoing cost, and it still looks like the site | `prefers-reduced-motion` only |
| `plain` | no 3D: the page flowing, flat Tycho, the chat the same | no WebGL only |

1. **Phones that can't hold the film get `still`.** On those phones Tycho uses his flat drawing too (his own WebGL canvas runs even in `still`).
2. **Phones that can't manage even that get `plain`.**
3. **Decided at the start of a visit, never mid-scroll.** It's set before first paint, from the same signals as the quality level but stricter. Possibly also from the governor's verdict on an earlier visit, remembered per browser.
4. **A small Lite / Full switch**, remembered per browser, so a capable phone can go back to the film and a struggling one can drop down.

A reduced-3D film (fewer scenes, no shadows, simpler models) was judged too costly for what it buys. Most of the cost is the scroll-driven redraw itself, not any one effect.

## First steps when it's picked up

1. **Measure on the phone.** Open `https://jrz-libres.vercel.app/?perf` on the Poco X7 Pro and scroll the whole film. The readout gives each late frame's film time and cause (`lib/film/perf-hud.ts`). Note the display rate (`?perf`'s interval), where the drops cluster, and whether the governor stepped the pixel ratio or the level. Chrome remote debugging (`chrome://inspect`) can record a Performance trace from the phone.
2. **Try the 60 fps cap** if the phone runs at 120 Hz, and compare the drops.
3. **Add `?film=still|plain`.** It's a small override in the head script (`lib/film/tier.ts`), allowed in production, so Janriz can try both versions on the same phone before choosing.
4. Then the detection rule and the Lite / Full switch, with an ADR for the rule. The tier is a visit-level decision, as the quality level is (ADR 0017).

## Open questions for Janriz

- Is `still` acceptable as the lite look, or does lite have to be `plain`?
- Where should the Lite / Full switch live (the route map, beside the sound toggle), and what should it say?

## Comments

- 2026-10-14, Janriz: "let's do it now. Still is acceptable." The coordinator's call on the switch:
  - `[ LITE ]` / `[ FULL ]`, in mono brackets beside the sound toggle, remembered per browser. Switching reloads the page at the current section.
  - A one-time offer, "Running slow? Switch to lite", once the governor is at `low` and still missing frames. It never switches on its own mid-visit, but the next visit starts in lite.
  - Weak devices start in lite.
