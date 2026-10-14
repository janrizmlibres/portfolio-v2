/**
 * The pipeline's report: four bars on the deck under Save (Found, Merged, Enriched, Saved), named on leader lines, their
 * heights a pattern with no figures. Each is a telescoping mast (pipeline.py's `bar0`..`bar4`): its base stands on the
 * deck, and as the bars rise each section slides out of the one below it, so the top section's top is the bar's height.
 * A light round its top shows the colour of the stage it counts (Found the search's, Merged the dedups', Enriched
 * Enrich's, Saved Save's), coming on as it rises. As the climax's front lands, a hairline outline at the Enriched bar
 * shows Found's height: what enriching would have cost without the two dedup layers.
 */
import {
  BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, Object3D, Vector3, type Color, type Mesh, type MeshStandardMaterial,
} from "three";
import { PIPELINE } from "@/lib/content/voyage";
import { BARS } from "./climax";
import { neutralOut, raw } from "./lit";
import { occludeDirect } from "./ships";
import type { Shade } from "./swarm";

/** in the deck's own units (the ring's outer radius 1): where the bars stand round it, how wide and tall they are */
const BAR_ARC = [-0.42, -0.14, 0.14, 0.42], BAR_R = 1.5, BAR_W = 0.2, BAR_H = 1.3, DECK_Y = -0.035;
/** a bar's sections and each one's height (pipeline.py's NB and BL): collapsed, a bar is one section tall */
const NB = 5, BL = 0.3;
/** the stage each bar counts, whose colour its light shows */
const STAGE_OF = ["crawl", "dedup1", "enrich", "save"];

export function createReport(c: { deck: Object3D; shade: Shade; owned: Array<{ dispose(): void }> }) {
  const { deck, shade } = c;
  // each bar's place on the deck, turned so its sections face out from the ring (as authored, +x)
  const bars = BAR_ARC.map((a) => {
    const g = new Object3D();
    g.position.set(BAR_R * Math.cos(a), DECK_Y, -BAR_R * Math.sin(a));
    g.rotation.y = a;
    deck.add(g);
    return g;
  });
  const sections: Object3D[][] = bars.map(() => []);
  const mats: MeshStandardMaterial[] = [];
  const glow = bars.map(() => ({ value: 0 }));
  const hue = STAGE_OF.map((id) => { const h = raw(PIPELINE.find((p) => p.id === id)!.hue); return new Vector3(h.r, h.g, h.b); });

  /** dresses a section of bar `j` as loaded: lit by the rings and the front, its light in its stage's colour */
  function dress(o: Object3D, j: number) {
    o.traverse((x) => {
      const m = x as Mesh;
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      c.owned.push(m.geometry);
      const list = (Array.isArray(m.material) ? m.material : [m.material]) as MeshStandardMaterial[];
      const out = list.map((s) => {
        const kind = s.name.replace(/\.\d+$/, "");
        for (const t of [s.map, s.aoMap, s.normalMap, s.roughnessMap, s.metalnessMap]) if (t) c.owned.push(t);
        const light = kind === "barlight";
        const mm = shade.zoned(shade.ringLit(occludeDirect(neutralOut(shade.finish(s.clone()))), `bar-${kind}`, light ? (sh) => {
          Object.assign(sh.uniforms, { uBarHue: { value: hue[j] }, uBarGlow: glow[j] });
          sh.fragmentShader = sh.fragmentShader
            .replace("void main() {", "uniform vec3 uBarHue; uniform float uBarGlow;\nvoid main() {")
            .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uBarHue * uBarGlow;");
        } : undefined));
        mats.push(mm);
        return mm;
      });
      m.material = Array.isArray(m.material) ? out : out[0]!;
    });
  }

  // the hairline: the outline of a bar as wide and deep as the base, Found's height, at the Enriched bar
  const cutGeo = new EdgesGeometry(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  const cutMat = new LineBasicMaterial({ color: raw("#c9d2ee") as Color, transparent: true, opacity: 0, depthWrite: false });
  c.owned.push(cutGeo, cutMat);
  const cutLine = new LineSegments(cutGeo, cutMat);
  cutLine.position.copy(bars[2]!.position);
  cutLine.rotation.y = BAR_ARC[2]!;
  cutLine.scale.set(0.1 * 1.1, BAR_H * BARS[0]!.h, BAR_W * 1.04);
  cutLine.visible = false;
  deck.add(cutLine);

  /** a bar's height risen to `rise` (0..1), never below its base */
  const heightOf = (j: number, rise: number) => Math.max(BL, BARS[j]!.h * BAR_H * rise);

  return {
    /** each bar's place on the deck (its sections under it, once loaded) */
    bars,
    /** every material its bars wear, for the host's fade */
    mats,
    /** takes the bars' sections from the loaded model (`bar0`, the base, .. `bar4`, the top) */
    fit(scene: Object3D) {
      for (let i = 0; i < NB; i++) {
        const src = scene.getObjectByName(`bar${i}`);
        if (!src) continue;
        bars.forEach((g, j) => {
          // (its node keeps its own transform, the compressor's offset and scale, under where the section slides to)
          const o = src.clone(), at = new Object3D();
          at.add(o);
          g.add(at);
          sections[j]![i] = at;
          dress(o, j);
        });
      }
    },
    /** the bars risen to `bars` (0..1) and the hairline shown by `cut`, in a shaft shown by `v` */
    update(o: { bars: number; cut: number; v: number }) {
      bars.forEach((_, j) => {
        const out = heightOf(j, o.bars) - BL;
        sections[j]!.forEach((s, i) => { s.position.y = (out * i) / (NB - 1); });
        glow[j]!.value = 2.2 * Math.min(1, o.bars * 1.5);
      });
      cutMat.opacity = o.cut * 0.85 * o.v;
      cutLine.visible = o.cut > 0.01;
    },
    /**
     * the top of bar `i` (world) with the bars risen to `rise`, or with `cut` the top of the hairline of what enriching
     * would have cost
     */
    barTop(i: number, cut: boolean, rise: number) {
      const b = cut ? cutLine : bars[i];
      if (!b) return null;
      const h = cut ? BARS[0]!.h * BAR_H : heightOf(i, rise);
      return deck.localToWorld(new Vector3(b.position.x, DECK_Y + h, b.position.z));
    },
  };
}
