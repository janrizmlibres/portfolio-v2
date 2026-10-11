# Scene star clusters: can each scene be found inside its own stars?

Researched 2026-09-29 against the PCA sky from *Export the sky* (ticket 26), with UMAP only as a comparison. Facts, not a verdict. Confidential material is referred to by topic key only.

## Short answer

- **Only one stop is a clean, findable cluster: FlowStack.** It has 9 stars, a tight spread of 0.083, sits 0.39 from the nearest other stop and has nothing foreign in its frame.
- **Mercado is loose but its own place.** It has 6 stars, and 2 unclaimed stars sit among them.
- **About is not a cluster. It is the whole bright core of the sky.** Its 16 stars spread 0.30 around their centroid, which is 20% of the sky's diameter. The best framing of them also takes in 35 stars that aren't About's. All 4 roles, Athena and the crawler sit inside that spread.
- **The 4 roles are 1–2 stars each, and they collapse into two pairs.**
  - LogoLife and Tolstoy are 0.090 apart.
  - Elinnov and the Crusader Yearbook are 0.058 apart.
  - The typical gap between neighbouring stars is 0.079, so the camera would barely move between those scenes.
- **Four stops have zero stars:**
  - Counselor Dashboard, Data Maintenance Pipeline and E2E Testing Suite were never written up, and today's wiki has no pages for them either.
  - Contact has no page.
- **Crawler Dashboard and AI-Assisted Crawler share one star.** Athena is one star, and so is PulseVR.
- **No displayed stop is a confidential employer.** The two confidential org pages were dropped from the sky, but neither was ever a stop.
- **The scene order is not a zig-zag.**
  - The path is 3.58 units long, 2.34× the sky's diameter.
  - The shortest order through the same targets is 2.92, and a random order averages 5.22. The proposed order ranks in the best 0.5% of orders.
  - Its real shape: five or more scenes in one small patch, one long crossing to the personal-projects lobe, then back out.
- **Half the sky belongs to no stop:** 46 of 93 stars, counting the early-career and work-hub stars as Work.
  - The upper hemisphere is almost empty of stops: 25 of its 28 stars are unclaimed.
  - After FlowStack, the two cleanest clusters in the sky are unclaimed: `t43`+`t08` (Emergent Echoes, 12 stars) and `t23` (NSP IMS, 9 stars).
- **So "each scene is found inside its own stars" holds at the level of regions, not stops.**
  - About = the core lobe.
  - Work = a career sub-lobe (LogoLife, Tolstoy, Athena) and a campus sub-lobe (Elinnov, Crusader Yearbook).
  - Projects = the personal lobe.
  - Per-stop dives only read for FlowStack and Mercado.

## Scale

Stars sit in the unit sphere (`scripts/sky/project.ts` normalises both layouts).

| Measure (PCA) | Value |
|---|---|
| Bounding box | x −0.645…0.726, y −0.562…0.643, z −0.593…0.796 |
| Max radius / median radius | 1.000 / 0.509 |
| **Diameter** (largest star-to-star distance) | **1.53** |
| Mean star-to-star distance | 0.766 |
| Nearest-neighbour gap, median / mean / max | **0.079** / 0.095 / 0.280 |
| Stars within 0.15 of a star (median) | 3 |
| On screen in the hero (`sky.js`: FOV 32°, radius 0.9 fitted to `size` 0.8, camera about 3.9 units out) | 1 unit ≈ 0.44 of the viewport's shorter side. On a 900-px-tall window that is about 400 px per unit, so the median star gap is about 32 px |

## Q1: which topic keys and how many stars cover each stop

A star counts toward a stop when its topic key is a page about that stop.

| Stop | Topic keys (stars) | Stars | Notes |
|---|---|---|---|
| **About / home** | `t14` (1), `t19` (6), `t05` (1), `t28` (1), `t30` (1), `t10` (1), `t20` (1), `t13` (1), `t39` (1), `t40` (1), `t06` (1) | **16** | Profile, university, school, city, interests, beliefs, childhood, high school, relationships. The 11 stars in `t14 t19 t05 t28 t30 t10` are what the About copy actually says. They behave the same way (spread 0.303). |
| Work overview (not a stop, but where the roles are told as a story) | `t17` (6), `t35` (1) | 7 | Early-career bio and the work hub. 5 of the 6 `t17` stars, plus `t35`, mention a confidential employer in passing. |
| **Role: LogoLife** (2025–26) | `t44` (1) | **1** | |
| **Role: Tolstoy** (2025) | `t12` (1), `t25` (1) | **2** | `t25` is the employer-of-record page for the same engagement. |
| **Role: Elinnov** (2024) | `t21` (1) | **1** | 2 more `t22` stars (the certifications page's practicum section) are about this role. Claimed by star id, the three form a 3-star knot with a spread of 0.058 and no foreign stars in their frame. This needs star-level claims, not topic keys. |
| **Role: Crusader Yearbook** (2023–24) | `t24` (1), `t01` (1) | **2** | `t01` is the tools built in the role. The two stars are 0.473 apart. |
| **Athena** | `t18` (1) | **1** | |
| **Counselor Dashboard** | none | **0** | Never written up. No published text mentions it, and today's wiki has no page for it either. |
| **Crawler Dashboard** | `t11` (1), shared | **1 (shared)** | The dashboard is an alias of the crawler page, so it has no star of its own. |
| **AI-Assisted Crawler** | `t11` (1), shared | **1 (shared)** | Same star as above. |
| **Data Maintenance Pipeline** | none | **0** | Never written up. No published text mentions it by name, and there is no page today. |
| **E2E Testing Suite** | none | **0** | No page. It is mentioned in passing inside other stars: `t44`, `t11`, and possibly `t17`/`t35`. |
| **FlowStack** | `t16` (9) | **9** | |
| **PulseVR** | `t31` (1) | **1** | |
| **Mercado** | `t27` (6) | **6** | |
| **Contact** | none | **0** | No contact page. The only star carrying contact-type links is `t14`, which already belongs to About. |

**Confidential employers.** Neither is a stop, so no stop lost stars to the exclusion. The 4 roles, Athena and the crawler are all public pages. Their thin counts come from the May snapshot, not from the exclusion: the project pages for the other LogoLife work were never written.

**Unclaimed:** 46 stars when the Work overview counts as Work, 53 when it doesn't.
- `t43` (11) and `t08` (1): Emergent Echoes and its paper.
- `t23` (9) and `t09` (1): NSP IMS and its client org.
- `t22` (9): certifications.
- 9 single-star projects: `t02 t03 t04 t07 t15 t26 t29 t33 t36`.
- 4 club and event stars: `t32 t37 t41 t42`.
- 2 people: `t34 t38`.

## Q2: each stop in PCA space

Definitions:
- **Spread**: the mean distance from the stop's stars to their centroid.
- **Own nearest**: how many of the stop's stars have one of its own stars as their nearest neighbour.
- **Best frame**: the camera placed to fit the stop's stars (frame radius = 1.15 × the stop's max radius, minimum 0.08; FOV 32°), searched over 4,000 directions. It gives own stars in frame against foreign stars at or in front of the stop's depth.

| Stop | n | Centroid (x, y, z) | Spread | Nearest other stop (distance) | Own nearest | Best frame own : foreign | Verdict |
|---|---|---|---|---|---|---|---|
| About | 16 | (0.337, −0.043, −0.113) | **0.299** (max 0.558) | Elinnov (0.111) | 6/16 | 16 : **35** | **Overlaps.** A region, not a cluster. It contains every role's centroid, at 0.11–0.28 from its own. |
| LogoLife | 1 | (0.224, −0.256, −0.264) | 0 | Tolstoy (**0.090**) | 0/1 | 1 : 1 | **Overlaps Tolstoy.** Its nearest star is a Tolstoy star 0.047 away, and 6 stars lie within 0.15. |
| Tolstoy | 2 | (0.213, −0.229, −0.179) | 0.077 | LogoLife (**0.090**) | 0/2 | 2 : 2 | **Overlaps LogoLife.** The two stars are 0.154 apart. LogoLife's star is 0.047 from one of them, and the profile star is 0.072 from their midpoint. |
| Elinnov | 1 | (0.358, 0.038, −0.040) | 0 | Crusader Yearbook (**0.058**) | 0/1 | 1 : 0 | **Fused with the Crusader Yearbook.** One star in the campus sub-lobe. Better as the 3-star knot described in Q1. |
| Crusader Yearbook | 2 | (0.314, 0.049, −0.004) | 0.237 | Elinnov (**0.058**) | 0/2 | 2 : **10** | **Not a cluster.** The two stars are 0.473 apart, and their centroid lands on Elinnov. |
| Athena | 1 | (0.130, −0.079, −0.180) | 0 | Tolstoy (0.172) | 0/1 | 1 : 0 | **A lone star.** It can be framed alone (nearest star 0.108, the profile star), but it doesn't read as a place. |
| Crawler (both stops) | 1 | (0.019, −0.071, −0.023) | 0 | Athena (0.193) | 0/1 | 1 : 0 | **A lone star at the dead centre of the sky** (0.077 from the origin). Two stops share it. |
| FlowStack | 9 | (−0.555, −0.496, 0.251) | **0.083** (max 0.105) | Mercado (0.388, **4.7× its spread**) | 9/9 | 9 : **0** | **Distinct and findable.** On the sky's rim (0.79 from the centre). |
| PulseVR | 1 | (−0.307, −0.179, −0.046) | 0 | Mercado (0.243) | 0/1 | 1 : 0 | **A lone star on Mercado's edge.** Its two nearest stars (0.122 and 0.124) are Mercado's. |
| Mercado | 6 | (−0.416, −0.144, 0.168) | 0.124 (max 0.220) | PulseVR (0.243, 2.0× its spread) | 6/6 | 6 : 3 | **Findable, loose.** Two pairs plus two outliers. `t02` and `t33` sit inside its extent. |
| Counselor Dashboard, Data Maintenance Pipeline, E2E Testing Suite, Contact | 0 | none | none | none | none | none | **Nothing to dive into.** |

A single star can always be framed alone by moving the camera close enough (about 0.28 from it), so "1 : 0" means only that the star is isolated. It doesn't make a place.

**Groupings tried** (PCA):

| Grouping | n | Centroid | Spread | Best frame own : foreign | Reads as |
|---|---|---|---|---|---|
| Work overview (`t17`+`t35`) | 7 | (0.191, −0.274, −0.354) | 0.148 | 7 : 12 | A loose patch 0.10 from LogoLife |
| LogoLife world (`t44`+`t18`+`t11`) | 3 | (0.124, −0.135, −0.156) | 0.144 | 3 : 8 | Not a knot. The three stars are strung out toward the centre |
| All 4 roles (org pages) | 6 | (0.273, −0.096, −0.111) | 0.224 | 6 : 26 | Same place as About (centroids 0.083 apart) |
| Roles + early-career + work hub | 13 | (0.229, −0.192, −0.242) | 0.224 | 13 : 26 | The career sub-lobe, blended into About |
| *Unclaimed:* Emergent Echoes (`t43`+`t08`) | 12 | (−0.443, 0.512, −0.407) | 0.214 | 12 : **0** | Distinct lobe, at least 0.79 from every stop |
| *Unclaimed:* NSP IMS (`t23`) | 9 | (0.054, 0.415, 0.673) | 0.163 | 9 : 1 | Distinct lobe, at least 0.81 from every stop |
| *Unclaimed:* certifications (`t22`) | 9 | (0.325, −0.227, −0.103) | 0.150 | 9 : 15 | Buried in the core, 0.13 from Tolstoy |

**The sky's natural regions** (k-means, best of 50 seeds):

| Region (k = 4) | Stars | Centroid | Stops inside |
|---|---|---|---|
| Core (life, school, career) | 46 | (0.32, −0.10, −0.11) | About (14 of 16), all 4 roles, Athena, crawler, Work overview; 17 unclaimed |
| Personal builds | 25 | (−0.41, −0.23, 0.14) | FlowStack, Mercado, PulseVR, 2 About stars (`t06`, `t10`); 7 unclaimed small projects |
| Emergent Echoes | 12 | (−0.44, 0.51, −0.41) | none |
| NSP IMS | 10 | (0.08, 0.43, 0.65) | none |

At k = 6 the core splits in two:
- A **career** sub-lobe (24 stars; centroid (0.25, −0.23, −0.21)) holds LogoLife, Tolstoy, Athena, `t17`, `t35` and 7 `t22`.
- A **campus** sub-lobe (17 stars; centroid (0.51, 0.07, 0.01)) holds Elinnov, the Crusader Yearbook org star, Xavier, the clubs and the high school.
- The two are 0.45 apart.
- About straddles both: 6 stars in career, 7 in campus, 3 near the centre.
- The personal lobe tightens to 14 stars: FlowStack, half of Mercado, and 2 unclaimed stars.

**UMAP, for comparison only:**
- FlowStack stays distinct (spread 0.080), and Mercado tightens (0.062, 6 : 0).
- Tolstoy's two stars close up to 0.054 apart (spread 0.027).
- The LogoLife world (`t44`+`t18`+`t11`) becomes a real 3-star knot (spread 0.047, 3 : 1). "Athena's world" works there, not in PCA.
- About is purer: 12 of the 16 stars nearest its centroid are its own, against 7/16 in PCA, and its best frame is 16 : 19.
- The star counts and the zero-star stops don't change.

## Q3: the scene path Hero → About → Work (newest first) → Projects → Contact

The camera targets each stop's centroid. It starts and ends at the sky's centre: Contact has no stars, so it pulls back out.

| Leg | Distance |
|---|---|
| Hero (centre) → About | 0.358 |
| About → LogoLife | 0.284 |
| LogoLife → Tolstoy | 0.090 |
| Tolstoy → Elinnov | 0.333 (cuts back across About) |
| Elinnov → Crusader Yearbook | 0.058 |
| Crusader Yearbook → Athena | 0.285 |
| Athena → Crawler | 0.193 |
| Crawler → FlowStack | **0.766** (half the diameter) |
| FlowStack → PulseVR | 0.501 (heads back inward) |
| PulseVR → Mercado | 0.243 |
| Mercado → Contact (centre) | 0.471 |
| **Total** | **3.58 = 2.34× the diameter** |

| Comparison | Length | × diameter |
|---|---|---|
| Stops only (About → last project) | 2.75 | 1.80 |
| Proposed order, total | 3.58 | 2.34 |
| Same order, but Projects as Athena, Crawler, PulseVR, FlowStack, Mercado (best project order) | 3.31 | 2.16 |
| Roles oldest-first instead | 3.37 | 2.21 |
| Shortest possible through the same 10 targets | 2.92 | 1.91 |
| Random order (mean of 20,000) | 5.22 | 3.41 |
| Region-level path: centre → core → career → campus → personal lobe → centre | 2.81 | 1.84 |

- **It is a sane path, not a zig-zag.**
  - Everything from About to the crawler (7 targets for 8 scenes, plus the 3 zero-star projects) stays inside one patch about 0.41 across, 1.24 units of travel in all.
  - Then comes one long crossing to the personal lobe, a loop there, and the pull back.
  - Turns sharper than 90° happen at About (97°), LogoLife (133°), Athena (99°), FlowStack (159°), PulseVR (131°) and Mercado (132°).
  - FlowStack sits on the rim at a dead end, so every order turns back there.
- **The problem is the opposite of a zig-zag: too little travel between Work scenes.**
  - At the hero's scale, LogoLife → Tolstoy is about 36 px and Elinnov → the Crusader Yearbook about 23 px.
  - A dive close enough to separate them puts the camera about 0.28 from a single star, inside the core, with the About stars all around.

## Q4: what makes "each scene is found inside its own stars" awkward

| Issue | Evidence | Stops affected |
|---|---|---|
| **Zero stars** | No page and no mention for Counselor Dashboard and Data Maintenance Pipeline. E2E is only mentioned inside `t44`/`t11`. Contact has no page. None of the four has a page in today's wiki either, so a republish won't fix it. | 4 of 15 stops |
| **Stars too few to read as a place** | 1 star each: LogoLife, Elinnov, Athena, PulseVR, and the crawler, which two stops share. 2 stars: Tolstoy (0.154 apart) and the Crusader Yearbook (0.473 apart, so not a pair). The median star has only 3 neighbours within 0.15. | 8 stops |
| **Stops share one place** | About's spread contains all 4 roles. LogoLife and Tolstoy are 0.090 apart. Elinnov and the Crusader Yearbook are 0.058 apart, less than the median star gap. The two crawler stops share one star. PulseVR sits on Mercado's edge. | About, all Work, 2 crawler stops, PulseVR |
| **Big stretches no stop claims** | 46 of 93 stars are unclaimed (53 without the Work overview). The upper hemisphere (y > 0.1) holds 28 stars and only 3 are claimed, all About outliers (`t19`, `t19`, `t05`). No stop centroid lies above y = 0.05. The two cleanest lobes after FlowStack, Emergent Echoes (12) and NSP IMS (10), are no one's. Emergent Echoes is the biggest single topic in the sky, and About's copy mentions game dev. | Hero and "pull back" framing; the path never visits the top half |
| **NDA projects and confidential material** | Stars show no text, so a dive to `t18` or `t11` reveals nothing by itself. Three things still need care: (1) Labels. `t11`'s page title names the client product, which the display never names ("the admissions platform"). A label written against `t11` must not reuse it. (2) Claiming stars by mention instead of by topic key. 5 of 6 `t17` stars and `t35`, `t14`, `t28`, `t44` mention a confidential employer. A Work scene that lights "the stars about your work" by keyword, or counts them per role, would include them. (3) Placement: Athena's nearest star is the profile star, and the crawler sits at the sky's centre next to `t03` and `t36`. Neither reveals anything. | Athena, both crawlers, Work |
| **The layout is not stable** | Ticket 26: a republish reshuffles ids, topics and every position. The sky is a May snapshot, and pages written since May are missing. Stop → region claims must be computed from the chunk mapping at build time, never hard-coded as coordinates. | All |

## Method

1. **Inputs.**
   - `public/sky/stars-pca.json` and `public/sky/stars-umap.json`: 93 stars each, with the same ids and topics in both.
   - `lib/sky/chunk-stars.json`: star → chunk → page.
   - The topic legend in `.scratch/redesign/issues/26-export-the-sky.md`.
   - `lib/content/*.ts` for the stops.
   - `sky.js` for FOV 32° and the hero framing (`dist = 0.9 / (size · tan(FOV/2) · fit)`, with `size` 0.8).
2. **Stop assignment.** Page by page against the legend. The wiki checkout was used only to read page frontmatter and aliases: the crawler page aliases the dashboard, `t25` is the employer-of-record for the Tolstoy engagement, and `t01` is the Crusader Yearbook tools.
3. **Coverage checks.** Read-only `execute_sql` on `wiki_chunks` returned only 0/1 keyword flags per chunk, never the text:
   - one flag per stop name, including "counselor", "maintenance", "playwright/e2e" and "linkedin/mailto";
   - one flag per confidential employer's name.
   - Today's wiki `projects/` listing was checked for pages on the zero-star stops.
4. **Metrics.** Plain numpy, Euclidean distances in each layout's unit-sphere coordinates:
   - centroid;
   - spread (the mean distance to the centroid) and max radius;
   - distance to the nearest other stop's centroid;
   - whether each star's nearest neighbour belongs to the same stop;
   - the k stars nearest the centroid (k = n) and how many are the stop's own;
   - the best-frame test above;
   - single-link components (eps 0.12 and 0.15) and k-means (k = 4, 5, 6, best of 50 seeds) for the natural regions.
5. **Path.** Straight lines between centroids, starting and ending at the origin (the sky's centre, where the hero orbits). The optimum came from an exact search over all orders, and the random baseline from 20,000 shuffles.
6. **Caveats.**
   - PCA keeps the sky's global spread, not local neighbourhoods. Two stars close in PCA can be far apart in the full 1536-d embedding, which is why UMAP separates the small groups better.
   - Mention flags are keyword matches and are noisy (for example, "linkedin" matches citations). They were used only to find where a stop's material lives, never to count stars.
   - The scripts ran from a temp directory and are not in the repo.
