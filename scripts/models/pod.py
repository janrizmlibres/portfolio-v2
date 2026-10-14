"""A work pod (Work's breakthroughs, home-build round 4): Janriz, 2026-10-11, agreed to five grounded sci-fi craft for
the breakthroughs that come by home while Work builds it (The Expanse / Interstellar, industrial, not glossy). This one
is a one-person construction pod in the spirit of Star Trek's work bees and 2001's EVA pods, grounded: a rounded hull in
the station's quilted blankets with a big dark window, two manipulator arms folded forward under it with simple claws,
a floodlight either side of the window, gold-foil equipment bays on its flanks, thruster clusters at its corners, and a
docking collar on its back. About 3 m long, at the station's scale (its ring has a radius of 1, a module's is 0.078), so
it docks at the hub's forward port as it is. Built from the station's own materials and helpers (station.py). Run
headless (`scripts/models/build.sh pod`).

Blender's +z is the pod's front (its window and arms, the way it flies), +y its top; its origin is its middle. Its
docking collar's face is at (0, 0, -0.054), facing -z. Its lights (floodlights, strobe, nav lights) are their own node,
"pod lights", unbaked (the site can switch or blink them).

CRAFT_MODE: "preview" (Cycles, two angles), "site" (bakes occlusion, writes out/pod.raw.glb). In a live Blender, run
with LIVE set: it builds in a scene of its own and leaves the rest of the file alone.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)) + "/"
exec(open(HERE + "shiplib.py").read())
V = Vector
TEX = HERE + "tex/"
OUT = HERE + "out/"
os.makedirs(OUT, exist_ok=True)
MODE = os.environ.get("CRAFT_MODE", "preview")
if globals().get("LIVE"):
    sc = bpy.data.scenes.get("pod") or bpy.data.scenes.new("pod")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("pod")
# the station's materials and geometry helpers (tube, slab, handrail, cbm, grapple, window)
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

def emitter(name, col, strength, base="#202020"):
    m = plain(name, base, 0.0, 0.4)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Emission Color"].default_value = srgb(col); b.inputs["Emission Strength"].default_value = strength
    return m

LIGHTS = coll("pod lights")
FLOOD = emitter("pod flood", "#ffe2b8", 12.0, base="#2a2216")
STROBE = emitter("pod strobe", "#ffffff", 10.0)
RED = emitter("pod nav red", "#ff3b2e", 8.0, base="#200000")
GREEN = emitter("pod nav green", "#3bff6a", 8.0, base="#002000")
X, Y, Z = V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))

# ---------------------------------------------------------------- the hull: a rounded box in blankets
W, H, D = 0.078, 0.07, 0.072        # across, high, deep
ZC = -0.004                         # its middle, along z
BEV = 0.023                         # rounded well in, so it reads as a pod, not a crate
hull = box(C, M["blanket"], (W, H, D), at=(0, 0, ZC), bevel=BEV, name="pod hull")
hull.modifiers["bevel"].segments = 6
hull.modifiers["bevel"].limit_method = "NONE"
cube_uv(hull, 0.09)
FRONT, BACK, TOP, BOTTOM = ZC + D / 2, ZC - D / 2, H / 2, -H / 2

# a seam round its waist, and one round its back
for z in (ZC - D * 0.12, BACK + 0.012):
    slab(M["alu plain"], (W + 0.0012, H - 2 * BEV, 0.0026), V((0, 0, z)), (X, Y, Z), 1, name="hull seam")
    slab(M["alu plain"], (W - 2 * BEV, H + 0.0012, 0.0026), V((0, 0, z)), (X, Y, Z), 1, name="hull seam")

# ---------------------------------------------------------------- the window: big, dark, framed, a mullion down it
WY = 0.009                          # its middle's height
slab(M["dark"], (0.056, 0.03, 0.004), V((0, WY, FRONT - 0.0005)), (X, Y, Z), 1, name="window frame", bevel=0.0012)
slab(M["glass"], (0.05, 0.024, 0.004), V((0, WY, FRONT + 0.001)), (X, Y, Z), 1, name="window")
for x in (-0.0085, 0.0085):
    slab(M["dark"], (0.0024, 0.024, 0.005), V((x, WY, FRONT + 0.0014)), (X, Y, Z), 1, name="window mullion")
# a hood over it, against glare
slab(M["grey"], (0.06, 0.003, 0.009), V((0, WY + 0.0165, FRONT + 0.003)), (X, Y, Z), 1, name="window hood", bevel=0.001)

# ---------------------------------------------------------------- floodlights on the roof's front edge, looking ahead
for s in (-1, 1):
    p = V((s * 0.019, TOP + 0.0045, FRONT - BEV - 0.004))
    slab(M["dark"], (0.004, 0.005, 0.006), p - Y * 0.004, (X, Y, Z), 1, name="flood bracket")
    slab(M["dark"], (0.014, 0.0065, 0.009), p, (X, Y, Z), 1, name="flood housing", bevel=0.001)
    link(slab(FLOOD, (0.0118, 0.0045, 0.0012), p + Z * 0.0045, (X, Y, Z), 1, name="flood lens"), LIGHTS)

# ---------------------------------------------------------------- the belly: the arms' mount, and the two arms
slab(M["alu"], (0.058, 0.014, 0.03), V((0, BOTTOM + 0.004, FRONT - 0.012)), (X, Y, Z), 1, name="arm mount", bevel=0.002)
def segment(a, b, r, name):
    """an arm's segment: a boxy beam from a to b, a hydraulic ram along its top"""
    a, b = V(a), V(b); d = (b - a).normalized(); side = X; up = d.cross(side).normalized()
    slab(M["alu plain"], (r * 2, r * 1.6, (b - a).length), (a + b) / 2, (side, up, d), 1, name=name, bevel=0.0008)
    rod(C, M["black"], a + up * r * 1.3 + d * 0.003, b + up * r * 1.3 - d * 0.004, r * 0.35, n=6, name="arm ram")

def joint(at, r):
    cyl(C, M["dark"], r, 0.009, at=at, rot=(0, math.pi / 2, 0), n=16, name="arm joint")

for s in (-1, 1):
    sh = V((s * 0.017, BOTTOM + 0.006, FRONT + 0.001))
    el = V((s * 0.018, BOTTOM - 0.003, FRONT + 0.016))
    wr = V((s * 0.015, BOTTOM + 0.011, FRONT + 0.021))
    joint(sh, 0.0042); joint(el, 0.0037); joint(wr, 0.003)
    segment(sh, el, 0.0026, "upper arm")
    segment(el, wr, 0.0023, "forearm")
    # the claw: a wrist block and two fingers, closed in a little
    slab(M["dark"], (0.0055, 0.005, 0.0055), wr + Z * 0.0032, (X, Y, Z), 1, name="wrist", bevel=0.0007)
    for f in (-1, 1):
        a = wr + Z * 0.0055 + Y * f * 0.002
        b = a + Z * 0.0062 - Y * f * 0.0008
        c = b + Z * 0.0032 - Y * f * 0.0018
        rod(C, M["alu plain"], a, b, 0.001, n=6, name="claw finger")
        rod(C, M["alu plain"], b, c, 0.0008, n=6, name="claw tip")

# ---------------------------------------------------------------- the flanks: gold-foil equipment bays, handholds
for s in (-1, 1):
    slab(M["gold"], (0.009, 0.036, 0.032), V((s * (W / 2 + 0.0035), -0.004, ZC - 0.012)), (X, Y, Z), 0.05, name="equipment bay", bevel=0.0018)
    slab(M["dark"], (0.0024, 0.03, 0.002), V((s * (W / 2 + 0.008), -0.004, ZC + 0.006)), (X, Y, Z), 1, name="bay strap")
    slab(M["dark"], (0.0024, 0.03, 0.002), V((s * (W / 2 + 0.008), -0.004, ZC - 0.03)), (X, Y, Z), 1, name="bay strap")
for s in (-1, 1):
    handrail(V((s * 0.027, TOP, ZC - 0.026)), V((s * 0.027, TOP, ZC + 0.006)), Y, lift=0.004)

# ---------------------------------------------------------------- thruster clusters at its four back corners
for sx in (-1, 1):
    for sy in (-1, 1):
        out = (X * sx + Y * sy).normalized()
        # the hull's surface where its rounded corner faces out at 45°, then the block's half out from it
        p = V((sx * (W / 2 - BEV * (1 - 0.7071)), sy * (H / 2 - BEV * (1 - 0.7071)), BACK + 0.014))
        q = p + out * 0.0038
        slab(M["dark"], (0.009, 0.009, 0.009), q, (X, Y, Z), 1, name="rcs block", bevel=0.0012)
        for e in (X * sx, Y * sy, Z, -Z):
            tube(M["black"], 0.0016, q + e * 0.0045, q + e * 0.0085, n=10, r2=0.0026, caps=False, name="rcs nozzle")

# ---------------------------------------------------------------- the docking collar on its back
tube(M["alu plain"], 0.022, V((0, 0, BACK + 0.002)), V((0, 0, BACK - 0.01)), n=40, name="collar")
tube(M["alu"], 0.0235, V((0, 0, BACK - 0.009)), V((0, 0, BACK - 0.0135)), n=40, name="collar ring")
for k in range(6):
    t = 2 * math.pi * k / 6 + math.pi / 6
    d = X * math.cos(t) + Y * math.sin(t)
    slab(M["dark"], (0.0045, 0.0045, 0.006), V((0, 0, BACK - 0.011)) + d * 0.0255, (d, d.cross(Z), Z), 1, name="latch")
tube(M["dark"], 0.017, V((0, 0, BACK - 0.0135)), V((0, 0, BACK - 0.0143)), n=32, name="collar hatch")
# a radiator fin and an antenna on the roof
slab(M["radiator"], (0.002, 0.016, 0.026), V((0, TOP + 0.009, BACK + 0.016)), (X, Y, Z), 0.04, name="radiator fin")
rod(C, M["alu plain"], V((-0.012, TOP - 0.002, BACK + 0.008)), V((-0.012, TOP + 0.018, BACK + 0.008)), 0.0009, n=5, name="antenna")

# ---------------------------------------------------------------- its lights: a strobe on its roof, nav lights on its bays
sphere(LIGHTS, STROBE, 0.0022, at=(0.012, TOP + 0.0035, BACK + 0.008), n=8, name="pod strobe")
sphere(LIGHTS, RED, 0.0019, at=(W / 2 + 0.008, 0.012, ZC + 0.005), n=8, name="nav red")       # port (+x, facing +z, top +y)
sphere(LIGHTS, GREEN, 0.0019, at=(-W / 2 - 0.008, 0.012, ZC + 0.005), n=8, name="nav green")

apply_all(C)
apply_all(LIGHTS)
print("parts", len(C.all_objects), "tris", tri_count(C), "lights tris", tri_count(LIGHTS))
lights = join(list(LIGHTS.all_objects), "pod lights")

# ---------------------------------------------------------------- the shot
def aim(o, at, up=(0, 1, 0)):
    """points a camera at `at`, its up as near `up` (the pod's top) as it can be"""
    f = (V(at) - o.location).normalized(); r = f.cross(V(up)).normalized(); u = r.cross(f)
    o.rotation_euler = Matrix((r, u, -f)).transposed().to_euler()

if MODE == "preview":
    cam = bpy.data.cameras.new("pod cam"); cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("pod cam", cam); SC.collection.objects.link(co); SC.camera = co
    sun = bpy.data.lights.new("pod sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("pod sun", sun); SC.collection.objects.link(so)
    so.rotation_euler = V((-0.6, -0.5, 0.62)).to_track_quat("Z", "Y").to_euler()
    w = SC.world or bpy.data.worlds.new("pod world"); SC.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.8, 0.86, 1.0, 1); bg.inputs["Strength"].default_value = 0.07
    try: SC.view_settings.view_transform = "Khronos PBR Neutral"
    except Exception as e: print("view transform", e)
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"; prefs.get_devices()
        for d in prefs.devices: d.use = True
        SC.cycles.device = "GPU"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        SC.render.resolution_x, SC.render.resolution_y = 1280, 800
        for name, at in (("pod-preview", (-0.2, 0.07, 0.26)), ("pod-preview-2", (0.23, -0.09, -0.2))):
            co.location = V(at); aim(co, (0, -0.004, 0.006))
            SC.render.filepath = OUT + name + ".png"
            bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "pod-ao.png", size=1024, samples=96, distance=0.02)
    body.name = "pod"
    root = bpy.data.objects.new("pod root", None); C.objects.link(root)
    body.parent = root; lights.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, lights): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "pod.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
