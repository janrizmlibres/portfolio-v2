# Export the sky

Type: task
Labels: wayfinder:task
Status: resolved
Blocked by: 12

## Question

AFK, and HITL only if the database credentials have to be reissued. Produce the **star data** for the sky (*Pick the creative concept*): one star per wiki chunk, placed by its embedding, holding positions and meaningless ids only.

1. **Restore database access.** Every local `search_wiki` call failed on 2026-09-28 because the Supabase transaction pooler rejected the user with "tenant/user not found" (*Warp or scroll*'s latency run). Find out why. Known causes of that error include a paused project and a pooler user name without the project reference. If the fix needs the Supabase dashboard, hand Janriz a precise checklist. *Pick the destination router* also needs working retrieval.
2. **Read** `id`, `source_path` and `embedding` for every row, read-only. Record the real row count. The estimate is 120–200, and the last recorded count was 86 on 2026-05-01.
3. **Leave out the confidential pages.** Drop every chunk whose source page is about an employer the system prompt keeps confidential (`lib/ai/system-prompt.ts`), including their project pages. Test-first: the exclusion rule is logic, so it gets Red → Green → Refactor with a named verdict.
4. **Project to 3D.** Produce two layouts, a PCA one and a seeded UMAP one, so *Prototype the visual language* can judge which reads as a shape from outside. Both must be deterministic.
5. **Write the star data.** Each star gets an opaque id, x, y, z and an opaque topic key. Nothing names a page, a slug or an employer, so the star data can ship in the bundle and live in the public repo. The chunk-id → star-id mapping the chat route will need is kept apart from the star data. The same rule applies to it: nothing that names a confidential employer lands in the public repo or the bundle.

The hand-written topic labels ("Athena", "Game dev") are content for the build, not this ticket. List the topic keys found, so labels can be written against them.

Resolved when the star data exists in both layouts. The answer records the row count, how many chunks were excluded and why, where the files live, and how to re-run the export if chunks are ever published again.

## Answer

Resolved on 2026-09-29. The star data exists in both layouts: 93 stars, 44 topics.

**Database access.**
- The Supabase project had been **paused**, which Supabase does to free projects after 7 days of low activity.
  - A paused project drops out of DNS, so the pooler answered "tenant/user not found".
  - It is running again as of 2026-09-29, with its data intact. A deleted project couldn't have come back.
  - Nothing was wrong with `SUPABASE_DB_URL`.
- Production's `search_wiki` had been returning `[]` for the same reason. It works again now, and local runs of *Pick the destination router*'s eval can use real retrieval.
- It will pause again after another quiet week unless something keeps it active or the plan changes. That is the chat backend's concern, which is out of this map's scope.
- A Supabase MCP server is now configured in `.mcp.json`, untracked. It is scoped to the project, so it can run SQL but can't restore the project.

**Rows.**
- `wiki_chunks` holds **95 chunks** from **46 pages**, all embedded with `text-embedding-3-small`.
- They were last published on 2026-05-09. The 120–200 estimate counted today's 64 pages, but the publisher was removed before the pages written since May were published.
- So the sky is a May snapshot, and so is what the agent knows. It has none of the pages written since then (GetAIPP, Naiad, Claude Code tooling and the like).

**Excluded: 2 chunks,** the two confidential employers' own org pages (1 chunk each).
- Their project and concept pages were written after May, so they were never published.
- The rule would drop them if they were: applied to today's wiki, it drops those 6 pages as well.
- Cross-check against the published text: the other chunks that name either employer belong to the early-career, profile, work-hub, LogoLife and Cebu pages. They mention the employers in passing, and none is a project or concept page about them. Stars never show text, so they stay.

**Files** (uncommitted on `main`):
- `public/sky/stars-pca.json` and `public/sky/stars-umap.json`, about 6 KB each.
  - Each is `{ version, layout, stars: [{ id, x, y, z, topic }] }`, with ids `s001`–`s093` and topics `t01`–`t44`, both assigned in a seeded shuffle.
  - Positions sit in the unit sphere. The median radius is 0.51 (PCA) and 0.59 (UMAP).
  - No path, slug, title or employer name appears.
- `lib/sky/chunk-stars.json`: chunk id → star id, 93 entries, for the chat route only. It names public pages' paths, never a confidential employer's; the export refuses to write it otherwise.
- The code lives in `scripts/export-sky.ts` and `scripts/sky/`, with 18 tests. The comment above records the Red → Green → Refactor verdicts.

**Re-running** (after chunks are published again):
- Run `pnpm sky:export`. It needs:
  - `SUPABASE_DB_URL` in `.env`, read in a read-only transaction;
  - the wiki checkout at `../llm-wiki`, or `--wiki <dir>`;
  - or `--rows file.json` instead of the database.
- It writes the three files, and prints the counts, the exclusions and this legend.
- Output is byte-identical for the same rows, and every run is deterministic: `SEED` in `scripts/export-sky.ts`, `umap-js` and `ml-pca` pinned exactly, code-point sorting.
- A republish changes the ids, the topics and every position. The mapping and any written topic labels must then be regenerated together.

**Topic legend** (local only, because it names pages; write labels against the keys, and several keys can share a label):

  | Key | Page | Stars |
  |---|---|---|
  | `t01` | `wiki/projects/cyb-tools.md` | 1 |
  | `t02` | `wiki/projects/store-it.md` | 1 |
  | `t03` | `wiki/projects/cs50-web.md` | 1 |
  | `t04` | `wiki/projects/pong-re.md` | 1 |
  | `t05` | `wiki/orgs/xavier-university.md` | 1 |
  | `t06` | `wiki/hubs/relationships.md` | 1 |
  | `t07` | `wiki/projects/bomberman-clone.md` | 1 |
  | `t08` | `wiki/works/emergent-echoes-paper.md` | 1 |
  | `t09` | `wiki/orgs/xu-night-school-program.md` | 1 |
  | `t10` | `wiki/hubs/beliefs.md` | 1 |
  | `t11` | `wiki/projects/acceptedx-crawler.md` | 1 |
  | `t12` | `wiki/orgs/tolstoy.md` | 1 |
  | `t13` | `wiki/bio/high-school.md` | 1 |
  | `t14` | `wiki/me.md` | 1 |
  | `t15` | `wiki/projects/roach-island.md` | 1 |
  | `t16` | `wiki/projects/flowstack-platform.md` | 9 |
  | `t17` | `wiki/bio/early-career.md` | 6 |
  | `t18` | `wiki/projects/athena.md` | 1 |
  | `t19` | `wiki/bio/university.md` | 6 |
  | `t20` | `wiki/bio/childhood.md` | 1 |
  | `t21` | `wiki/orgs/elinnov-technologies.md` | 1 |
  | `t22` | `wiki/works/certifications.md` | 9 |
  | `t23` | `wiki/projects/nsp-ims-app.md` | 9 |
  | `t24` | `wiki/orgs/the-crusader-yearbook.md` | 1 |
  | `t25` | `wiki/orgs/xfusion.md` | 1 |
  | `t26` | `wiki/projects/knights-tour.md` | 1 |
  | `t27` | `wiki/projects/mercado.md` | 6 |
  | `t28` | `wiki/places/cebu.md` | 1 |
  | `t29` | `wiki/projects/max-clique.md` | 1 |
  | `t30` | `wiki/hubs/interests.md` | 1 |
  | `t31` | `wiki/projects/pulsevr.md` | 1 |
  | `t32` | `wiki/orgs/xcel.md` | 1 |
  | `t33` | `wiki/projects/dev-portfolio.md` | 1 |
  | `t34` | `wiki/people/clint-galendez.md` | 1 |
  | `t35` | `wiki/hubs/work.md` | 1 |
  | `t36` | `wiki/projects/readability-web-app.md` | 1 |
  | `t37` | `wiki/events/sudocodecamp-2022.md` | 1 |
  | `t38` | `wiki/people/jun-rangie-obispo.md` | 1 |
  | `t39` | `wiki/orgs/gusa-regional-science-high-school.md` | 1 |
  | `t40` | `wiki/places/cagayan-de-oro.md` | 1 |
  | `t41` | `wiki/orgs/cssc.md` | 1 |
  | `t42` | `wiki/orgs/gdsc-xu.md` | 1 |
  | `t43` | `wiki/projects/emergent-echoes.md` | 11 |
  | `t44` | `wiki/orgs/logolife.md` | 1 |

## Comments

- 2026-09-28 — Claimed. Steps 3–5 are built and tested ahead of the data. Step 1 has turned HITL: only the Supabase dashboard can fix it.
  - **Diagnosis.**
    - The connection string isn't at fault: postgres-js parses the user (`postgres.<ref>`), pooler host, port 6543 and database correctly, and the pooler answers.
    - The project itself is gone from DNS. `<ref>.supabase.co` and `db.<ref>.supabase.co` both return NXDOMAIN, the same answer a made-up ref gets. Supabase's troubleshooting guide says a paused project and a deleted one both look like this.
    - Free projects pause after 7 days of low activity. A paused one stays restorable from the dashboard for up to a year.
    - **Production is down too.** One question to `jrz-dev.vercel.app/api/chat` made three `search_wiki` calls, and all three returned `[]`. The live agent has been answering from the page context alone.
  - **Checklist for Janriz:**
    1. In the Supabase dashboard, find the project whose ref is in `SUPABASE_DB_URL` (region ap-northeast-1).
    2. If it's **Paused**, restore it and wait for Healthy.
    3. Under Connect → Transaction pooler, check that the host and user still match `.env` and Vercel's `SUPABASE_DB_URL`.
    4. If the project is missing (deleted), stop. The chunks are gone, and this ticket needs a new plan: republishing is the chat backend, which is out of scope.
    5. Whether to stop it pausing again (Pro, or keep-alive traffic) is a chat-backend call, out of this map's scope.
  - **Built, uncommitted on `main`:**
    - `scripts/sky/confidential.ts`, the exclusion rule. A page is left out when it is a confidential employer's own page (title or alias match), or a project or concept page whose opening paragraph links to one. Pages missing from the wiki are dropped too. It reads the names from `CONFIDENTIAL_EMPLOYERS`, now exported from `lib/ai/system-prompt.ts`; the prompt text is byte-identical (sha256 checked).
    - `scripts/sky/project.ts`: PCA through SVD, and UMAP seeded with mulberry32, both normalised to the unit sphere with axis signs fixed. `umap-js` 1.4.0 and `ml-pca` 4.1.1 are dev dependencies, pinned exactly.
    - `scripts/sky/build.ts`: seeded-shuffle ids (`s001…`) and topic keys (`t01…`, one per source page), plus a check that throws if the mapping would name a confidential employer.
    - `scripts/export-sky.ts`, run as `pnpm sky:export`: reads the database in a read-only transaction (or `--rows file.json`) and the wiki at `--wiki ../llm-wiki`.
      - Writes `public/sky/stars-{pca,umap}.json` (ships) and `lib/sky/chunk-stars.json` (server only).
      - Prints the counts, the excluded pages and the topic legend. The legend names pages, so it goes into the Answer, never the repo.
    - Tests: 18 new vitest tests, each written Red first.
      - Refactor verdicts, rule: regex for the opening paragraph, refactored; YAML library and typed reasons, kept.
      - Projection: axis means computed once, refactored; cosine metric and fixed UMAP knobs, kept.
      - Builder: employer names come back from the rule instead of a second parse, refactored; `localeCompare` swapped for code-point order so ids can't shift between ICU builds.
    - A dry run on synthetic embeddings for the real wiki gave 162 stars, about 10 KB per layout, byte-identical across runs, with no confidential name in any output.
    - Applied to today's wiki, the rule drops 8 pages: both employers' own pages, their 5 project pages and 1 platform concept page. Bio, event, hub and profile pages that mention them stay.
  - **To finish once the database answers:**
    1. Run `pnpm sky:export`.
    2. Check the printed row count and exclusions.
    3. Write the Answer: row count, exclusions, file locations, the re-run command and the topic legend.
    4. Resolve the ticket and add the map line.
- 2026-09-29 — The project was running again. Through the Supabase MCP (project-scoped, read-only queries only), I counted the rows and checked the published text for mentions of the employers. `pnpm sky:export` then wrote the star data. A re-run produced identical files. Resolved.
- 2026-09-29 — Correction, found while building *Prototype the visual language*: production's `search_wiki` does **not** work yet.
  - The database answers, but `wiki_chunks_embedding_idx` is `ivfflat` with `lists=100` over 95 rows. At the default `ivfflat.probes = 1`, most questions search an empty list: 5 of 5 real questions got 0–1 rows back, and 6 each with every list probed.
  - It's a chat-backend fix, out of this map's scope, and it's reported to Janriz. Until then, *Pick the destination router*'s eval gets real retrieval only if it probes every list (as `prototypes/deep-field-sky/server.ts` does).
