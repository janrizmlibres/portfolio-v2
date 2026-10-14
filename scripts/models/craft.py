"""A supply craft (Work's breakthroughs, home-build round 2): Janriz, 2026-10-11, agreed that each AI breakthrough is a
supply craft passing close by home while Work builds it, the ones he built with docking at the hub for a moment. A real
cargo craft's plan (Cygnus): a pressurised cargo module in white blankets, its nose narrowing to a docking ring; a
service module behind it in gold foil, an engine bell aft and four thruster quads; two round fan solar arrays on short
booms either side. Built from the station's own materials and helpers (station.py), at the station's scale (its ring
has a radius of 1, a module's is 0.078), so it docks at the hub's forward port as it is. Run headless
(`scripts/models/build.sh craft`).

Blender's +z is the craft's nose; its origin is the middle of its docking ring's face. The strobe is its own node (the
site blinks it).

CRAFT_MODE: "preview" (Cycles, one camera), "site" (bakes occlusion, writes out/craft.raw.glb). In a live Blender, run
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
    sc = bpy.data.scenes.get("craft") or bpy.data.scenes.new("craft")
    bpy.context.window.scene = sc
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    clear()
SC = bpy.context.scene
C = coll("craft")
# the station's materials and geometry helpers (tube, slab, handrail, cbm, grapple, window)
src = open(HERE + "station.py").read()
exec(src[src.index("# ---------------------------------------------------------------- materials"): src.index("# ---------------------------------------------------------------- the ring")])

PR, SR = 0.0556, 0.058          # the cargo module's radius and the service module's (about 1.5 m and 1.6 m)
NOSE, BODY, SM = 0.03, 0.19, 0.055
z_body = -NOSE                  # the cargo module's body runs from here aft
z_sm = z_body - BODY            # the service module from here aft

# ---------------------------------------------------------------- the cargo module and its nose
tube(M["blanket"], PR, (0, 0, z_sm), (0, 0, z_body), n=56, tile=0.16, caps=False, name="cargo module")
for z in (z_sm + 0.004, z_sm + BODY * 0.5, z_body - 0.004):
    tube(M["alu plain"], PR * 1.012, (0, 0, z - 0.003), (0, 0, z + 0.003), n=56, caps=False, name="cargo seam")
tube(M["blanket"], PR, (0, 0, z_body), (0, 0, -0.006), n=56, tile=0.08, r2=0.036, caps=False, name="nose cone")
cbm((0, 0, -0.002), (0, 0, 1), 0.034)
tube(M["dark"], 0.03, (0, 0, -0.006), (0, 0, 0.0), n=40, name="docking hatch")
grapple(V((PR + 0.001, 0, z_sm + BODY * 0.7)), V((1, 0, 0)))
for s in (-1, 1):
    handrail(V((0, s * PR * 0.98, z_sm + 0.02)), V((0, s * PR * 0.98, z_body - 0.02)), V((0, s, 0)))

# ---------------------------------------------------------------- the service module: gold foil, an engine aft
def prism(m, r, z0, z1, n, name):
    """an n-sided prism round z from z0 to z1, flat-shaded, box-projected UVs"""
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=z1 - z0, location=(0, 0, (z0 + z1) / 2))
    o = bpy.context.object; o.name = name
    o.rotation_euler = (0, 0, math.pi / n)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    link(o, C)
    o.data.materials.append(m)
    cube_uv(o, 0.08)
    return o

prism(M["gold"], SR, z_sm - SM, z_sm, 8, "service module")
tube(M["silver"], SR * 0.98, (0, 0, z_sm - SM - 0.006), (0, 0, z_sm - SM), n=48, tile=0.06, name="aft deck")
tube(M["dark"], 0.012, (0, 0, z_sm - SM - 0.006), (0, 0, z_sm - SM - 0.012), n=24, name="engine throat")
tube(M["dark"], 0.012, (0, 0, z_sm - SM - 0.012), (0, 0, z_sm - SM - 0.034), n=32, r2=0.024, caps=False, name="engine bell")
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    d = V((math.cos(a), math.sin(a), 0)); t = V((-math.sin(a), math.cos(a), 0))
    p = d * (SR + 0.006) + V((0, 0, z_sm - SM * 0.5))
    slab(M["dark"], (0.012, 0.012, 0.012), p, (d, t, V((0, 0, 1))), 1, name="rcs block", bevel=0.0015)
    for e in (V((0, 0, 1)), V((0, 0, -1)), t, -t):
        tube(M["black"], 0.0022, p + e * 0.006, p + e * 0.012, n=10, r2=0.0036, caps=False, name="rcs nozzle")

# ---------------------------------------------------------------- two round fan arrays, on booms either side
def fan(c, normal, along, r, gores=10, name="fan array"):
    """a round fan array: gores of cells round a hub, folded slightly up and down in turn as a fan's pleats are, a spar
    between each pair"""
    n = V(normal).normalized(); u = V(along).normalized(); w = n.cross(u)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    hub = bm.verts.new(c)
    rim = []
    for g in range(gores * 2):
        a = 2 * math.pi * g / (gores * 2)
        fold = (0.012 * r) * (1 if g % 2 else -1)       # the pleats: every other rim point a little off the plane
        rim.append(bm.verts.new(c + (u * math.cos(a) + w * math.sin(a)) * r + n * fold))
    for g in range(gores * 2):
        f = bm.faces.new((hub, rim[g], rim[(g + 1) % (gores * 2)]))
        for loop in f.loops:
            p = loop.vert.co - c
            loop[uvl].uv = (p.dot(u) / (r * 2) + 0.5, p.dot(w) / (r * 2) + 0.5)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); C.objects.link(o)
    me.materials.append(M["solar"])
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_flat()
    # the back of a fan is its bare blanket: a copy, a hair behind, facing the other way
    back = o.copy(); back.data = o.data.copy(); back.name = name + " back"; C.objects.link(back)
    back.data.materials[0] = M["dark"]
    back.location = n * -0.0015
    bm = bmesh.new(); bm.from_mesh(back.data); bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(back.data); bm.free()
    for g in range(0, gores * 2, 2):
        a = 2 * math.pi * g / (gores * 2)
        rod(C, M["alu plain"], c + n * 0.001, c + (u * math.cos(a) + w * math.sin(a)) * r + n * 0.001, 0.0011, n=5, name="fan spar")
    tube(M["dark"], 0.006, c - n * 0.004, c + n * 0.004, n=20, name="fan hub")
    return o

FR = 0.067                       # a fan's radius (about 3.7 m across, as Cygnus's are)
for s in (-1, 1):
    root = V((s * SR * 0.92, 0, z_sm - SM * 0.5))
    tip = V((s * (SR + 0.022), 0, z_sm - SM * 0.5))
    rod(C, M["alu plain"], root, tip, 0.0025, n=8, name="array boom")
    slab(M["dark"], (0.008, 0.014, 0.014), tip, (V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))), 1, name="array drive", bevel=0.001)
    # each fan stands out sideways, both faced the same way (to its star, as a craft turns them)
    fan(V((s * (SR + 0.022 + FR), 0, z_sm - SM * 0.5)), (0, -1, 0), (0, 0, 1), FR)

# ---------------------------------------------------------------- an antenna, and its strobe
p = V((0, -SR * 0.9, z_sm - SM * 0.3))
rod(C, M["alu plain"], p, p + V((0, -0.03, 0)), 0.0015, n=6, name="antenna mast")
dish(C, M["radiator"], 0.012, 0.004, at=p + V((0, -0.032, 0)), facing=V((0, -1, 0.4)).normalized(), n=24, k=6, thick=0.0015, name="antenna dish")
STROBE = coll("craft strobe")
light = plain("craft strobe", "#202020", 0.0, 0.4)
b = next(n for n in light.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
b.inputs["Emission Color"].default_value = srgb("#ffffff"); b.inputs["Emission Strength"].default_value = 10.0
strobe = sphere(STROBE, light, 0.0022, at=(0, SR * 0.95, z_sm - SM * 0.2), n=8, name="craft strobe")

apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C))

# ---------------------------------------------------------------- the shot
def aim(o, at):
    o.rotation_euler = (V(at) - o.location).to_track_quat("-Z", "Y").to_euler()

if MODE == "preview":
    cam = bpy.data.cameras.new("craft cam"); cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("craft cam", cam); SC.collection.objects.link(co); SC.camera = co
    co.location = V((0.42, -0.36, 0.12)); aim(co, (0, 0, -0.11))
    sun = bpy.data.lights.new("craft sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("craft sun", sun); SC.collection.objects.link(so)
    so.rotation_euler = V((-0.6, -0.5, 0.62)).to_track_quat("Z", "Y").to_euler()
    if not globals().get("LIVE"):
        SC.render.engine = "CYCLES"; SC.cycles.samples = int(os.environ.get("SAMPLES", "48")); SC.cycles.use_denoising = True
        SC.render.resolution_x, SC.render.resolution_y = 1440, 900
        SC.render.filepath = OUT + "craft-preview.png"
        bpy.ops.render.render(write_still=True)
elif MODE == "site":
    body, image = bake_ao(C, OUT + "craft-ao.png", size=1024, samples=96, distance=0.06)
    body.name = "craft"
    root = bpy.data.objects.new("craft root", None); C.objects.link(root)
    body.parent = root; strobe.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, body, strobe): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "craft.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("exported")
