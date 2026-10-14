# Work builds home, a quarter of its ring a company

Status: accepted (2026-10-11). It replaces ADR 0012's chain of relays after the first throw: the relays at each
company, the lanes and the buoys. The relay by home stays, as Work's intro.

Work ran 17.7 screens, a third of the film: a full relay scene for each company (in, hold, charge, throw) and a buoy
for each breakthrough. Janriz, 2026-10-11: "the entire sequence is long … i like the first jump where the work section
is introduced, but after the jump it should be short … i still want to emphasize each company … make the breakthroughs
be like brief fly bys". Shorter relay ideas were "repetitive. i kinda want the relay to only be the work intro. the
actual work entries should be entirely different."

## Decision

- **The relay is Work's intro** (`lib/voyage/work.ts`, `relays.ts`). One relay by home, in its finished form ("the final
  constructed form since it's the only relay now"). The camera holds behind it while Work's intro is read, then it
  throws you back to August 2023. Its flash is a cut.
- **The throw goes back in time, not across the sky.** Out of the flash is home as it was then: its core alone.
- **The companies build home, a quarter of its ring each, oldest first** ("home, built job by job").
  - The ring has four identical quarters (`scripts/models/station.py`): a spoke, three nodes, a hab, a lab and a power
    bay. There are four companies. A fifth needs the model to change (`quartersOf` says so).
  - Each company's words are read in the column while its quarter builds, its stack on leader lines to the parts it
    built.
- **The ship builds itself in place.** Janriz: "constructing itself (preferably with the foundations or skeletons so we
  can really see it getting built in real-time) as opposed to just the modules falling in place".
  - Every vertex carries its build time (`_BUILD`, 0 to 1, quarter i over [i/4, (i+1)/4]). The ship's shaders and its
    shadow draw only what's built (`revealBuilt` in `ships.ts`).
  - Within a quarter: its spoke runs out from the hub, then its skeleton (ring frames and longerons, the nodes as
    joints) runs along the ring both ways from where the spoke meets it. The hull closes over that, its fittings just
    behind, and last the solar masts run out.
  - No glowing seam along the build's front ("i agree with not having the seam").
- **The ring turns a quarter between companies**, so every quarter is built on the side the camera holds. That side is
  a quarter turn round from his star, so it's lit from the side (`buildSide`, `turnOf` in `work-camera.ts`). The camera
  never goes round the ring. Once LogoLife closes it, the ring turns on, as About's does.
- **A busy timelapse** ("drones coming in and out like a timelapse … things are just blazing in and out"; `traffic.ts`).
  - 26 drones make trips to the build's front and weld there. Their lights trail short streaks.
  - Workers in EVA suits hold a spot for a shift, then are gone and somewhere else, as a timelapse's people are (his
    idea: "space construction workers").
- **Each breakthrough comes by as a craft after the company it came out during**, as five kinds of grounded sci-fi
  hardware: the freighter, a hauler, a work pod, a shuttle and a crane ship (`scripts/models/`). The four he built with
  dock at the hub's forward port. The rest pass close, never as the craft or the way before them (`callsOf`).
  - Its card is pinned in the column, its leader following the craft (`pinCard`). A card riding a craft that crosses
    the frame couldn't be read.
- **Work after the jump: 10.4 screens, from 15.1.** The film: 42.15 screens, from 46.89.

## Amendment, 2026-10-12: Projects leave home directly

Once home is built the film no longer goes back to the relay, and the spur is gone (Janriz: "after the work section it
should go from the ship to the Athena entry directly. and idk about the line. it doesn't represent anything"; the old
code is in `.scratch/redesign/research/spur-before/`). From where Work leaves the camera she's behind it (152° round),
and from her shot the ring is 50° below her, more than the frame is tall, so a turn between them crossed empty sky. A
pull-back to a wide shot of both read as bland ("it feels bland"). So, while Projects' intro is read, the camera makes
a farewell orbit round the finished ring by its sunlit side, to beyond it from her and below it. She comes out past its
rim with the ring big in the foreground, and the camera flies on to her shot.

## Considered options

- **Shorter relay beats**: one fast run through every relay, the chain seen side-on like a carousel, or one relay
  rebuilt per company. Rejected as "repetitive": the relay should be the intro only.
- **Each company as a constellation of its notes.** Too close to Around home.
- **A different spacecraft for each company.** Four new models, and metaphors that could feel forced.
- **Modules flying in to berth.** Replaced at his ask by the ship building itself in place.
- **One supply ship for every breakthrough.** Replaced as "repetitive" by five kinds of craft.
- **The camera circling the ring as it grows.** Half the stages would have faced his star, backlit. The ring turns
  instead.

## Consequences

- `work.test.ts` guards the plan: the quarters, which breakthrough comes after which company, the craft and their ways,
  the beats' order, and the build, the turn and the traffic at any moment. `work-camera.test.ts` guards the camera: the
  side lit from the side, each quarter turned to it, the rise, a phone's fit, and the turn rate.
- `scripts/models/build.sh station` writes the build times as 8 bits (`gltf-transform optimize` leaves custom attributes
  as floats, which compress badly): the ship is 1.95 MB, from 1.58. `build.sh traffic` merges the seven traffic models
  into one, so the station's maps they wear are carried once (1.62 MB, after the wake).
- The skeleton sits inside each hull, so About's whole ship draws it only while it isn't whole (`build`).
- The chain's code and the buoy are kept outside the repo's code: `.scratch/redesign/research/home-build/chain-before/`.
- The work's rounds (frames, clips, the harness): `.scratch/redesign/research/home-build/`.
