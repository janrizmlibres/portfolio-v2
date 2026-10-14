"""A shuttle (Work's breakthroughs, home-build round 4): one of the five hero craft that come by home while Work builds it
(Janriz, 2026-10-11: grounded sci-fi, "something out of a sci fi movie", never two alike in a row). A sleek winged
shuttle in the spirit of Interstellar's Ranger, making fast passes; it never docks:
- a flat, chined lifting-body fuselage, its nose drooping, light grey above and dark quilted thermal blankets below;
- a cockpit of dark wraparound windows in frames, panel seams across the upper hull, a dorsal spine with a hatch;
- swept wings from the chines, their tips drooped, and two canted fins aft;
- an engine block with three bells, their throats glowing, and thruster blocks fore and aft;
- red and green nav lights at the wingtips, white strobes on the fins and the belly (their own node).
About 11 m long (0.4 of the station's units: its ring has a radius of 1, a module's is 0.078). Built from the station's
own helpers and materials (station.py). Run headless (`scripts/models/build.sh shuttle`).

Blender's +z is its nose, +y its top, +x its port side; its origin is its middle.

CRAFT_MODE: "preview" (Cycles, two cameras), "site" (bakes occlusion, writes out/shuttle.raw.glb). In a live Blender,
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
    sc = bpy.data.scenes.get("shuttle") or bpy.data.scenes.new("shuttle")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("shuttle")
# the station's materials and geometry helpers (tube, slab, handrail, cbm, grapple, window)
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

def painted(name, rgb, rough_tex, normal_tex=None, strength=0.4):
    """a paint: a flat colour, its roughness (and its relief, if given) from one of the station's maps"""
    m, nt, b = principled(name)
    b.inputs["Base Color"].default_value = srgb(rgb)
    b.inputs["Metallic"].default_value = 0.0
    nt.links.new(img(nt, TEX + rough_tex + "-rough.png", False).outputs["Color"], b.inputs["Roughness"])
    if normal_tex:
        nm = img(nt, TEX + normal_tex + "-normal.png", False)
        nn = nt.nodes.new("ShaderNodeNormalMap"); nn.inputs["Strength"].default_value = strength
        nt.links.new(nm.outputs["Color"], nn.inputs["Color"]); nt.links.new(nn.outputs["Normal"], b.inputs["Normal"])
    return m

def glowing(name, rgb, strength):
    m = plain(name, "#202020", 0.0, 0.4)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Emission Color"].default_value = srgb(rgb); b.inputs["Emission Strength"].default_value = strength
    return m

# quilted white blankets above, as the station's and a real orbiter's are; grey flanks; dark thermal blankets below
HULL = M["blanket"]
FLANK = painted("shuttle flank", "#8e9298", "alu")
SHIELD = painted("shuttle shield", "#242529", "blanket", "blanket", 0.55)
GLASS = plain("shuttle glass", "#06070a", 0.0, 0.06)
FRAME = plain("shuttle frame", "#2c2e33", 0.4, 0.45)
THROAT = glowing("shuttle throat", "#ffc890", 6.0)

def mesh_obj(name, bm, mats, smooth=30):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); C.objects.link(o)
    for m in mats: me.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(smooth))
    except Exception: bpy.ops.object.shade_flat()
    return o

# ---------------------------------------------------------------- the fuselage: chined sections lofted nose to tail
# each section: (z, half-width at the chine, height of the top above the chine, depth of the keel below it, droop)
SECTIONS = [
    (0.200, 0.006, 0.004, 0.004, -0.010),
    (0.180, 0.024, 0.012, 0.010, -0.006),
    (0.150, 0.040, 0.022, 0.015, -0.002),
    (0.130, 0.047, 0.027, 0.017, -0.001),
    (0.110, 0.052, 0.030, 0.018, 0.0),
    (0.060, 0.060, 0.034, 0.020, 0.0),
    (0.000, 0.066, 0.034, 0.021, 0.0),
    (-0.080, 0.070, 0.032, 0.021, 0.0),
    (-0.150, 0.068, 0.030, 0.020, 0.0),
    (-0.175, 0.064, 0.028, 0.019, 0.0),
]
def profile(w, t, b, dy):
    """round a section from the keel's right edge: the chine, the shoulder, the roof's edges, back down the left"""
    return [(0.55 * w, -b + dy), (w, -0.1 * b + dy), (0.74 * w, 0.5 * t + dy), (0.3 * w, t + dy),
            (-0.3 * w, t + dy), (-0.74 * w, 0.5 * t + dy), (-w, -0.1 * b + dy), (-0.55 * w, -b + dy)]
PROF = [(z, profile(w, t, b, dy)) for z, w, t, b, dy in SECTIONS]
UNDER = {0, 6, 7}                       # the segments below the chines: thermal blanket

bm = bmesh.new()
rings = [[bm.verts.new((x, y, z)) for x, y in pts] for z, pts in PROF]
for i in range(len(rings) - 1):
    za, zb = PROF[i][0], PROF[i + 1][0]
    for k in range(8):
        f = bm.faces.new((rings[i][k], rings[i][(k + 1) % 8], rings[i + 1][(k + 1) % 8], rings[i + 1][k]))
        mid = (za + zb) / 2
        if k in UNDER or mid > 0.18: f.material_index = 1          # the belly, and the nose cap round to the windscreen
        # the windscreen across the sloping nose, the side windows behind it
        elif 0.15 < mid < 0.18 and k in (2, 3, 4): f.material_index = 2
        elif 0.11 < mid < 0.15 and k in (1, 2, 4, 5): f.material_index = 2
        elif k in (1, 5): f.material_index = 3
tip = bm.verts.new((0, PROF[0][1][3][1] * 0.3 - 0.008, 0.205))
for k in range(8): bm.faces.new((rings[0][(k + 1) % 8], rings[0][k], tip)).material_index = 1
bm.faces.new(list(reversed(rings[-1])))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
hull = mesh_obj("fuselage", bm, [HULL, SHIELD, GLASS, FLANK])

def section_point(z, k):
    """profile point k at z, between the sections either side"""
    for i in range(len(PROF) - 1):
        za, zb = PROF[i][0], PROF[i + 1][0]
        if zb <= z <= za:
            u = (za - z) / (za - zb)
            a, b = V(PROF[i][1][k] + (za,)), V(PROF[i + 1][1][k] + (zb,))
            return a.lerp(b, u)
    raise ValueError(z)

def along_profile(z, ks, lift, r, m, name):
    """a thin rod along the hull's profile at z, over the segments between the points ks, standing `lift` proud"""
    for k0, k1 in zip(ks, ks[1:]):
        a, b = section_point(z, k0), section_point(z, k1)
        out_a = (a - V((0, 0.006, z))).normalized(); out_b = (b - V((0, 0.006, z))).normalized()
        rod(C, m, a + out_a * lift, b + out_b * lift, r, n=5, name=name)

# window frames: round the windscreen and the side windows, and the posts between them
for z in (0.18, 0.15, 0.11):
    ks = (2, 3, 4) if z == 0.18 else (1, 2, 3, 4, 5)
    along_profile(z, ks, 0.0012, 0.0011, FRAME, "window frame")
for k in (1, 2, 4, 5):
    rod(C, FRAME, section_point(0.149, k) + V((0, 0.0008, 0)), section_point(0.111, k) + V((0, 0.0008, 0)), 0.0011, n=5, name="window post")
for k in (2, 4):
    rod(C, FRAME, section_point(0.179, k) + V((0, 0.0008, 0)), section_point(0.151, k) + V((0, 0.0008, 0)), 0.0011, n=5, name="window post")
# panel seams across the upper hull
for z in (0.075, 0.02, -0.04, -0.1, -0.15):
    along_profile(z, (1, 2, 3, 4, 5), 0.0004, 0.0006, M["black"], "seam")

# ---------------------------------------------------------------- the dorsal spine, its hatch and an antenna
slab(HULL, (0.036, 0.012, 0.2), (0, 0.037, -0.055), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 0.05, name="spine", bevel=0.003)
cbm((0, 0.043, 0.005), (0, 1, 0), 0.012)
tube(M["dark"], 0.0105, (0, 0.0415, 0.005), (0, 0.0445, 0.005), n=24, name="hatch")
for s in (-1, 1):
    rod(C, M["black"], V((s * 0.0185, 0.037, 0.04)), V((s * 0.0185, 0.037, -0.15)), 0.0007, n=5, name="seam")
rod(C, M["alu plain"], V((0.008, 0.043, -0.12)), V((0.008, 0.07, -0.13)), 0.0008, n=5, name="antenna")

# ---------------------------------------------------------------- the wings: swept, from the chines, tips drooped
def foil(z_le, z_te, y, th):
    """a thin diamond-ish wing section, leading edge first, round over the top and back under"""
    c = z_le - z_te
    return [(z_le, y), (z_le - 0.3 * c, y + th / 2), (z_le - 0.72 * c, y + th / 3), (z_te, y),
            (z_le - 0.72 * c, y - th / 3), (z_le - 0.3 * c, y - th / 2)]
WING = [  # (x out from the middle, leading edge z, trailing edge z, y, thickness)
    (0.055, -0.005, -0.168, -0.002, 0.011),
    (0.160, -0.100, -0.176, -0.006, 0.006),
    (0.188, -0.122, -0.178, -0.014, 0.0048),
    (0.208, -0.140, -0.179, -0.034, 0.0036),
]
for s in (-1, 1):
    bm = bmesh.new()
    secs = []
    for x, zl, zt, y, th in WING:
        xx = s * x
        secs.append([bm.verts.new((xx, yy, zz)) for zz, yy in foil(zl, zt, y, th)])
    for i in range(len(secs) - 1):
        for k in range(6):
            f = bm.faces.new((secs[i][k], secs[i][(k + 1) % 6], secs[i + 1][(k + 1) % 6], secs[i + 1][k]))
            f.material_index = 0 if k < 3 else 1
    bm.faces.new(secs[-1]); bm.faces.new(list(reversed(secs[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh_obj("wing", bm, [HULL, SHIELD], smooth=20)
    # a seam along the wing, and a dark leading-edge strip
    a, b = V((s * 0.07, -0.002 + 0.0055, -0.06)), V((s * 0.158, -0.006 + 0.003, -0.135))
    rod(C, M["black"], a, b, 0.0006, n=5, name="seam")
    rod(C, FRAME, V((s * 0.06, -0.002, -0.008)), V((s * 0.16, -0.006, -0.101)), 0.0016, n=6, name="leading edge")
    rod(C, FRAME, V((s * 0.16, -0.006, -0.101)), V((s * 0.188, -0.014, -0.123)), 0.0013, n=6, name="leading edge")
    rod(C, FRAME, V((s * 0.188, -0.014, -0.123)), V((s * 0.208, -0.034, -0.141)), 0.0011, n=6, name="leading edge")

# ---------------------------------------------------------------- two canted fins aft
CANT = math.radians(22)
FINS = []
for s in (-1, 1):
    up = V((s * math.sin(CANT), math.cos(CANT), 0))
    side = up.cross(V((0, 0, 1))).normalized()          # across the fin: its thickness
    base = V((s * 0.028, 0.024, 0))
    bm = bmesh.new()
    secs = []
    for h, zl, zt, th in ((0.0, -0.105, -0.172, 0.006), (0.052, -0.15, -0.18, 0.0035)):
        c = zl - zt
        pts = ((zl, 0), (zl - 0.3 * c, th / 2), (zt, 0), (zl - 0.3 * c, -th / 2))
        secs.append([bm.verts.new(base + up * h + side * d + V((0, 0, zz))) for zz, d in pts])
    for i in range(len(secs) - 1):
        for k in range(4):
            bm.faces.new((secs[i][k], secs[i][(k + 1) % 4], secs[i + 1][(k + 1) % 4], secs[i + 1][k]))
    bm.faces.new(secs[-1]); bm.faces.new(list(reversed(secs[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh_obj("fin", bm, [FLANK], smooth=20)
    FINS.append(base + up * 0.052 + V((0, 0, -0.165)))
    rod(C, FRAME, base + up * 0.0 + V((0, 0, -0.105)), base + up * 0.052 + V((0, 0, -0.15)), 0.0013, n=6, name="leading edge")

# ---------------------------------------------------------------- the engine block, three bells, thrusters
slab(M["dark"], (0.118, 0.046, 0.022), (0, 0.004, -0.186), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 1, name="engine block", bevel=0.004)
slab(M["gold"], (0.122, 0.05, 0.004), (0, 0.004, -0.176), (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 0.04, name="engine collar")
for x, y, r in ((0.0, 0.008, 0.016), (-0.04, 0.0, 0.0115), (0.04, 0.0, 0.0115)):
    tube(M["dark"], r * 0.8, (x, y, -0.197), (x, y, -0.2), n=24, name="engine throat")
    tube(M["alu"], r * 0.8, (x, y, -0.2), (x, y, -0.232), n=32, r2=r * 1.45, caps=False, name="engine bell")
    tube(M["black"], r * 0.78, (x, y, -0.201), (x, y, -0.231), n=32, r2=r * 1.42, caps=False, name="engine bell inside")
    tube(THROAT, r * 0.6, (x, y, -0.199), (x, y, -0.2005), n=24, name="engine glow")
def thruster(p, out, along):
    slab(M["dark"], (0.008, 0.008, 0.014), p, (out, out.cross(along), along), 1, name="rcs block", bevel=0.001)
    for d in (out, along, -along):
        tube(M["black"], 0.0014, p + d * 0.005, p + d * 0.009, n=8, r2=0.0022, caps=False, name="rcs nozzle")
for s in (-1, 1):
    thruster(V((s * 0.036, 0.004, 0.158)), V((s, 0, 0)), V((0, 0, 1)))
    thruster(V((s * 0.066, 0.016, -0.158)), V((s, 0.4, 0)).normalized(), V((0, 0, 1)))
# a few belly fittings: a gear-door seam and two antennas
for s in (-1, 1):
    rod(C, M["black"], V((s * 0.016, -0.0215, 0.09)), V((s * 0.016, -0.0215, 0.02)), 0.0006, n=5, name="seam")
rod(C, M["black"], V((-0.016, -0.0215, 0.09)), V((0.016, -0.0215, 0.09)), 0.0006, n=5, name="seam")
rod(C, M["black"], V((-0.016, -0.0215, 0.02)), V((0.016, -0.0215, 0.02)), 0.0006, n=5, name="seam")

# ---------------------------------------------------------------- its lights: nav lights at the tips, strobes
L = coll("shuttle lights")
RED, GREEN, WHITE = glowing("shuttle red", "#ff2a1a", 12.0), glowing("shuttle green", "#22ff66", 12.0), glowing("shuttle strobe", "#ffffff", 14.0)
lights = [sphere(L, RED, 0.0028, at=(0.209, -0.035, -0.162), n=8, name="nav port"),
          sphere(L, GREEN, 0.0028, at=(-0.209, -0.035, -0.162), n=8, name="nav starboard")]
for p in FINS: lights.append(sphere(L, WHITE, 0.0022, at=p + V((0, 0.003, 0)), n=8, name="strobe"))
lights.append(sphere(L, WHITE, 0.0024, at=(0, -0.023, -0.06), n=8, name="strobe"))

textured(C, 0.05, {"mmod blanket": 0.12, "gold foil": 0.03, "silver foil": 0.03})
apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C) + tri_count(L))

# ---------------------------------------------------------------- the shot
def aim(o, at, up=V((0, 1, 0))):
    """points the camera at `at`, the craft's top (+y) up in the frame"""
    p = o.location.copy()
    f = (V(at) - p).normalized(); r = f.cross(up).normalized(); u = r.cross(f)
    m = Matrix((r, u, -f)).transposed().to_4x4(); m.translation = p
    o.matrix_world = m

if MODE == "preview":
    w = SC.world or bpy.data.worlds.new("World"); SC.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.8, 0.86, 1.0, 1); bg.inputs["Strength"].default_value = 0.07
    cam = bpy.data.cameras.new("shuttle cam"); cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("shuttle cam", cam); SC.collection.objects.link(co); SC.camera = co
    sun = bpy.data.lights.new("shuttle sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("shuttle sun", sun); SC.collection.objects.link(so)
    # the harness's sun in the craft's frame (its top +y): above, ahead and to its starboard
    so.rotation_euler = V((-0.6, 0.62, 0.5)).to_track_quat("Z", "Y").to_euler()
    try: SC.view_settings.view_transform = "Khronos PBR Neutral"
    except Exception as e: print("view transform", e)
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"; prefs.get_devices()
        for d in prefs.devices: d.use = True
        SC.cycles.device = "GPU"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        SC.render.resolution_x, SC.render.resolution_y = 1280, 800
        # three-quarters from ahead and above its port side; and from behind, below its starboard side
        for name, at in (("shuttle-preview", (0.62, 0.42, 0.52)), ("shuttle-preview-2", (-0.6, -0.3, -0.62))):
            co.location = V(at).normalized() * 1.05; aim(co, (0, 0, -0.01))
            SC.render.filepath = OUT + name + ".png"
            bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "shuttle-ao.png", size=1024, samples=96, distance=0.04)
    body.name = "shuttle"
    lit = join([o for o in L.all_objects if o.type == "MESH"], "shuttle lights")
    root = bpy.data.objects.new("shuttle root", None); C.objects.link(root)
    body.parent = root; lit.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, lit): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "shuttle.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
