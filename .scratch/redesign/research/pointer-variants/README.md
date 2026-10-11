# Finalize the pointer layer: round 1's evidence

Every take, made for real on the real site (`lib/voyage/hand.ts`), picked by the address or the dev take switcher:
- `?handLabel=callout` (default), `beside`, `catalogue`
- `?handChip=bracket` (default), `framed`, `reticle`
- `?handBusy=pinned` (default), `held`, `sweep`
- `?handCoast=heavy` (default), `light`
- `?handFling=stagger` (default), `snap`, `drift`

## Walkthroughs (1440, MP4)

Each plays the hero (empty sky, two stars, a drag let go), About (the chip over home, moved fast, then a star round home), LogoLife (the chip, then Pip answering about it), a hard scroll through Tolstoy's gate, a monolith, and Contact (a sweep, then resting on a star, then a drag).

| File | Label | Chip | Pip answering | Coast | Fling |
|---|---|---|---|---|---|
| `out/hand-default.mp4` | callout | bracket | pinned | heavy | stagger |
| `out/hand-b.mp4` | beside | framed | held | light | snap |
| `out/hand-c.mp4` | catalogue | reticle | sweep | heavy | drift |

`out/fling-*.png` are the hard scroll at 2 frames a second.

## Side by side

- `cmp-label.png`: callout, beside, catalogue at the hero, and catalogue at Contact.
- `cmp-chip-gate.png`: bracket, framed and reticle over LogoLife's gate, and bracket over home (before the plate).
- `cmp-plate.png`: the chip with its plate (top) against without (bottom), over home's hull and the gate.
- `cmp-busy.png`: pinned, held, sweep, and the keyboard's button pinning the reticle chip.
- `cmp-reduced.png`: reduced motion: a star's label, the chip, Contact resting on a star.
- `tap-390-small.png`: a tap on a star at 390, Pip answering.
- `shots/`: every situation in every take at 1440 (`look.js`).

## Measured

- **Frame cost:** the hand on and off back to back, the road played at 1440 with the pointer over the picture (`cost-ab.txt`): 58–59 fps both, GPU time moving with the machine's load (5.1–5.3 ms against 3.9–5.3), so no measurable cost. Subjects' places on screen are read only while the pointer could be over one.
- **Tests:** `lib/film/hand.test.ts` (19: the coast, the drag's speed, what the pointer is over, where the chip and a star's label sit) and the fling's lag (`lib/film/fling.test.ts`, 2 new), each red first. Unit 269/269 outside `.scratch/`; tsc and eslint clean on the hand's files; e2e 18/19 against the dev server, the one failure older than the redesign: the old chat panel shows every starter every time, so the State 1 test finds its text twice; *Build the bubble* removes both.

## Found and fixed on the way

- The chip's words couldn't be read over a lit hull: every take carries the portrait card's plate, faint.
- Under reduced motion a star's label landed off its star: the stage was posed at the last still captured, not the one shown. The runtime now poses it at the still in front (`lib/film/runtime.ts`).
- At Contact `[ DRAG TO TURN ]` flashed while the pointer rested on a star before its label showed.
