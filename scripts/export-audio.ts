// Exports the score's stems for the site.
//
//   pnpm audio:export --score <module.js>   renders a score written as code (scripts/audio/standin-score.js is the
//                                           old stand-in's)
//   pnpm audio:export --wavs <dir>          takes stems exported from a music tool: <stem>.wav each, one loop long
//   pnpm audio:export --shots <dir>         takes one-shots (scene changes, the wake's relay): <name>.wav each,
//                                           written to public/audio/fx/ and lib/audio/shots.json, each cut where it
//                                           falls silent
//   ... --add                               adds (or redoes) just those one-shots, keeping the manifest's others and
//                                           their files, so one can be added without rendering every other again
//   pnpm audio:export --render score|shots  renders the site's own score or one-shots first, from the scripts in
//                                           scripts/audio/render/ (Python with Surge XT; `python fetch.py` there
//                                           fetches their sources once, sources.json lists them with their licences;
//                                           $AUDIO_PYTHON picks the interpreter, python3 by default)
//   ... --take <name>                       writes a take being weighed instead (public/audio/takes/<name>/,
//                                           lib/audio/takes/<name>.json), leaving the site's own score alone
//
// A score written as code renders in headless Chromium through an OfflineAudioContext (see standin-score.js for
// what such a module exports). Every stem is checked: the pulsed ones all the loop's length (an unpulsed one, named
// in the mix's OWN_LENGTH, loops at its own), and each wrapping without a click.
// Each is then encoded four ways: Opus/WebM at 64 kbit/s stereo and 32 kbit/s mono (constrained VBR, since plain
// VBR overshoots its target), and MP3 at 128k stereo and 64k mono (LAME, with its gapless header). Writes:
//   public/audio/<stem>[.mono].<hash>.(webm|mp3)   named by content, so they're cached for a year
//   lib/audio/stems.json                           the manifest the page loads them by
//   scripts/audio/fingerprints.json                each stem's audio in outline, for the next export
// and removes the files the new manifest no longer names. A stem whose audio hasn't changed audibly since the last
// export keeps its files and names, so a re-export doesn't throw the visitors' cache away.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import { shotChannels } from "@/lib/audio/memory";
import { HERO_LAYERS, OWN_LENGTH } from "@/lib/audio/mix";
import { checkLoop, fingerprint, hashedName, loopFrames, mergeShots, sameAudio, stale, trimTail } from "./audio/stems";

const SR = 48000;

const { values: args } = parseArgs({
  options: {
    score: { type: "string" },
    wavs: { type: "string" },
    take: { type: "string" },
    shots: { type: "string" },
    add: { type: "boolean" },
    render: { type: "string" },
  },
});
// one source must be named, so a bare run can't overwrite the score with something else
if ([args.score, args.wavs, args.shots, args.render].filter(Boolean).length !== 1)
  throw new Error("Name one source: --render score|shots, --wavs <dir>, --shots <dir> or --score <module.js>.");
if (args.render && !["score", "shots"].includes(args.render)) throw new Error("--render takes score or shots.");
if (args.take && !/^[a-z0-9]+$/.test(args.take)) throw new Error("--take is a short lowercase name, like a1.");
if (args.add && !args.shots) throw new Error("--add goes with --shots <dir>.");

const OUT = resolve(args.take ? `public/audio/takes/${args.take}` : "public/audio");
const MANIFEST = resolve(args.take ? `lib/audio/takes/${args.take}.json` : "lib/audio/stems.json");
/** each stem's fingerprint, for the next export to compare against; kept out of the manifest the page loads */
const PRINTS = resolve(args.take ? `scripts/audio/takes/${args.take}.prints.json` : "scripts/audio/fingerprints.json");

type Stem = { name: string; channels: [Float32Array, Float32Array] };

/** Renders a score written as code, one stem at a time, in headless Chromium. */
async function renderScore(module: string): Promise<Stem[]> {
  const dir = dirname(resolve(module)), file = basename(module);
  const server = createServer((req, res) => {
    const path = new URL(req.url!, "http://x").pathname;
    if (path === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(`<!doctype html><script type="module">import * as s from "./${file}"; window.score = s; window.ready = true;</script>`);
    }
    const full = join(dir, decodeURIComponent(path));
    if (!full.startsWith(dir) || !existsSync(full)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": extname(full) === ".js" ? "text/javascript" : "application/octet-stream" });
    createReadStream(full).pipe(res);
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const port = (server.address() as { port: number }).port;
  const browser = await chromium.launch({ headless: true, args: ["--mute-audio"] });
  try {
    const page = await browser.newPage();
    page.on("console", (m) => m.type() === "error" && console.error("page:", m.text()));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);
    const layers = await page.evaluate(() => (window as unknown as { score: { LAYERS: string[] } }).score.LAYERS);
    const stems: Stem[] = [];
    for (const name of layers) {
      const t = Date.now();
      const b64 = await page.evaluate(
        async ([name, sr]) => {
          const score = (window as unknown as { score: { renderStem: (n: string, sr: number) => Promise<Float32Array[]> } }).score;
          const [l, r] = await score.renderStem(name as string, sr as number);
          const inter = new Float32Array(l!.length * 2);
          for (let i = 0; i < l!.length; i++) {
            inter[2 * i] = l![i]!;
            inter[2 * i + 1] = r![i]!;
          }
          const bytes = new Uint8Array(inter.buffer);
          let s = "";
          for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(s);
        },
        [name, SR] as const,
      );
      stems.push({ name, channels: deinterleave(new Float32Array(new Uint8Array(Buffer.from(b64, "base64")).buffer)) });
      console.log(`rendered ${name} in ${Date.now() - t} ms`);
    }
    return stems;
  } finally {
    await browser.close();
    server.close();
  }
}

/** Reads stems exported from a music tool, resampled to 48 kHz stereo floats. Stem names are lowercased; one-shots
 * keep their case, since the page plays them by name (`emote-allGood`). */
function readWavs(dir: string, keepCase = false): Stem[] {
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort()
    .map((f) => {
      const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", join(dir, f), "-f", "f32le", "-ac", "2", "-ar", String(SR), "-"], { maxBuffer: 1 << 30 });
      const floats = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
      const name = basename(f, extname(f));
      return { name: keepCase ? name : name.toLowerCase(), channels: deinterleave(floats) };
    });
}

function deinterleave(x: Float32Array): [Float32Array, Float32Array] {
  const n = x.length / 2, l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    l[i] = x[2 * i]!;
    r[i] = x[2 * i + 1]!;
  }
  return [l, r];
}

function wavFloat([l, r]: [Float32Array, Float32Array]) {
  const inter = new Float32Array(l.length * 2);
  for (let i = 0; i < l.length; i++) {
    inter[2 * i] = l[i]!;
    inter[2 * i + 1] = r[i]!;
  }
  const data = Buffer.from(inter.buffer);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); // IEEE float
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28);
  h.writeUInt16LE(8, 32);
  h.writeUInt16LE(32, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const ENCODES = [
  { fmt: "webm", ch: "stereo", args: ["-c:a", "libopus", "-b:a", "64k", "-vbr", "constrained", "-f", "webm"] },
  { fmt: "webm", ch: "mono", args: ["-ac", "1", "-c:a", "libopus", "-b:a", "32k", "-vbr", "constrained", "-f", "webm"] },
  { fmt: "mp3", ch: "stereo", args: ["-c:a", "libmp3lame", "-b:a", "128k", "-f", "mp3"] },
  { fmt: "mp3", ch: "mono", args: ["-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", "-f", "mp3"] },
] as const;

const dB = (v: number) => +(20 * Math.log10(v || 1e-9)).toFixed(1);

/**
 * Encodes the one-shots: no loop to check, the same four encodings, content-hashed names, their own manifest. With
 * `add`, only these are added or redone; the manifest's others, and their files, are kept.
 */
function exportShots(dir: string, add = false) {
  const out = resolve("public/audio/fx"), manifest = resolve("lib/audio/shots.json");
  mkdirSync(out, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "audio-shots-"));
  const shots: Record<string, { seconds: number; files: Record<string, Record<string, { file: string; bytes: number }>> }> = {};
  const keep: string[] = [];
  try {
    for (const raw of readWavs(dir, true)) {
      // a rendered tail of near-silence would be held decoded for nothing
      const s = { ...raw, channels: trimTail(raw.channels, SR) as [Float32Array, Float32Array] };
      const wav = join(tmp, `${s.name}.wav`);
      writeFileSync(wav, wavFloat(s.channels));
      const files: Record<string, Record<string, { file: string; bytes: number }>> = { webm: {}, mp3: {} };
      for (const e of ENCODES) {
        const enc = join(tmp, `${s.name}.${e.ch}.${e.fmt}`);
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", ...e.args, enc]);
        const bytes = readFileSync(enc);
        const file = hashedName(s.name, e.ch, e.fmt, bytes);
        writeFileSync(join(out, file), bytes);
        files[e.fmt]![e.ch] = { file, bytes: bytes.length };
        keep.push(file);
      }
      shots[s.name] = { seconds: +(s.channels[0].length / SR).toFixed(2), files };
      console.log(`${s.name.padEnd(9)} ${shots[s.name]!.seconds} s  Opus ${Math.round(files.webm!.stereo!.bytes / 1024)} KB`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const merged = add ? mergeShots(JSON.parse(readFileSync(manifest, "utf8")) as typeof shots, shots) : { shots, keep };
  for (const f of stale(readdirSync(out), merged.keep)) rmSync(join(out, f));
  writeFileSync(manifest, `${JSON.stringify(merged.shots, null, 2)}\n`);
  const final = merged.shots;
  const all = Object.values(final).reduce((a, s) => a + s.seconds, 0);
  const desk = Object.entries(final).reduce((a, [n, s]) => a + s.seconds * (shotChannels(n, false) === "stereo" ? 2 : 1), 0);
  console.log(`${Object.keys(final).length} shots, ${all.toFixed(1)} s; all decoded at once ${(desk * SR * 4 / 1048576).toFixed(1)} MB on a desktop, ${(all * SR * 4 / 1048576).toFixed(1)} MB on a phone`);
}

/** Renders the site's own score or one-shots with the Python renderer into a temporary folder, returning it. */
function renderWithPython(what: "score" | "shots") {
  const dir = mkdtempSync(join(tmpdir(), `audio-render-${what}-`));
  execFileSync(process.env.AUDIO_PYTHON ?? "python3", [resolve(`scripts/audio/render/${what}.py`), dir], { stdio: "inherit", cwd: resolve("scripts/audio/render") });
  return dir;
}

async function main() {
  const rendered = args.render ? renderWithPython(args.render as "score" | "shots") : null;
  try {
    if (args.shots || args.render === "shots") return exportShots(args.shots ?? rendered!, !!args.add);
    return await exportStems(args.wavs ?? rendered ?? undefined);
  } finally {
    if (rendered) rmSync(rendered, { recursive: true, force: true });
  }
}

async function exportStems(wavs: string | undefined) {
  const stems = wavs ? readWavs(wavs) : await renderScore(args.score!);
  if (!stems.length) throw new Error("No stems found.");
  const { loop: frames, frames: lengths } = loopFrames(stems, OWN_LENGTH);

  let bad = false;
  const checked = stems.map((s) => {
    const r = checkLoop(s.channels, lengths[s.name]!);
    if (!r.ok) {
      bad = true;
      console.error(`${s.name}: ${r.why}`);
    }
    let peak = 0, sum = 0;
    for (const c of s.channels) for (const x of c) {
      peak = Math.max(peak, Math.abs(x));
      sum += x * x;
    }
    return { ...s, seam: r.seam, peakDb: dB(peak), rmsDb: dB(Math.sqrt(sum / (2 * lengths[s.name]!))) };
  });
  if (bad) throw new Error("Some stems don't loop cleanly; nothing was written.");

  mkdirSync(OUT, { recursive: true });
  mkdirSync(dirname(MANIFEST), { recursive: true });
  mkdirSync(dirname(PRINTS), { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "audio-export-"));
  const manifest = { loop: frames / SR, sampleRate: SR, frames, stems: {} as Record<string, unknown> };
  const keep: string[] = [];
  type Entry = { files: Record<string, Record<string, { file: string; bytes: number }>> };
  const before = (existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { stems: {} }) as { frames?: number; stems: Record<string, Entry> };
  const printsBefore = (existsSync(PRINTS) ? JSON.parse(readFileSync(PRINTS, "utf8")) : {}) as Record<string, number[]>;
  const prints: Record<string, number[]> = {};
  try {
    for (const s of checked) {
      const print = (prints[s.name] = fingerprint(s.channels));
      const was = before.frames === frames ? before.stems[s.name] : undefined;
      const files0 = was && Object.values(was.files).flatMap((f) => Object.values(f).map((x) => x.file));
      if (was && files0 && sameAudio(printsBefore[s.name], print) && files0.every((f) => existsSync(join(OUT, f)))) {
        manifest.stems[s.name] = { seconds: lengths[s.name]! / SR, peakDb: s.peakDb, rmsDb: s.rmsDb, seam: +s.seam.toFixed(2), files: was.files };
        keep.push(...files0);
        console.log(`${s.name.padEnd(9)} unchanged, kept its files`);
        continue;
      }
      const wav = join(tmp, `${s.name}.wav`);
      writeFileSync(wav, wavFloat(s.channels));
      const files: Record<string, Record<string, { file: string; bytes: number }>> = { webm: {}, mp3: {} };
      for (const e of ENCODES) {
        const enc = join(tmp, `${s.name}.${e.ch}.${e.fmt}`);
        // bit-exact, so the same audio always makes the same file (WebM otherwise writes a random segment id)
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", ...e.args, enc]);
        const bytes = readFileSync(enc);
        const file = hashedName(s.name, e.ch, e.fmt, bytes);
        writeFileSync(join(OUT, file), bytes);
        files[e.fmt]![e.ch] = { file, bytes: bytes.length };
        keep.push(file);
      }
      manifest.stems[s.name] = { seconds: lengths[s.name]! / SR, peakDb: s.peakDb, rmsDb: s.rmsDb, seam: +s.seam.toFixed(2), files };
      console.log(`${s.name.padEnd(9)} peak ${s.peakDb} dBFS  rms ${s.rmsDb} dBFS  seam ${s.seam.toFixed(2)}× an average step`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  for (const f of stale(readdirSync(OUT), keep)) rmSync(join(OUT, f));
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(PRINTS, `${JSON.stringify(prints)}\n`);

  const total = (fmt: string, ch: string, only?: string[]) =>
    Object.entries(manifest.stems as Record<string, { files: Record<string, Record<string, { bytes: number }>> }>)
      .filter(([n]) => !only || only.includes(n))
      .reduce((a, [, s]) => a + s.files[fmt]![ch]!.bytes, 0);
  const kb = (b: number) => `${Math.round(b / 1024)} KB`;
  console.log(`\n${checked.length} stems, ${manifest.loop} s loop`);
  console.log(`all: Opus ${kb(total("webm", "stereo"))} stereo / ${kb(total("webm", "mono"))} mono; MP3 ${kb(total("mp3", "stereo"))} / ${kb(total("mp3", "mono"))}`);
  console.log(`the hero's (${HERO_LAYERS.join(", ")}), loaded under the charge: Opus ${kb(total("webm", "stereo", HERO_LAYERS))} stereo / ${kb(total("webm", "mono", HERO_LAYERS))} mono`);
  const all = checked.reduce((a, s) => a + lengths[s.name]!, 0);
  console.log(`decoded: ${(all * 2 * 4 / 1048576).toFixed(1)} MB stereo, ${(all * 4 / 1048576).toFixed(1)} MB mono`);
  console.log(`wrote ${OUT}, ${MANIFEST} and ${PRINTS}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
