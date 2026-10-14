"""A construction worker in an EVA suit (Work's timelapse, home-build round 4): Janriz, 2026-10-11, "we can also do space
construction workers maybe". A few work on home's skeleton at the build front, helmet lamps lit, and a couple jet
between spots on thruster packs; beside the station they give it its size (~1.9 m against a module 4.3 m across).

An EVA suit's plan: white suit (the station's quilted cloth), a gold visor, a life-support backpack, a thruster pack at
the waist with its hand controls, two helmet lamps; a working crouch, arms reaching forward. Built in metres and scaled
to the station's units (station.py: a module's radius is 0.078 ≈ 2.15 m). Run headless (`scripts/models/build.sh
worker`), or with LIVE set in a live Blender (a scene of its own).

Blender +z is the worker's up and −y the way they face; origin at the feet. The helmet lamps are their own node
("worker lights").
CRAFT_MODE: "preview" (Cycles), "site" (bakes occlusion, writes out/worker.raw.glb).
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
    sc = bpy.data.scenes.get("worker") or bpy.data.scenes.new("worker")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("worker")
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

U = 0.0363                      # metres to the station's units
P = lambda x, y, z: V((x * U, y * U, z * U))
SUIT = M["blanket"]

def limb(a, b, r, m=SUIT, name="limb"):
    a, b = P(*a), P(*b)
    return capsule(C, m, r * U, (b - a).length, (a + b) / 2, axis=b - a, n=10, name=name)

# ---------------------------------------------------------------- legs, a working crouch: knees bent, feet apart
for s in (-1, 1):
    hip, knee, ankle = (s * 0.11, 0.0, 0.92), (s * 0.13, -0.16, 0.5), (s * 0.12, -0.04, 0.1)
    limb(hip, knee, 0.105, name="thigh"); limb(knee, ankle, 0.092, name="shin")
    slab(M["grey"], (0.13 * U, 0.28 * U, 0.1 * U), P(s * 0.12, -0.08, 0.05), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 1, name="boot", bevel=0.01 * U)

# ---------------------------------------------------------------- torso, the hard upper torso, and the backpack
capsule(C, SUIT, 0.17 * U, 0.12 * U, P(0, 0.0, 1.02), axis=(0, 0, 1), n=12, name="hips")
slab(SUIT, (0.48 * U, 0.34 * U, 0.52 * U), P(0, -0.01, 1.32), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 0.16, name="upper torso", bevel=0.06 * U)
slab(M["grey"], (0.22 * U, 0.06 * U, 0.14 * U), P(0, -0.2, 1.3), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 1, name="chest controls", bevel=0.01 * U)
slab(SUIT, (0.5 * U, 0.24 * U, 0.66 * U), P(0, 0.29, 1.3), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 0.16, name="backpack", bevel=0.04 * U)
# the thruster pack round the backpack's foot, its hand controls forward at the hips
slab(M["grey"], (0.6 * U, 0.3 * U, 0.16 * U), P(0, 0.3, 0.92), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 1, name="thruster pack", bevel=0.02 * U)
for s in (-1, 1):
    rod(C, M["alu plain"], P(s * 0.3, 0.2, 0.92), P(s * 0.3, -0.22, 0.98), 0.018 * U, n=6, name="control arm")
    slab(M["dark"], (0.06 * U, 0.08 * U, 0.06 * U), P(s * 0.3, -0.24, 0.99), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 1, name="hand control")
    for z in (0.86, 1.62):
        tube(M["black"], 0.012 * U, P(s * 0.31, 0.43, z), P(s * 0.31, 0.47, z), n=6, r2=0.02 * U, caps=False, name="thruster")

# ---------------------------------------------------------------- arms, reaching forward to work
for s in (-1, 1):
    sh, el, wr = (s * 0.27, -0.02, 1.5), (s * 0.3, -0.3, 1.32), (s * 0.18, -0.55, 1.28)
    limb(sh, el, 0.092, name="upper arm"); limb(el, wr, 0.08, name="forearm")
    sphere(C, M["grey"], 0.08 * U, at=P(*wr) + P(0, -0.05, 0), n=8, name="glove")

# ---------------------------------------------------------------- the helmet: a white shell, a gold visor, two lamps
head = P(0, -0.04, 1.74)
sphere(C, M["grey"], 0.17 * U, at=head, n=16, name="helmet")
visor = sphere(C, M["gold"], 0.166 * U, at=head + P(0, -0.05, -0.005), n=16, name="visor", scale=(0.97, 0.82, 0.9))
LIGHTS = coll("worker lights")
lamp = plain("worker lamp", "#202020", 0.0, 0.4)
b = next(n for n in lamp.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
b.inputs["Emission Color"].default_value = srgb("#ffe2b8"); b.inputs["Emission Strength"].default_value = 8.0
lamps = [cyl(LIGHTS, lamp, 0.03 * U, 0.04 * U, at=head + P(s * 0.15, -0.08, 0.08), rot=(math.pi / 2, 0, 0), n=8, name="helmet lamp") for s in (-1, 1)]
lights = join(lamps, "worker lights")

apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C) + tri_count(LIGHTS))

# ---------------------------------------------------------------- the shot
def aim(o, at):
    o.rotation_euler = (V(at) - o.location).to_track_quat("-Z", "Y").to_euler()

if MODE == "preview":
    cam = bpy.data.cameras.new("worker cam"); cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("worker cam", cam); SC.collection.objects.link(co); SC.camera = co
    co.location = P(1.6, -3.4, 2.0); aim(co, P(0, 0, 1.0))
    sun = bpy.data.lights.new("worker sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("worker sun", sun); SC.collection.objects.link(so)
    so.rotation_euler = V((-0.6, -0.5, 0.62)).to_track_quat("Z", "Y").to_euler()
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        SC.render.resolution_x, SC.render.resolution_y = 1280, 800
        SC.render.filepath = OUT + "worker-preview.png"
        bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "worker-ao.png", size=512, samples=64, distance=0.01)
    body.name = "worker"
    root = bpy.data.objects.new("worker root", None); C.objects.link(root)
    body.parent = root; lights.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, lights): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "worker.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
