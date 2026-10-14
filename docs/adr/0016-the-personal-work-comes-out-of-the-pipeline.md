# The personal work comes out of the pipeline

Status: accepted (2026-10-13).

The personal work was a ribbon of its own: a deployable array standing in the personal lobe, 0.4 from the crawler's
shaft (eight times the distance the camera reads a frame from), a canister paying out a boom, slabs hinged one to the
next. The record you fell with flew out of the shaft to it, opened out of four leaves into the first slab, and the rest
paid out from it. As the camera pulled out it folded back up.

Janriz (2026-10-13): "I personally find it kinda odd since it just appears out of nowhere and I don't find the
unfolding thing appealing … I think the frames coming out of the pipeline is nice, but it looks jagged (the camera
movement bobs up and down and is sudden / abrupt) … Since they're pipeline data we can do the same spiral carousel
without it being a new machine and after it will shrink away during zoom out."

Measured, the camera chasing the record rose 0.08 over the shaft and dropped 0.1 to the ribbon, its view swinging from
57° up to 34° down and back to 8° down within a screen and a half, and its distance swelling and shrinking (0.047 to
0.073 to 0.030) as it went.

## Decision

- **The frames are the pipeline's records, grown.** After the climax they come out of Save's store, down the bore and
  out from under the shaft's foot, the record you fell with first. Each grows from a record into a frame as it swings
  out, tipping up to stand, its screen written in from its leading edge (`spiral.ts`, `ribbon.ts`).
- **They stand free, on a spiral round the shaft's axis**, winding down from a frame's height under the report's deck:
  the old ribbon's spacing and turn (`RIBBON` in `script.ts`), so the reading spots and their times are unchanged.
  Nothing holds them (no canister, boom, hinges, tapes or stays), as the stream's records fly. The first faces
  0.74 rad round from the crawler's star, so its metal is lit from the side.
- **The climax ends looking at where the first will stand**, and the camera never chases anything. It draws back out
  from under the deck, its view coming down the shaft to the bore's way out as the first frame comes out. It watches the
  frames come out with the shaft's foot and the first frame's place in shot, then eases in to the first as the last
  lands. Its height only ever falls (on a phone, where the climax ends lower, only ever rises). Its view only tilts down,
  47° up to 8° down over a screen and a half, at most ~90° a screen.
- **The camera comes round the spiral as it came round the ribbon**, each frame turning square to you; going down the
  spiral, the camera goes down with it.
- **The crawler and its shaft go while the first frames are read**, out of frame above them (Janriz, 2026-10-13: "by
  the end of the projects carousel we should no longer see the crawler").
- **As the camera pulls out to Contact, the frames go out by a hidden exit** (Janriz: "Each entry / sheet shrinks and
  disappears into thin air. It should look like the chain is disappearing into a hidden exit"): they slide on round the
  spiral as one chain, and each shrinks into nothing at the same point a step past the last frame's place, the last
  first, its screen dimming as it goes (`exitOf`).
- **They're lit by the crawler's star**, as the shaft is: by the crawler's own key while it's in, then by the ribbon's,
  from the same star (never both). The crawler's shadow is redrawn only while the shaft round the stage it falls on is
  in frame.

Janriz asked in the same round that the crawler stop standing at the frame's edge while Athena is read: it now comes in
with the stream out of it, as her lines go and the camera turns upstream.
The stream into her loses the hairline drawn along it: the records flowing along it are the ingested data it stood
for, and now read on their own, so the line only repeated them (Janriz agreed, 2026-10-13).

## Considered options

- **The ribbon's own place, the frames streaming to it.** The flight across 0.4 of empty sky is what the camera bobbed
  along; a straight travel would cross that sky with nothing in it.
- **The spiral round the shaft itself**, at Save's height. The lit rings would stand behind every screenshot while it's
  read.
- **Seen from inside the spiral**, the camera on the axis. Its frames would be 0.03 away, too close to read, and the
  turn a pan.

## Consequences

- `deploy.ts` (the hinge chain) and `public/voyage/ribbon/ribbon.glb` (the canister and boom) are gone; `spiral.ts` holds
  the frames' places, their way out and their shrink, tested.
- With the crawler and its shaft drawn until the first frames are read, the scene drew in 4.2 to 5.4 ms a frame at
  1440×900 and 1.0 to 4.3 ms on a phone (measured 2026-10-13, one session, the governor at its full pixel ratio
  throughout); with them gone from then on, less.
- The pipeline is drawn while the crawler hosts it (`pipe.host`); a hidden crawler hosts none, so the shaft goes with it.
- The route map's chart frames the voyage tighter, the ribbon's far-off point gone (`lib/routemap/chart.ts` lays the
  ribbon under the crawler as the world does).
- The intro's line, "Three things I built for myself, wound into one ribbon", still reads; it's Janriz's to change.
- `AGENTS.md`'s camera rules gain one: don't chase a subject along its curve.
