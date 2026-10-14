"""A construction drone (Work's timelapse, home-build round 4): Janriz, 2026-10-11, wants home's build "quite busy ...
drones coming in and out like a timelapse ... things are just blazing in and out". Dozens of these work round the build
front, each a quick trip in, a weld, and away; the site draws them instanced, their running lights leaving short trails.

A compact bus (~1.5 m) in grey paint with gold-foil panels, four cold-gas thruster pods on short arms (no propellers in
space), a sensor eye and a work light forward, a welding arm below, red/green running lights and a white strobe. Built
from the station's materials and helpers at its scale (station.py: a module's radius is 0.078 ≈ 2.15 m). Run headless
(`scripts/models/build.sh drone`), or with LIVE set in a live Blender (a scene of its own).

Blender +z is its front, +y its top; origin at its middle. Its lights are their own node ("drone lights").
CRAFT_MODE: "preview" (Cycles), "site" (bakes occlusion, writes out/drone.raw.glb).
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
    sc = bpy.data.scenes.get("drone") or bpy.data.scenes.new("drone")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("drone")
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

def emissive(name, rgb, strength):
    m = plain(name, "#202020", 0.0, 0.4)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Emission Color"].default_value = srgb(rgb); b.inputs["Emission Strength"].default_value = strength
    return m

X, Y, Z = V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))
W, H, L = 0.036, 0.017, 0.044           # the bus: across, high, long (~1.3 m × 0.6 m × 1.6 m)

# ---------------------------------------------------------------- the bus: grey, gold-foil panels on its flanks
slab(M["grey"], (W, H, L), (0, 0, 0), (X, Y, Z), 1, name="bus", bevel=0.003)
for s in (-1, 1):
    slab(M["gold"], (0.0012, H * 0.7, L * 0.7), (s * (W / 2 + 0.0006), 0, -0.002), (X, Y, Z), 0.03, name="foil panel")
slab(M["silver"], (W * 0.8, 0.0012, L * 0.75), (0, H / 2 + 0.0006, -0.002), (X, Y, Z), 0.03, name="top radiator")
slab(M["dark"], (W * 0.5, 0.004, 0.012), (0, -H / 2 - 0.002, -0.01), (X, Y, Z), 1, name="belly box", bevel=0.001)

# ---------------------------------------------------------------- four thruster pods on short arms, at the corners
for sx in (-1, 1):
    for sz in (-1, 1):
        a = V((sx * W / 2, 0, sz * L * 0.32)); b = V((sx * (W / 2 + 0.012), 0.002, sz * L * 0.42))
        rod(C, M["alu plain"], a, b, 0.0016, n=6, name="pod arm")
        slab(M["dark"], (0.008, 0.008, 0.008), b, (X, Y, Z), 1, name="thruster pod", bevel=0.001)
        for d in (X * sx, Z * sz):
            tube(M["black"], 0.0012, b + d * 0.004, b + d * 0.0072, n=6, r2=0.0021, caps=False, name="nozzle")

# ---------------------------------------------------------------- forward: a sensor eye and a work light
tube(M["dark"], 0.0045, (0.008, 0.002, L / 2), (0.008, 0.002, L / 2 + 0.003), n=12, name="eye housing")
tube(M["glass"], 0.0033, (0.008, 0.002, L / 2 + 0.003), (0.008, 0.002, L / 2 + 0.0036), n=12, name="eye")
LIGHTS = coll("drone lights")
lamp = emissive("drone lamp", "#ffe2b8", 6.0)
red = emissive("drone red", "#ff3020", 8.0)
green = emissive("drone green", "#30ff60", 8.0)
white = emissive("drone strobe", "#ffffff", 10.0)
parts = [cyl(LIGHTS, lamp, 0.004, 0.002, at=(-0.009, 0.003, L / 2 + 0.001), rot=(0, 0, 0), n=12, name="work lamp")]

# ---------------------------------------------------------------- below: a welding arm, folded forward
p0 = V((0, -H / 2 - 0.004, -0.004)); p1 = p0 + V((0, -0.008, 0.014)); p2 = p1 + V((0, 0.002, 0.012))
rod(C, M["alu plain"], p0, p1, 0.0014, n=6, name="arm")
rod(C, M["alu plain"], p1, p2, 0.0012, n=6, name="arm")
slab(M["dark"], (0.003, 0.003, 0.004), p1, (X, Y, Z), 1, name="arm joint")
tube(M["black"], 0.0016, p2, p2 + V((0, -0.001, 0.004)), n=8, r2=0.0006, caps=False, name="torch")

# ---------------------------------------------------------------- running lights and the strobe
parts.append(sphere(LIGHTS, red, 0.0016, at=(-(W / 2 + 0.012), 0.002, L * 0.42 + 0.005), n=8, name="nav red"))
parts.append(sphere(LIGHTS, green, 0.0016, at=((W / 2 + 0.012), 0.002, L * 0.42 + 0.005), n=8, name="nav green"))
parts.append(sphere(LIGHTS, white, 0.0018, at=(0, H / 2 + 0.003, -L * 0.35), n=8, name="strobe"))
lights = join(parts, "drone lights")

apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C) + tri_count(LIGHTS))

# ---------------------------------------------------------------- the shot
def aim(o, at):
    o.rotation_euler = (V(at) - o.location).to_track_quat("-Z", "Y").to_euler()

if MODE == "preview":
    cam = bpy.data.cameras.new("drone cam"); cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("drone cam", cam); SC.collection.objects.link(co); SC.camera = co
    co.location = V((0.09, 0.05, 0.11)); aim(co, (0, -0.002, 0))
    sun = bpy.data.lights.new("drone sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("drone sun", sun); SC.collection.objects.link(so)
    so.rotation_euler = V((-0.6, 0.62, 0.5)).to_track_quat("Z", "Y").to_euler()
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        SC.render.resolution_x, SC.render.resolution_y = 1280, 800
        SC.render.filepath = OUT + "drone-preview.png"
        bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "drone-ao.png", size=512, samples=64, distance=0.02)
    body.name = "drone"
    root = bpy.data.objects.new("drone root", None); C.objects.link(root)
    body.parent = root; lights.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, lights): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "drone.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
