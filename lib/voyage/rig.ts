/**
 * The film's lights, held steady. Each body (Athena, the crawler, the ribbon) brings its star's key light, and hides
 * its whole root once it's out of its scene. A hidden root used to take its light with it, so the number of lights
 * changed as bodies came and went, and three recompiled every lit material in view on the spot (the pull-out to
 * Contact lost 100–170 ms frames twice that way, the first time through). The rig moves the lights onto one node that
 * is never hidden, where they stay where they were in the world: a light out of its scene is dark (its body sets its
 * intensity to 0), not gone, so every program is compiled once, with every light, before anything is seen.
 * A dark light's shadow isn't redrawn (`cull`, once a frame before the frame is drawn), nor is one whose body says
 * its shadow needn't be drawn this frame (`light.userData.shadowOff`, e.g. while it's out of frame); the rig owns
 * `shadow.autoUpdate` for the lights it holds, so a body sets that flag instead.
 */
import { Object3D, type DirectionalLight, type Light } from "three";

type Shadowed = Light & { shadow?: DirectionalLight["shadow"] };

export function createLightRig(parent: Object3D, bodies: Object3D[]) {
  const node = new Object3D();
  node.name = "light-rig";
  parent.add(node);
  const held: Array<{ light: Shadowed; home: Object3D }> = [];
  for (const b of bodies) {
    const found: Shadowed[] = [];
    b.traverse((o) => { if ((o as Light).isLight) found.push(o as Shadowed); });
    for (const light of found) {
      held.push({ light, home: light.parent! });
      node.attach(light);
    }
  }
  return {
    cull() {
      for (const { light } of held) if (light.shadow && light.castShadow) light.shadow.autoUpdate = light.intensity > 0 && !light.userData.shadowOff;
    },
    dispose() {
      for (const { light, home } of held) { home.attach(light); if (light.shadow) light.shadow.autoUpdate = true; }
      node.removeFromParent();
    },
  };
}

/**
 * A key's shadow map at a new size: the old map goes, and the new one is drawn on the next frame even if the key is
 * dark or culled then. A key left without a map isn't harmless: three stands in for it with a depth texture a shadow
 * sampler refuses, and every lit material samples every key's map, so each draw fails (GL_INVALID_OPERATION) and the
 * bodies vanish.
 */
export function resizeShadow(light: DirectionalLight, side: number) {
  if (light.shadow.mapSize.x === side) return;
  light.shadow.mapSize.set(side, side);
  light.shadow.map?.dispose();
  light.shadow.map = null;
  light.shadow.needsUpdate = true;
}
