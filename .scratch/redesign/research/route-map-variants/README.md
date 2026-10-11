# Finalize the route map, round 1: the takes, on the real site

## Janriz's picks (2026-10-03), now the site's route map

**Porthole · ticks · grow · arc · drop, and Start replays.** He asked about porthole and the glow ban before taking it. He asked for the ticks to stand in one column (they were misaligned, a bug, fixed). He caught the grown names hanging in map order: they now hang in page order, the ticks' order and the keyboard's.
- The other takes are gone from the site. Their code is set aside in [`removed/`](removed/): the all-takes `RouteMap`, its CSS, the chart with the month ticks and the way along, and `takes.ts` with the `map*` keys.
- The picked form's evidence: `shots/final/` and `out/map-final-{1440,390}.mp4`.
- After the cleanup, unit tests, `tsc` and lint pass on the map's files.

The rest of this README is round 1, when every take was on the site.

Every variant Janriz asked to see (grilling round 1, 2026-10-03), made for real on the real site. Built on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See them

With the dev server on :3000, use the "Takes" chip top left (development only), or set the address:

| Choice | Takes (the first is the default and the recommendation) |
|---|---|
| The miniature | `?mapDraw=plot` · `chart` · `porthole` |
| At rest | `?mapRest=ticks` · `name` · `all` |
| Hover or focus | `?mapOpen=grow` · `list` |
| A warp, in the map | `?mapWarp=arc` · `along` |
| Phones | `?mapPhone=drop` · `full` |

To see a trip, take a link. The warp isn't built yet, so a link glides there by scroll, and the map plays the trip in miniature while it does.

## What's built

- **`lib/routemap/chart.ts`** (tested, 21 cases): the chart without three.js, in the HTML from first paint.
  - **The projection:** seen from the hero's side, straight along the line of sight, never turning.
  - **The framing:** framed on the voyage. Seen whole, the sky crowds the voyage into a sixth of it, so the stars beyond the frame are left out and the ones near its edge fade.
  - **The voyage as one track:** each point is tied to the film time the camera is there (the road point by point at the film's pace), so "you are here" and the trail follow the film exactly.
  - **The marks:** each section where it sits, and a tick each month along the road.
  - **Which section** you're in at a time, the way there along the voyage or across it in an arc, and the reading spot under reduced motion.
  - **`stackLabels`:** keeps the callouts apart. About and Contact share a place, since home orbits his star.
- **`components/routemap/RouteMap.tsx`**: a real `<nav>` of `<a href="#sec-…">` (the deep links glide).
  - **What updates each frame:** only "you are here", the trail, the trip and the flare. The flare reads the sky's star state once it loads (`lib/universe/live.ts`).
  - **Opening:** hover or focus opens it, and GSAP plays every move.
  - **On a phone:** a pill that unfolds into a sheet. Escape (focus back to the pill) and a tap outside fold it.
  - **Reduced motion:** "you are here" holds the reading spot whose still is shown.
  - **The plain page:** a row of links.
- **`app/routemap.css`**: the states.

## Evidence

Made by [`evidence.sh`](evidence.sh) (`./evidence.sh shots`, `./evidence.sh rec`). Three combinations cover every variant:

| Combination | Address |
|---|---|
| plot · ticks · grow · arc · drop | (the default) |
| chart · name · list · along · full | `?mapDraw=chart&mapRest=name&mapOpen=list&mapWarp=along&mapPhone=full` |
| porthole · all · grow · arc · drop | `?mapDraw=porthole&mapRest=all` |

- **Side by side** (plot, chart, porthole, left to right; the map's corner at 2×):
  - [`compare-rest-about-1-1440.png`](compare-rest-about-1-1440.png): at rest, at About;
  - [`compare-rest-role-1440.png`](compare-rest-role-1440.png): at rest, at LogoLife's gate;
  - [`compare-open-1440.png`](compare-open-1440.png): opened;
  - [`compare-hover-projects-1440.png`](compare-hover-projects-1440.png): Projects hovered, its marks and the way there;
  - [`compare-pill-390.png`](compare-pill-390.png): the pill;
  - [`compare-sheet-390.png`](compare-sheet-390.png): the sheet, drop or full.
- **`shots/<combination>/`:** five reading spots at rest (hero, About, LogoLife, Athena, Contact), opened, a link hovered, the trip and its arrival, at 1440 (with the corner cropped at 2×) and 390.
- **`out/map-<combination>-{1440,390}.mp4`** (contact sheets beside them):
  - **1440:** About read on into the road (you are here moves, the trail fills), the map opened, each link hovered, Projects taken (the trip, "→ Projects" beside the map), then Start taken back.
  - **390:** the pill, its sheet, a trip, Escape.
- **Frame cost** ([`cost.js`](cost.js) → `evidence/cost.txt`): the same scripted scroll, About into the road, with the map shown and hidden. No measurable difference in any take:

  | | shown (mean / p95 ms) | hidden |
  |---|---|---|
  | 1440 plot | 16.72 / 17.2 | 16.69 / 17.3 |
  | 1440 chart | 16.72 / 17.1 | 16.69 / 17.1 |
  | 1440 porthole | 16.73 / 17.7 | 16.73 / 17.7 |
  | 390 plot | 16.73 / 17.7 | 16.70 / 17.6 |
  | 390 chart | 16.72 / 17.6 | 16.70 / 17.6 |
  | 390 porthole | 16.69 / 17.6 | 16.69 / 17.6 |

  60 fps throughout: one frame over 20 ms in each run, shown or hidden alike.
- **Tiers** ([`tiers.js`](tiers.js)): reduced motion names the section of the still shown (Contact, Projects, About at their spots); the plain page is a row of five links (`shots/plain-1440.png`).

## Known, for the build

- The grown map and its names reach about 420 px from the right edge while open. That's only while hovered, but at rest it's wider than `ROUTE_MAP_CLEAR` keeps clear: with ticks or names beside it, about 200 px from the right edge (`ROUTE_MAP_CLEAR` keeps 150 px). *Build the route map* matches the two.
- Screenshots taken during a glide tear (a black band), a headless artefact of a fast scroll. The trips are shown in the MP4s.
