"""A hauler (Work's breakthroughs, home-build round 3): Janriz, 2026-10-11, agreed to five grounded sci-fi craft types
for the traffic round home as Work builds it ("make it look like something out of a sci fi movie"); this is the space
truck. At the back a compact tug: a crew and avionics block with a few small dark windows, a cluster of propellant tanks
in foil, radiator fins, four thruster quads and three engine bells aft. Ahead of it, pushed along an open aluminium
truss spine, a rack of cargo containers in mixed finishes, clamped to the spine either side, one slot left empty; a
docking ring at the very front of the spine. Built from the station's own materials and helpers (station.py), at the
station's scale (its ring has a radius of 1, a module's is 0.078), so it docks at the hub's forward port as it is. Run
headless (`scripts/models/build.sh hauler`).

Blender's +z is the hauler's front (the way it travels); its origin is the middle of its docking ring's face. Its
craft's up is +y, so its port side (red) is +x and its starboard (green) -x. Its lights (a white strobe, the nav lights,
two warm work lights over the containers) are one node of their own, "hauler lights" (the site blinks them).

CRAFT_MODE: "preview" (Cycles, two cameras), "site" (bakes occlusion, writes out/hauler.raw.glb). In a live Blender,
run with LIVE set: it builds in a scene of its own and leaves the rest of the file alone.
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
    sc = bpy.data.scenes.get("hauler") or bpy.data.scenes.new("hauler")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("hauler")
# the station's materials and geometry helpers (tube, slab, handrail, cbm, grapple, window)
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

X, Y, Z = V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))
SPINE_W = 0.036                     # the truss spine's width (about 1 m)
Z_SPINE0, Z_SPINE1 = -0.026, -0.318  # the spine, from just behind the docking adapter back to the tug
CW, CH, CL = 0.034, 0.046, 0.088    # a container: across, up, along
SLOTS = (-0.074, -0.172, -0.270)    # each pair of containers' middle, front to back
Z_TUG = -0.318                       # the tug's front face

# ---------------------------------------------------------------- the docking ring and its adapter, at the front
tube(M["alu plain"], 0.03, (0, 0, Z_SPINE0 - 0.004), (0, 0, -0.008), n=40, tile=0.08, name="docking adapter")
tube(M["blanket"], 0.033, (0, 0, -0.022), (0, 0, -0.008), n=40, tile=0.08, r2=0.03, caps=False, name="adapter collar")
cbm((0, 0, -0.002), (0, 0, 1), 0.028)
tube(M["dark"], 0.024, (0, 0, -0.008), (0, 0, 0.0), n=32, name="docking hatch")

# ---------------------------------------------------------------- the spine: an open aluminium truss, end to end
truss(C, M["alu plain"], V((0, 0, Z_SPINE0)), V((0, 0, Z_SPINE1)), SPINE_W, 8, 0.0016, name="spine truss")
# a cable tray down its underside
rod(C, M["black"], V((0, -SPINE_W / 2 - 0.004, Z_SPINE0 - 0.004)), V((0, -SPINE_W / 2 - 0.004, Z_SPINE1 + 0.004)), 0.0018, n=6, name="cable tray")

# ---------------------------------------------------------------- the containers, clamped either side of the spine
FINISH = [("blanket", "gold"), ("grey", "blanket"), (None, "silver")]   # (port, starboard) per slot, front to back; None: empty
TOP = ["grey", None, "blanket"]                                          # and on top of the spine: partly loaded
for z, (port, star), top in zip(SLOTS, FINISH, TOP):
    if top:
        c = V((0, SPINE_W / 2 + 0.004 + CW / 2, z))
        slab(M[top], (CH, CW, CL), c, (X, Y, Z), 0.08, name="container", bevel=0.0012)
        for dz in (-CL * 0.32, CL * 0.32):
            slab(M["black"], (CH + 0.002, CW + 0.002, 0.004), c + V((0, 0, dz)), (X, Y, Z), 1, name="strap")
    # the clamp frame round the spine at this slot: a square of dark beams, an arm out to each side
    for dz in (-CL * 0.32, CL * 0.32):
        p = V((0, 0, z + dz))
        h = SPINE_W / 2 + 0.003
        for a, b in ((V((-h, -h, 0)), V((h, -h, 0))), (V((h, -h, 0)), V((h, h, 0))), (V((h, h, 0)), V((-h, h, 0))), (V((-h, h, 0)), V((-h, -h, 0)))):
            rod(C, M["dark"], p + a, p + b, 0.0022, n=6, name="clamp frame")
    for side, fin in ((1, port), (-1, star)):
        cx = side * (SPINE_W / 2 + 0.004 + CW / 2)
        c = V((cx, 0, z))
        if fin is None:
            # an empty slot: just the clamp arms, open
            for dz in (-CL * 0.32, CL * 0.32):
                rod(C, M["dark"], V((side * (SPINE_W / 2 + 0.003), -CH * 0.35, z + dz)), V((side * (SPINE_W / 2 + 0.004 + CW * 0.9), -CH * 0.35, z + dz)), 0.0018, n=6, name="clamp arm")
                rod(C, M["dark"], V((side * (SPINE_W / 2 + 0.003), CH * 0.35, z + dz)), V((side * (SPINE_W / 2 + 0.004 + CW * 0.9), CH * 0.35, z + dz)), 0.0018, n=6, name="clamp arm")
            continue
        slab(M[fin], (CW, CH, CL), c, (X, Y, Z), 0.05 if fin in ("gold", "silver") else 0.08, name="container", bevel=0.0012)
        # two straps round it, dark, where the clamp frames are
        for dz in (-CL * 0.32, CL * 0.32):
            slab(M["black"], (CW + 0.002, CH + 0.002, 0.004), c + V((0, 0, dz)), (X, Y, Z), 1, name="strap")
        # corner castings, front and back, on its outer edges
        for sz in (-1, 1):
            for sy in (-1, 1):
                slab(M["dark"], (0.005, 0.005, 0.005), c + V((side * CW / 2, sy * CH / 2, sz * CL / 2)), (X, Y, Z), 1, name="corner casting")

# ---------------------------------------------------------------- the tug: crew and avionics block, tanks, engines
BW, BH, BL = 0.07, 0.06, 0.04
Z_BLOCK = Z_TUG - BL / 2
slab(M["blanket"], (BW, BH, BL), V((0, 0, Z_BLOCK)), (X, Y, Z), 0.08, name="crew block", bevel=0.003)
# a forward bulkhead plate the spine lands on, and a gold band round the block
slab(M["alu plain"], (BW * 0.8, BH * 0.8, 0.004), V((0, 0, Z_TUG + 0.002)), (X, Y, Z), 1, name="spine plate")
slab(M["gold"], (BW + 0.002, BH + 0.002, 0.006), V((0, 0, Z_BLOCK - BL * 0.25)), (X, Y, Z), 0.05, name="block band")
# the windows: a row looking forward over the containers, from the block's top front edge
for wx in (-0.018, -0.006, 0.006, 0.018):
    window(V((wx, BH / 2 - 0.006, Z_TUG + 0.0005)), Z, r=0.0034)
window(V((0, BH / 2 + 0.0005, Z_BLOCK + 0.004)), Y, r=0.006)
grapple(V((0, -BH / 2 - 0.0005, Z_BLOCK)), -Y)
for side in (-1, 1):
    handrail(V((side * BW / 2, BH * 0.3, Z_TUG - 0.004)), V((side * BW / 2, BH * 0.3, Z_TUG - BL + 0.004)), X * side)

# the tank cluster: four foil-wrapped propellant tanks round a dark core, behind the block
Z_TANK = Z_TUG - BL - 0.03
tube(M["dark"], 0.012, (0, 0, Z_TUG - BL), (0, 0, Z_TANK - 0.034), n=24, name="tank core")
for k, fin in enumerate(("silver", "gold", "silver", "gold")):
    a = math.pi / 4 + k * math.pi / 2
    p = V((math.cos(a) * 0.026, math.sin(a) * 0.026, Z_TANK))
    o = capsule(C, M[fin], 0.016, 0.032, p, axis=(0, 0, 1), n=12, name="propellant tank")
    cube_uv(o, 0.05)
    # its mounting struts back to the core
    rod(C, M["alu plain"], p + V((0, 0, 0.026)), V((0, 0, Z_TANK + 0.03)), 0.0014, n=5, name="tank strut")
    rod(C, M["alu plain"], p - V((0, 0, 0.026)), V((0, 0, Z_TANK - 0.03)), 0.0014, n=5, name="tank strut")

# long radiator wings either side, edge-on to its star, swept a little back
RAD_L, RAD_W = 0.11, 0.06
for side in (-1, 1):
    root = V((side * (BW / 2 + 0.004), 0, Z_BLOCK - BL * 0.2))
    out = (X * side + -Z * 0.36).normalized()
    rod(C, M["alu plain"], root, root + out * 0.014, 0.0026, n=6, name="radiator arm")
    slab(M["dark"], (0.008, 0.008, 0.012), root + out * 0.014, (X, Y, Z), 1, name="radiator drive", bevel=0.001)
    mid = root + out * (0.018 + RAD_W / 2)
    # the panel lies along the wing (out) and fore and aft (along z), edge-on (thin in y)
    slab(M["radiator"], (RAD_W, 0.0025, RAD_L), mid - Z * (RAD_L * 0.3), (out, Y, out.cross(Y).normalized()), 0.08, name="radiator wing")
    rod(C, M["alu plain"], root + out * 0.018, root + out * (0.018 + RAD_W), 0.0012, n=5, name="radiator spar")

# the thrust structure: a ring plate behind the tanks, three engine bells in a triangle
Z_THRUST = Z_TANK - 0.04
tube(M["alu plain"], 0.036, (0, 0, Z_THRUST + 0.004), (0, 0, Z_THRUST), n=32, tile=0.08, name="thrust plate")
for k in range(3):
    a = math.pi / 2 + k * 2 * math.pi / 3
    p = V((math.cos(a) * 0.021, math.sin(a) * 0.021, Z_THRUST))
    tube(M["dark"], 0.006, p, p - Z * 0.006, n=20, name="engine throat")
    tube(M["dark"], 0.007, p - Z * 0.006, p - Z * 0.038, n=20, r2=0.0165, caps=False, name="engine bell")
    tube(M["black"], 0.0168, p - Z * 0.036, p - Z * 0.039, n=20, caps=False, name="engine lip")

# thruster quads at the block's four corners
for sx in (-1, 1):
    for sy in (-1, 1):
        d = V((sx, sy, 0)).normalized()
        p = V((sx * (BW / 2 + 0.005), sy * (BH / 2 + 0.005), Z_BLOCK))
        slab(M["dark"], (0.01, 0.01, 0.01), p, (X, Y, Z), 1, name="rcs block", bevel=0.0012)
        for e in (Z, -Z, X * sx, Y * sy):
            tube(M["black"], 0.0018, p + e * 0.005, p + e * 0.0095, n=8, r2=0.003, caps=False, name="rcs nozzle")

# ---------------------------------------------------------------- its lights: one node of their own
LIGHTS = coll("hauler lights")
def lamp(name, col, strength):
    m = plain(name, "#202020", 0.0, 0.4)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Emission Color"].default_value = srgb(col); b.inputs["Emission Strength"].default_value = strength
    return m
L = []
L.append(sphere(LIGHTS, lamp("hauler strobe", "#ffffff", 10.0), 0.0024, at=(0, BH / 2 + 0.004, Z_BLOCK - BL * 0.35), n=8, name="strobe"))
# nav lights at the radiator wings' outer front corners
for side, name, col in ((1, "hauler port", "#ff2a1a"), (-1, "hauler starboard", "#22ff55")):
    tip = V((side * (BW / 2 + 0.004), 0, Z_BLOCK - BL * 0.2)) + (X * side + -Z * 0.36).normalized() * (0.018 + RAD_W + 0.003)
    L.append(sphere(LIGHTS, lamp(name, col, 8.0), 0.002, at=tip + Z * 0.004, n=8, name=name))
work = lamp("hauler work light", "#ffe2b8", 6.0)
for side in (-1, 1):
    # floodlights on the docking adapter's collar, looking back over the containers
    L.append(box(LIGHTS, work, (0.007, 0.004, 0.003), at=(side * 0.02, 0.026, -0.016), name="work light"))
lights = join(L, "hauler lights")

apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C) + tri_count(LIGHTS))

# ---------------------------------------------------------------- the shot
def aim(o, at):
    o.rotation_euler = (V(at) - o.location).to_track_quat("-Z", "Y").to_euler()

if MODE == "preview":
    cam = bpy.data.cameras.new("hauler cam"); cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("hauler cam", cam); SC.collection.objects.link(co); SC.camera = co
    sun = bpy.data.lights.new("hauler sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("hauler sun", sun); SC.collection.objects.link(so)
    so.rotation_euler = V((-0.6, -0.5, 0.62)).to_track_quat("Z", "Y").to_euler()
    w = bpy.data.worlds.get("hauler world") or bpy.data.worlds.new("hauler world")
    SC.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.8, 0.86, 1.0, 1); bg.inputs["Strength"].default_value = 0.07
    try: SC.view_settings.view_transform = "Khronos PBR Neutral"
    except Exception as e: print("view transform", e)
    SC.view_settings.look = "None"; SC.view_settings.exposure = 0; SC.view_settings.gamma = 1
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        try:
            prefs = bpy.context.preferences.addons["cycles"].preferences
            prefs.compute_device_type = "METAL"; prefs.get_devices()
            for d in prefs.devices: d.use = True
            SC.cycles.device = "GPU"
        except Exception as e: print("gpu", e)
        SC.render.resolution_x, SC.render.resolution_y = 1280, 800
        # a three-quarter from the front and above, then from behind and below, the engines towards you
        for name, loc, at in (("hauler-preview", (0.8, 0.3, 0.12), (0, 0, -0.22)), ("hauler-preview-2", (-0.55, -0.28, -0.86), (0, 0, -0.23))):
            co.location = V(loc); aim(co, at)
            SC.render.filepath = OUT + name + ".png"
            bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "hauler-ao.png", size=1024, samples=96, distance=0.06)
    body.name = "hauler"
    root = bpy.data.objects.new("hauler root", None); C.objects.link(root)
    body.parent = root; lights.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, lights): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "hauler.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
