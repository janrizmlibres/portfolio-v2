# Bubble variants — round 1, resolved

Janriz picked the first take of every set (2026-10-03). The variants are stripped and the `bub*` takes removed; the picked look stands in `components/bubble/`. Final evidence: `out/bubble-final-1440.mp4`, `final-{1440,390}.jpg`, `shots/final/`. Below is round 1 as it was shown.

For [Finalize the bubble](../../issues/64-finalize-the-bubble.md). Every variant is live on the real site (dev only), behind the take switcher (top left), with the stand-in Pip parked bottom right. Replies are canned and streamed the way the model's arrive (`components/bubble/canned.ts`), so no API spend. The old chat rail and sheet are hidden while the bubble is up, and the film's "Ask Pip about …" buttons ask Pip.

## Takes (first = my pick)

| Key | Variants |
|---|---|
| `bubShape` | `leader` · `tail` · `bare` |
| `bubReveal` | `rise` · `ink` · `cut` |
| `bubPace` | `4` · `5.5` · `7` words a second |
| `bubWait` | `look` · `ponder` · `track` |
| `bubLog` | `mission` · `chat` · `index` |
| `bubFold` | `leader` · `shrink` · `fade` |
| `bubPhone` | `opaque` · `glass` |

## Evidence

- MP4s (open → ask → thinking → reveal → fold on scroll → reopen → log → Esc), in `out/`:
  - `bubble-leader-1440.mp4`: leader, rise, 4 w/s, look, mission, fold along the leader
  - `bubble-tail-1440.mp4`: tail, ink, 5.5 w/s, ponder, fold by shrinking
  - `bubble-bare-1440.mp4`: bare, cut, 7 w/s, track, fold by fading
  - `bubble-leader-390.mp4`: leader on a phone
- Stills per shape: `shots/{leader,tail,bare}/{1440,390}-{1-think,2-mid,3-done,4-log}.png`; side by side in `compare-shapes-{1440,390}.png` and `compare-logs-{1440,390}.png`.

## Scripts

- `states.js`: stills of each state. `Q="?bubShape=tail" OUT=shots/tail node states.js 1440,390`
- `record-bubble.js`: the MP4 walkthrough. `NAME=x Q="?…" MODE=phone node record-bubble.js`
- Both take a capture slot (`../capture/slots.js`), so at most two runs share the GPU.
