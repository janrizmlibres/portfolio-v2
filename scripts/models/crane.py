"""A crane ship (Work's breakthroughs, home-build round 4): Janriz, 2026-10-11, agreed to five craft types round home as
Work builds it, grounded sci-fi (The Expanse, Interstellar), so no two breakthroughs in a row come by in the same craft.
This is the heavy constructor: a pressurised control block up front, a band of small windows round it and floodlights
looking ahead, its nose a docking ring; behind it an open aluminium truss spine carrying a turret and a two-part crane
boom (a lattice lower boom, a box upper boom with its rams) that holds a section of lattice truss crosswise above the
block, as the station's spokes are built; four propellant tanks in silver foil and a radiator pair aft; a thrust
structure with three engine bells at the back. Warm floodlights run along the spine, nav lights at the radiator tips
(red to port, green to starboard), white strobes on the block and aft. Built from the station's own materials and
helpers (station.py), at the station's scale (its ring has a radius of 1, a module's is 0.078): about 0.6 long, 16 m.
Run headless (`scripts/models/build.sh crane`).

Blender's +z is the craft's front (the way it flies), +y its top; its origin is the middle of its docking ring's face,
so it docks at the hub's forward port as it is. Its lights are their own node ("crane lights", unbaked: the site can
blink them).

CRAFT_MODE: "preview" (Cycles, two cameras), "site" (bakes occlusion, writes out/crane.raw.glb). In a live Blender, run
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
    sc = bpy.data.scenes.get("crane") or bpy.data.scenes.new("crane")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("crane")
# the station's materials and geometry helpers (tube, slab, handrail, cbm, grapple, window)
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

LIGHTS = coll("crane lights")
def glow(name, col, strength):
    m = plain(name, "#202020", 0.0, 0.4)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Emission Color"].default_value = srgb(col); b.inputs["Emission Strength"].default_value = strength
    return m
FLOOD = glow("crane flood", "#ffe2b8", 12.0)
RED, GREEN, WHITE = glow("crane nav red", "#ff2a1a", 10.0), glow("crane nav green", "#20ff60", 10.0), glow("crane strobe", "#ffffff", 10.0)
UP = V((0, 1, 0)); FWD = V((0, 0, 1)); X = V((1, 0, 0))

def prism(m, r, z0, z1, n, name, tile=0.08):
    """an n-sided prism round z from z0 to z1, a flat face square to +x, flat-shaded, box-projected UVs"""
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=z1 - z0, location=(0, 0, (z0 + z1) / 2))
    o = bpy.context.object; o.name = name
    o.rotation_euler = (0, 0, math.pi / n)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    link(o, C)
    o.data.materials.append(m)
    cube_uv(o, tile)
    return o

def beam(m, a, b, w, h, up, name="beam", tile=0.08):
    """a box-section beam from a to b, w wide and h deep (h along `up`)"""
    a, b = V(a), V(b); d = (b - a).normalized(); u = (V(up) - d * V(up).dot(d)).normalized(); s = u.cross(d)
    return slab(m, (w, h, (b - a).length), (a + b) / 2, (s, u, d), tile, name=name)

def flood(at, facing, housing=0.009):
    """a floodlight: a dark housing, its lens (a light) looking along `facing`"""
    f = V(facing).normalized(); u = f.orthogonal().normalized(); w = f.cross(u)
    slab(M["dark"], (housing, housing, housing * 0.8), V(at), (u, w, f), 1, name="flood housing")
    o = slab(FLOOD, (housing * 0.78, housing * 0.78, 0.0012), V(at) + f * (housing * 0.4 + 0.0006), (u, w, f), 1, name="flood lens")
    link(o, LIGHTS)

def lamp(m, at, r=0.0024, name="lamp"):
    link(box(C, m, (r * 1.6, r * 1.6, r * 1.6), at=at, name=name), LIGHTS)

# ---------------------------------------------------------------- the control block, its nose a docking ring
BR = 0.056                       # the block's radius (an octagon's corners), about 3 m
Z_BLOCK, Z_BACK = -0.03, -0.135  # the block runs between these
tube(M["blanket"], BR * 0.93, (0, 0, Z_BLOCK), (0, 0, -0.006), n=40, tile=0.08, r2=0.036, caps=False, name="nose cone")
cbm((0, 0, -0.002), (0, 0, 1), 0.034)
tube(M["dark"], 0.03, (0, 0, -0.006), (0, 0, 0.0), n=32, name="docking hatch")
prism(M["blanket"], BR, Z_BACK, Z_BLOCK, 8, "control block")
for z in (Z_BLOCK - 0.003, Z_BACK + 0.004):
    prism(M["alu plain"], BR * 1.012, z - 0.003, z + 0.003, 8, "block seam")
tube(M["silver"], BR * 0.8, (0, 0, Z_BACK - 0.008), (0, 0, Z_BACK), n=32, tile=0.06, name="aft bulkhead")

# a band of small windows round the block's front, two to each face of the octagon
AP = BR * math.cos(math.pi / 8)  # the faces' distance from the axis
for k in range(8):
    a = k * math.pi / 4
    n = V((math.cos(a), math.sin(a), 0)); t = V((-math.sin(a), math.cos(a), 0))
    if k == 6: continue          # the keel, where the boom's cables run, has none
    for s in (-1, 1):
        p = n * (AP + 0.0006) + t * (s * 0.0105) + V((0, 0, Z_BLOCK - 0.024))
        slab(M["grey"], (0.0012, 0.0128, 0.0098), p - n * 0.0004, (n, t, FWD), 1, name="window frame")
        slab(M["glass"], (0.0012, 0.0108, 0.0078), p, (n, t, FWD), 1, name="window")
# fittings: handrails along the top faces, a grapple fixture, equipment boxes on the flanks
for s in (-1, 1):
    a = math.pi / 2 + s * math.pi / 4
    n = V((math.cos(a), math.sin(a), 0))
    handrail(n * AP + V((0, 0, Z_BLOCK - 0.045)), n * AP + V((0, 0, Z_BACK + 0.012)), n)
grapple(V((0, AP + 0.001, Z_BACK + 0.028)), UP)
for s in (-1, 1):
    n = V((s, 0, 0)); t = FWD.cross(n)
    for j, (mm, ln) in enumerate(((M["dark"], 0.03), (M["grey"], 0.022))):
        slab(mm, (0.008, 0.026, ln), n * (AP + 0.004) + V((0, -0.006, Z_BACK + 0.02 + j * 0.036)), (n, t, FWD), 0.08, name="equipment box")
# floodlights at the block's front corners, looking ahead, and an antenna dish on its back
for a in (math.pi / 4, 3 * math.pi / 4, 5 * math.pi / 4, 7 * math.pi / 4):
    d = V((math.cos(a), math.sin(a), 0))
    flood(d * (BR * 0.86) + V((0, 0, Z_BLOCK + 0.004)), (d * 0.25 + FWD).normalized())
p = V((-AP * 0.5, AP * 0.86, Z_BACK + 0.018))
rod(C, M["alu plain"], p, p + V((0, 0.026, 0)), 0.0016, n=6, name="antenna mast")
dish(C, M["radiator"], 0.014, 0.005, at=p + V((0, 0.028, 0)), facing=V((-0.3, 1, 0.5)).normalized(), n=16, k=4, thick=0.0015, name="antenna dish")
lamp(WHITE, V((0, AP + 0.004, Z_BLOCK - 0.006)), name="strobe")

# ---------------------------------------------------------------- the spine: an open truss, its pipes inside
Z_SPINE0, Z_SPINE1, SW = Z_BACK - 0.008, -0.50, 0.062
truss(C, M["alu plain"], (0, 0, Z_SPINE0), (0, 0, Z_SPINE1), SW, 8, 0.0026, name="spine truss")
for x, y in ((0.012, -0.012), (-0.012, -0.012)):
    rod(C, M["black"], (x, y, Z_SPINE0), (x, y, Z_SPINE1), 0.0034, n=8, name="spine pipe")
# floodlights along the spine's top edges, looking out and down onto the work
for j in range(5):
    z = Z_SPINE0 - 0.04 - j * 0.07
    for s in (-1, 1):
        flood(V((s * SW / 2, SW / 2, z)), V((s * 0.6, 0.4, 0.5)).normalized(), housing=0.0075)

# ---------------------------------------------------------------- the crane: a turret, a lattice boom, a box boom
Z_TURRET = -0.255
TOP = SW / 2
tube(M["grey"], 0.03, (0, TOP, Z_TURRET), (0, TOP + 0.006, Z_TURRET), n=32, name="turret ring")
tube(M["dark"], 0.024, (0, TOP + 0.006, Z_TURRET), (0, TOP + 0.024, Z_TURRET), n=32, name="turret")
slab(M["blanket"], (0.034, 0.02, 0.03), V((0, TOP + 0.028, Z_TURRET - 0.006)), (X, UP, FWD), 0.08, name="turret housing", bevel=0.0015)
SHOULDER = V((0, TOP + 0.036, Z_TURRET + 0.004))
ELBOW = V((0, 0.215, -0.165))
WRIST = V((0, 0.128, -0.062))
truss(C, M["alu plain"], SHOULDER, ELBOW, 0.026, 5, 0.002, name="lower boom")
for s in (-1, 1):                                    # the shoulder and elbow pins
    tube(M["dark"], 0.009, SHOULDER + X * (s * 0.006), SHOULDER + X * (s * 0.02), n=20, name="pin")
    tube(M["dark"], 0.008, ELBOW + X * (s * 0.004), ELBOW + X * (s * 0.017), n=20, name="pin")
# the upper boom in the handrails' yellow paint: a working crane's colour
beam(M["rail"], ELBOW, WRIST, 0.02, 0.018, UP, name="upper boom")
# the rams that work them: from the turret housing up the lower boom, and from the elbow along the upper
for s in (-1, 1):
    a = SHOULDER + X * (s * 0.014) + V((0, -0.006, -0.02)); b = SHOULDER + (ELBOW - SHOULDER) * 0.55 + X * (s * 0.014)
    rod(C, M["silver"], a, a + (b - a) * 0.55, 0.0036, n=10, name="ram barrel")
    rod(C, M["alu plain"], a + (b - a) * 0.5, b, 0.0022, n=8, name="ram rod")
a = ELBOW + V((0, 0.012, -0.004)); b = ELBOW + (WRIST - ELBOW) * 0.6 + V((0, 0.012, 0))
rod(C, M["silver"], a, a + (b - a) * 0.55, 0.0032, n=10, name="ram barrel")
rod(C, M["alu plain"], a + (b - a) * 0.5, b, 0.002, n=8, name="ram rod")
# the gripper, and the section of truss it carries crosswise above the block
slab(M["dark"], (0.02, 0.012, 0.016), WRIST, (X, UP, FWD), 1, name="wrist", bevel=0.0012)
LOAD_Y = WRIST.y - 0.024
for s in (-1, 1):
    beam(M["grey"], WRIST + X * (s * 0.007), V((s * 0.007, LOAD_Y - 0.004, WRIST.z)), 0.004, 0.006, FWD, name="gripper finger")
truss(C, M["alu plain"], (-0.13, LOAD_Y, WRIST.z), (0.13, LOAD_Y, WRIST.z), 0.03, 6, 0.0019, name="carried truss")
flood(WRIST + V((0, -0.002, 0.011)), V((0, -0.6, 0.8)).normalized(), housing=0.007)

# ---------------------------------------------------------------- aft: tanks, radiators, the engines
Z_TANKS = -0.415
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    d = V((math.cos(a), math.sin(a), 0))
    capsule(C, M["silver"], 0.026, 0.07, at=d * 0.052 + V((0, 0, Z_TANKS)), axis=(0, 0, 1), n=12, name="tank")
    for z in (Z_TANKS - 0.03, Z_TANKS + 0.03):
        tube(M["alu plain"], 0.0272, d * 0.052 + V((0, 0, z - 0.002)), d * 0.052 + V((0, 0, z + 0.002)), n=14, caps=False, name="tank strap")
for s in (-1, 1):                                    # the radiator pair, edge on above and below, out to the sides
    root = V((s * SW / 2, 0, -0.345))
    rod(C, M["alu plain"], root, root + X * (s * 0.03), 0.0026, n=8, name="radiator arm")
    for j in range(2):
        slab(M["radiator"], (0.07, 0.003, 0.065), root + X * (s * (0.066 + j * 0.073)), (X, UP, FWD), 0.08, name="radiator panel")
    lamp(RED if s > 0 else GREEN, root + X * (s * 0.142), name="nav light")
prism(M["dark"], 0.05, Z_SPINE1 - 0.022, Z_SPINE1 + 0.004, 8, "thrust structure", tile=0.06)
tube(M["gold"], 0.046, (0, 0, Z_SPINE1 + 0.004), (0, 0, Z_SPINE1 + 0.026), n=24, tile=0.06, caps=False, name="engine skirt")
for k in range(3):
    a = math.pi / 2 + k * 2 * math.pi / 3
    c = V((math.cos(a), math.sin(a), 0)) * 0.026 + V((0, 0, Z_SPINE1 - 0.022))
    tube(M["dark"], 0.009, c, c - FWD * 0.008, n=16, name="engine throat")
    tube(M["dark"], 0.009, c - FWD * 0.008, c - FWD * 0.042, n=24, r2=0.019, caps=False, name="engine bell")
lamp(WHITE, V((0, 0.05, Z_SPINE1 - 0.006)), name="strobe")

apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C) + tri_count(LIGHTS))

# ---------------------------------------------------------------- the shot
def aim(o, at):
    o.rotation_euler = (V(at) - o.location).to_track_quat("-Z", "Y").to_euler()

if MODE == "preview":
    w = SC.world or bpy.data.worlds.new("crane world"); SC.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.8, 0.86, 1.0, 1); bg.inputs["Strength"].default_value = 0.07
    cam = bpy.data.cameras.new("crane cam"); cam.angle_y = math.radians(30); cam.sensor_fit = "VERTICAL"
    co = bpy.data.objects.new("crane cam", cam); SC.collection.objects.link(co); SC.camera = co
    sun = bpy.data.lights.new("crane sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("crane sun", sun); SC.collection.objects.link(so)
    so.rotation_euler = V((-0.6, -0.5, 0.62)).to_track_quat("Z", "Y").to_euler()
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"; prefs.get_devices()
        for d in prefs.devices: d.use = True
        SC.cycles.device = "GPU"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        SC.render.resolution_x, SC.render.resolution_y = 1280, 800
        SC.render.film_transparent = True
        SC.render.image_settings.file_format = "PNG"; SC.render.image_settings.color_mode = "RGB"
        try: SC.view_settings.view_transform = "Khronos PBR Neutral"
        except Exception as e: print("view transform", e)
        # both on the sunlit side (his star lights the craft's left, underside and front)
        for name, at, look in (("crane-preview", (-0.82, -0.36, 0.52), (0, 0.05, -0.27)), ("crane-preview-2", (-1.18, 0.2, -0.22), (0, 0.06, -0.26))):
            co.location = V(at); aim(co, look)
            SC.render.filepath = OUT + name + ".png"
            bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "crane-ao.png", size=1024, samples=96, distance=0.06)
    body.name = "crane"
    lights = join([o for o in LIGHTS.all_objects if o.type == "MESH"], "crane lights")
    root = bpy.data.objects.new("crane root", None); C.objects.link(root)
    body.parent = root; lights.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, lights): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "crane.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
