"""The crawler's pipeline at full size, made to the station's and relay's standard (Janriz picked it on 2026-10-13, after
asking "is the realism factor alright, the same that we did for the ship, relay, and Tycho?"). Run headless, its own
Blender process (`scripts/models/build.sh pipeline`).

Built in Blender's units with +z up (+y in three); each ring's outer radius is 1 and its centre the origin, so the site
places and scales each one on its own (folded inside the crawler, then dropped to its place in the shaft).

Every stage has the same bulkhead, so the stages differ by their colour and fixture alone; the site gives each ring its
own copy of the parts it wears:
- `bulkhead`: a machined aluminium frame in the station's quilted blankets, its stage's light a run of opal diffusers in
  a recessed channel (material `channel`, which the site lights), bolted lips, a clevis fitting where each longeron meets
  it, avionics boxes in gold foil with their harness, handrails. `tag<k>` is stage k's name, stencilled on its top face.
- the fixtures (`fix_<name>`), each its stage's work:
  - `store` (Start, Save): a rack of six rails round the stack of records, its shelf tabs, three flanged hoops, a
    turntable, three spokes to the bore with their braces, its drive in gold foil;
  - `search` (Search): twelve dish antennas on booms off the top lip, each with ribs on its back, its feed horn on three
    struts at the focus and a coax line back to the ring;
  - `press` (Extract): a die press, four jaws whose hardened platens are the square a page leaves through, each driven by
    two hydraulic rams off the bore and kept square by two guide bars;
  - `comparator` (each Dedup): a twin ring hung under the bulkhead, its outer race turning on the fixed inner one, a ring
    gear round it driven by a pinion, an encoder's scale read by two heads;
  - `heaters` (Enrich): ten infrared emitters round the bore, each a coiled filament (material `heater`, which the site
    warms) in a quartz sleeve, in a gold reflector trough (material `reflector`, which the site warms a little), on
    ceramic end blocks with their leads, held off the bore on two arms;
  - `deck` (Report): an instrument deck cantilevered off the ring, box beams and ribs, black panels on top and gold foil
    under, brackets with knee braces and tie rods, a handrail.
- `bar0`..`bar4`: the report's bars, each a telescoping mast of five nested sections the site raises (the base stands on
  the deck), the top one banded with a light (material `barlight`, which the site lights in its stage's colour).
- the mast (`mast_longeron`, `mast_hinge`, `mast_batten`, `mast_cable`, `mast_turnbuckle`): a deployable truss as
  NuSTAR's, its longerons hinged at mid-bay, a batten frame there, and tensioned diagonal cables with turnbuckles. Each
  piece is authored at the origin in ring units, one unit long where it's stretched, for the site to instance.

MODE: "preview" (Cycles stills of every stage, and the deck with its bars raised), "site" (bakes occlusion per part,
writes out/pipeline.raw.glb).
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)) + "/"
exec(open(HERE + "shiplib.py").read())
V = Vector
TEX = HERE + "tex/"
OUT = HERE + "out/"
os.makedirs(OUT, exist_ok=True)
MODE = os.environ.get("MODE", "preview")

# each stage, in the pipeline's order (lib/content/voyage.ts's PIPELINE): its name stencilled on its ring, its fixture,
# what its ring is fitted out for, and the ring's height
STAGES = [
    ("START", "store", "database", 0.12),
    ("SEARCH", "search", "antenna", 0.1),
    ("STAGE 1", "press", "press", 0.16),
    ("STAGE 2", "comparator", "compute", 0.12),
    ("STAGE 3", "heaters", "power", 0.12),
    ("STAGE 4", "comparator", "compute", 0.12),
    ("STAGE 5", "store", "database", 0.12),
    ("REPORT", "deck", "instrument", 0.12),
]
# the rings built: the second dedup wears the first's (the same job; the site maps it, pipeline.ts)
RINGS = [0, 1, 2, 3, 4, 6, 7]
RIN = 0.84                   # the bulkhead's bore
LONG = [math.radians(a) for a in (90, 210, 330)]   # where the mast's three longerons meet each ring
EDGE = 1.04                                        # where the longerons stand, off the ring's centre
# the site's own numbers: a magazine's stack (MAG in pipeline.ts), the report's bars (report.ts)
MAG_Y0, MAG_DY, MAG_N = -0.27, 0.046, 12
BAR_ARC, BAR_R, DECK_Z = [-0.42, -0.14, 0.14, 0.42], 1.5, -0.035
NB, BL = 5, 0.3              # a bar's sections, and each one's height


# ================================================================ shapes
_join = join


def join(objs, name):
    """joins parts into one, each part's own modifiers (bevels, a dish's thickness) applied first: a join keeps only the
    active part's, and they'd then apply to the whole"""
    for o in objs:
        if not o or not o.modifiers: continue
        bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=md.name)
            except Exception: o.modifiers.remove(md)
    return _join(objs, name)


def lathe(c, m, prof, n=96, name="lathe"):
    """a solid of revolution round z from (r, z) points, closed"""
    bm = bmesh.new()
    rings = [[bm.verts.new((r * math.cos(2 * math.pi * j / n), r * math.sin(2 * math.pi * j / n), z)) for j in range(n)] for r, z in prof]
    for i in range(len(prof)):
        a, b = rings[i], rings[(i + 1) % len(prof)]
        for j in range(n):
            bm.faces.new((a[j], a[(j + 1) % n], b[(j + 1) % n], b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return _finish(o, m, c, smooth=40)


def band(c, m, r0, r1, z0, z1, n=128, name="band"):
    """a ring of rectangular section"""
    return lathe(c, m, [(r0, z0), (r1, z0), (r1, z1), (r0, z1)], n=n, name=name)


def sector(c, m, r0, r1, z0, z1, a0, a1, n=32, name="sector", smooth=30):
    """a solid annular sector between radii r0 and r1, heights z0 and z1, angles a0 to a1"""
    bm = bmesh.new()
    vs = [[bm.verts.new((r * math.cos(a0 + (a1 - a0) * i / n), r * math.sin(a0 + (a1 - a0) * i / n), z)) for r, z in ((r0, z0), (r1, z0), (r1, z1), (r0, z1))] for i in range(n + 1)]
    for i in range(n):
        for j in range(4): bm.faces.new((vs[i][j], vs[i][(j + 1) % 4], vs[i + 1][(j + 1) % 4], vs[i + 1][j]))
    bm.faces.new(vs[0]); bm.faces.new(list(reversed(vs[n])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return _finish(o, m, c, smooth=smooth)


def cone(c, m, a, b, ra, rb, n=12, name="cone"):
    """a truncated cone from a (radius ra) to b (radius rb)"""
    a, b = V(a), V(b); d = b - a
    o = cyl(c, m, ra, d.length, at=(a + b) / 2, n=n, name=name, r2=rb)
    o.rotation_mode = "QUATERNION"; o.rotation_quaternion = V((0, 0, 1)).rotation_difference(d.normalized())
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return o


def disc(c, m, r, thick, at, normal, n=12, name="disc"):
    """a short cylinder of radius r centred at `at`, its axis along `normal`"""
    nn = V(normal).normalized()
    return rod(c, m, V(at) - nn * thick / 2, V(at) + nn * thick / 2, r, n=n, name=name)


def tag(c, m, text, size, at, rot_z, lift=0.0005, extrude=0.0015, name="tag"):
    bpy.ops.object.text_add(location=(0, 0, 0))
    tx = bpy.context.object; tx.data.body = text; tx.data.size = size; tx.data.align_x = "CENTER"; tx.data.extrude = extrude
    bpy.ops.object.convert(target="MESH")
    tx = bpy.context.object; tx.name = name
    tx.matrix_world = Matrix.Translation(V(at) + V((0, 0, lift))) @ Matrix.Rotation(rot_z, 4, "Z")
    tx.data.materials.clear(); tx.data.materials.append(m)
    link(tx, c)
    return tx


def ring_of(r, a, z):
    return V((r * math.cos(a), r * math.sin(a), z))


def frame_at(a):
    """the radial and tangential directions at angle a"""
    return V((math.cos(a), math.sin(a), 0)), V((-math.sin(a), math.cos(a), 0))


def off_long(a, w):
    """whether angle a is within w (radians) of a longeron"""
    return min(abs(((a - L + math.pi) % (2 * math.pi)) - math.pi) for L in LONG) < w


def hexbolt(c, M, at, normal=(0, 0, 1), r=0.0075, washer=True):
    """a hex head, on a washer unless it's small, its axis along `normal`"""
    n = V(normal).normalized()
    R = Matrix.Translation(V(at)) @ V((0, 0, 1)).rotation_difference(n).to_matrix().to_4x4()
    h = cyl(c, M["bolt"], r, 0.0052, n=6, name="bolt")
    h.matrix_world = R @ Matrix.Translation((0, 0, 0.0034 if washer else 0.0026))
    if not washer: return [h]
    w = cyl(c, M["alu"], r * 1.45, 0.0016, n=8, name="washer")
    w.matrix_world = R
    return [w, h]


def helix(c, m, r, wire, z0, z1, turns, at, per=8, name="helix"):
    """a coiled wire along z from z0 to z1 round `at`, as a curve swept round a circle"""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    n = int(turns * per)
    sp.points.add(n)
    for i in range(n + 1):
        th = 2 * math.pi * turns * i / n
        sp.points[i].co = (at.x + r * math.cos(th), at.y + r * math.sin(th), z0 + (z1 - z0) * i / n, 1)
    cu.bevel_depth = wire; cu.bevel_resolution = 0; cu.use_fill_caps = False
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object
    return _finish(o, m, c, smooth=60)


def trough(c, m, R, z0, z1, at, facing, thick=0.0025, n=18, name="trough"):
    """a half-cylinder reflector of radius R from z0 to z1, its open side towards `facing`, a lip at each edge"""
    f = V(facing).normalized(); s = V((-f.y, f.x, 0))
    bm = bmesh.new()
    cols = []
    for i in range(n + 1):
        th = math.pi * i / n          # from one edge, round the back, to the other
        d = s * math.cos(th) - f * math.sin(th)
        cols.append([bm.verts.new(at + d * R + V((0, 0, z))) for z in (z0, z1)])
    for i in range(n):
        bm.faces.new((cols[i][0], cols[i + 1][0], cols[i + 1][1], cols[i][1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    sol = o.modifiers.new("solid", "SOLIDIFY"); sol.thickness = thick; sol.offset = 1
    return _finish(o, m, c, smooth=50)


# ================================================================ materials
def principled(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m, nt, b


def img(nt, path, color=True):
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path, check_existing=True)
    if not color: t.image.colorspace_settings.name = "Non-Color"
    return t


def surface(name, tex, metal=0.0, normal=1.0, tint=None):
    """one of the station's surfaces (tex.py's maps), its metalness a value where it has no map of its own"""
    m, nt, b = principled(name)
    col = img(nt, TEX + tex + "-color.png").outputs["Color"]
    if tint:
        mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs["Factor"].default_value = 1.0
        nt.links.new(col, mul.inputs["A"]); mul.inputs["B"].default_value = srgb(tint)
        col = mul.outputs["Result"]
    nt.links.new(col, b.inputs["Base Color"])
    nt.links.new(img(nt, TEX + tex + "-rough.png", False).outputs["Color"], b.inputs["Roughness"])
    if os.path.exists(TEX + tex + "-metal.png"):
        nt.links.new(img(nt, TEX + tex + "-metal.png", False).outputs["Color"], b.inputs["Metallic"])
    else:
        b.inputs["Metallic"].default_value = metal
    if os.path.exists(TEX + tex + "-normal.png"):
        nm = img(nt, TEX + tex + "-normal.png", False)
        nn = nt.nodes.new("ShaderNodeNormalMap"); nn.inputs["Strength"].default_value = normal
        nt.links.new(nm.outputs["Color"], nn.inputs["Color"]); nt.links.new(nn.outputs["Normal"], b.inputs["Normal"])
    return m


def plain(name, rgb, metal=0.0, rough=0.5, emit=None, strength=0.0, alpha=1.0):
    m, nt, b = principled(name)
    b.inputs["Base Color"].default_value = srgb(rgb)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit); b.inputs["Emission Strength"].default_value = strength
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        try: m.surface_render_method = "BLENDED"
        except Exception: m.blend_method = "BLEND"
    return m


def mats():
    # every material a shade apart from the rest: the compressor merges identical ones, and the site finds each by name.
    # Fittings mostly diffuse, as on the station: a mirror metal in space reflects black
    return {
        "machined": surface("machined", "alu", metal=0.55, normal=0.35),
        "blanket": surface("mmod blanket", "blanket", normal=1.0),
        "gold": surface("gold foil", "gold", metal=0.35, normal=0.45),
        "alu": plain("aluminium plain", "#a9acb1", 0.4, 0.48),
        "dark": plain("dark metal", "#3a3c41", 0.6, 0.4),
        "black": plain("black anodised", "#18191c", 0.3, 0.55),
        "bolt": plain("bolt", "#9a9ea6", 0.6, 0.36),
        "rail": plain("handrail", "#c79a3e", 0.0, 0.45),
        "paint": plain("stencil", "#1c1d21", 0.0, 0.62),
        # the diffusers: opal acrylic, grey in the channel's shade until the site lights it in its stage's colour
        "channel": plain("channel", "#6f747b", 0.0, 0.28),
        # the bars' lights, the same opal, lit by the site in their stages' colours
        "barlight": plain("barlight", "#71767d", 0.0, 0.29),
        # the heaters: the filament (the site warms it), the trough it sits in, the end blocks, the quartz round it
        "heater": plain("heater", "#3b2c24", 0.5, 0.45),
        "reflector": plain("reflector", "#d9ab52", 1.0, 0.16),
        "ceramic": plain("ceramic", "#e4e1da", 0.0, 0.66),
        "quartz": plain("quartz", "#f4f1ea", 0.0, 0.04, alpha=0.16),
        "lead": plain("lead", "#6b4a35", 0.7, 0.42),
        # the search's dishes, painted white as an antenna's are
        "white": plain("dish white", "#d9dbdf", 0.0, 0.42),
        # Enrich's radiators, white paint
        "radiator": plain("radiator", "#e6e6e1", 0.0, 0.5),
        # the press: tool steel, its ground platens, chrome rams, hydraulic hose
        "steel": plain("tool steel", "#50545b", 0.7, 0.34),
        "platen": plain("platen", "#9ea2a9", 0.6, 0.22),
        "chrome": plain("chrome", "#cdd0d5", 0.85, 0.15),
        "hose": plain("hose", "#1e1f22", 0.0, 0.72),
        # the comparator's encoder scale
        "encoder": plain("encoder", "#b7bbc2", 0.7, 0.26),
        # the mast
        # carbon-fibre longerons and battens, as a deployable mast's are: dark, so the truss never reads as white lines
        "longeron": plain("longeron", "#3e4147", 0.35, 0.5),
        "node": plain("node", "#2f3135", 0.55, 0.42),
        "cable": plain("cable", "#25262a", 0.3, 0.62),
    }


# ================================================================ the rings: one bulkhead, fitted out for each stage's work
def spans(a0, a1, clear=0.075):
    """the stretches of a0..a1 clear of the longerons' fittings"""
    segs, lo = [], a0
    for L in LONG:
        Lm = (L - a0) % (2 * math.pi) + a0
        if a0 < Lm < a1:
            segs.append((lo, Lm - clear)); lo = Lm + clear
    segs.append((lo, a1))
    return [(s0, s1) for s0, s1 in segs if s1 - s0 > 0.02]


def clad(c, M, kind, H):
    """the outer face between each lip and the channel: the station's blankets; drive bays on the database's rings (both
    bands of Save's, which stores, the top one of Start's); gold foil round the report's electronics;
    close-fitting machined panels round the dedups' compute; or blankets under white radiator fins, shedding Enrich's
    heat, a coolant loop through them"""
    parts = []
    bands = ((0.022, H / 2 - 0.016), (-H / 2 + 0.016, -0.022))
    for b, (z0, z1) in enumerate(bands):
        for j in range(12):
            for s0, s1 in spans(2 * math.pi * j / 12 + 0.012, 2 * math.pi * (j + 1) / 12 - 0.012):
                if kind == "bays" or (kind == "bay" and b == 0):
                    # drive bays: a dark faceplate each, a gap between, its handle, its status light (material
                    # `channel`, lit in its stage's colour)
                    n = max(1, int((s1 - s0) / 0.052))
                    for i in range(n):
                        a0 = s0 + (s1 - s0) * i / n + 0.004
                        a1 = s0 + (s1 - s0) * (i + 1) / n - 0.004
                        am = (a0 + a1) / 2
                        d, t = frame_at(am)
                        parts.append(sector(c, M["black"], 0.966, 0.99, z0 + 0.001, z1 - 0.001, a0, a1, n=2, name="bay"))
                        parts.append(rod(c, M["bolt"], ring_of(0.993, am, z1 - 0.006) + t * -0.012, ring_of(0.993, am, z1 - 0.006) + t * 0.012, 0.0018, n=4, name="handle"))
                        parts.append(box(c, M["channel"], (0.003, 0.006, 0.004), at=ring_of(0.991, am, z0 + 0.006) + t * 0.014, rot=(0, 0, am), name="status"))
                    continue
                if kind == "panel":
                    parts.append(sector(c, M["machined"], 0.968, 0.986, z0, z1, s0, s1, n=10, name="panel"))
                    for aa in (s0 + 0.012, s1 - 0.012):
                        for z in (z0 + 0.006, z1 - 0.006):
                            parts.append(disc(c, M["bolt"], 0.003, 0.002, ring_of(0.987, aa, z), frame_at(aa)[0], n=6, name="screw"))
                    continue
                parts.append(sector(c, M["gold" if kind == "gold" else "blanket"], 0.968, 0.992, z0, z1, s0, s1, n=12, name="blanket"))
                if kind == "radiator":
                    n = max(2, int((s1 - s0) / 0.045))
                    for i in range(n + 1):
                        aa = s0 + 0.01 + (s1 - s0 - 0.02) * i / n
                        parts.append(box(c, M["radiator"], (0.034, 0.003, z1 - z0 - 0.004), at=ring_of(1.007, aa, (z0 + z1) / 2), rot=(0, 0, aa), name="fin"))
        if kind == "radiator":
            zm = (z0 + z1) / 2
            parts.append(band(c, M["radiator"], 0.993, 0.999, zm - 0.003, zm + 0.003, n=128, name="coolant"))
    return parts


def top_spots():
    """the middle of each stretch of the top face between the fittings, where a stage's equipment stands"""
    return [L + math.pi / 3 for L in LONG]


def kit_database(c, M, H, k):
    """Start and Save (the database): drive bays round the outer face (clad), and storage controllers racked on the top
    face, plugged into a bus behind them; Save, which stores the records, has more of both"""
    parts = []
    up, z = V((0, 0, 1)), H / 2
    n = 4 if k == 6 else 2
    for am in top_spots():
        for i in range(n):
            a = am + (i - (n - 1) / 2) * 0.062
            d, t = frame_at(a)
            p = ring_of(0.93, a, z + 0.026)
            parts.append(box(c, M["alu"], (0.054, 0.038, 0.052), at=p, rot=(0, 0, a), bevel=0.003, name="module"))
            parts.append(box(c, M["black"], (0.004, 0.032, 0.044), at=p + d * 0.028, rot=(0, 0, a), name="faceplate"))
            for s in (-1, 1):
                parts.append(rod(c, M["rail"], p + d * 0.03 + t * s * 0.011 + up * 0.012, p + d * 0.038 + t * s * 0.011 + up * 0.012, 0.0024, n=5, name="handle"))
            parts.append(rod(c, M["rail"], p + d * 0.038 + t * -0.011 + up * 0.012, p + d * 0.038 + t * 0.011 + up * 0.012, 0.0024, n=5, name="handle"))
        h = (n - 1) / 2 * 0.062 + 0.04
        parts.append(sector(c, M["dark"], 0.893, 0.904, z, z + 0.016, am - h, am + h, n=12, name="bus"))
    return parts


def kit_antenna(c, M, H, k):
    """Search (the antenna): a lighter ring, a waveguide round its top face with a branch out to each dish's clamp, and
    RF amplifiers in gold foil under finned lids"""
    parts = []
    z = H / 2
    for j in range(3):
        for s0, s1 in spans(LONG[j] + 0.1, LONG[j] + 2 * math.pi / 3 - 0.1, clear=0.1):
            parts.append(sector(c, M["alu"], 0.944, 0.958, z, z + 0.01, s0, s1, n=24, name="waveguide"))
            nf = int((s1 - s0) / 0.21)
            for i in range(nf + 1):
                aa = s0 + (s1 - s0) * i / max(1, nf)
                parts.append(box(c, M["dark"], (0.022, 0.006, 0.016), at=ring_of(0.951, aa, z + 0.005), rot=(0, 0, aa), name="flange"))
    for j in range(12):
        a = 2 * math.pi * (j + 0.5) / 12
        parts.append(box(c, M["alu"], (0.024, 0.012, 0.01), at=ring_of(0.968, a, z + 0.005), rot=(0, 0, a), name="branch"))
    for am in top_spots():
        d, t = frame_at(am)
        p = ring_of(0.905, am, z + 0.016)
        parts.append(box(c, M["gold"], (0.046, 0.09, 0.032), at=p, rot=(0, 0, am), bevel=0.003, name="amplifier"))
        for i in range(6):
            parts.append(box(c, M["dark"], (0.04, 0.003, 0.012), at=p + t * (-0.035 + 0.014 * i) + V((0, 0, 0.022)), rot=(0, 0, am), name="fin"))
    return parts


def kit_press(c, M, H, k):
    """Extract (the press): a heavier ring, ribbed (bulkhead), and the press's hydraulics on its top face: an accumulator
    on saddles at each stretch, a pump at one, hoses over the bore's edge to the press's manifolds"""
    parts = []
    up, z = V((0, 0, 1)), H / 2
    for j, am in enumerate(top_spots()):
        d, t = frame_at(am)
        p = ring_of(0.925, am, z + 0.024)
        parts.append(capsule(c, M["alu"], 0.017, 0.07, p, axis=t, n=16, name="accumulator"))
        for s in (-1, 1):
            parts.append(box(c, M["dark"], (0.04, 0.012, 0.016), at=p + t * s * 0.03 - up * 0.016, rot=(0, 0, am), name="saddle"))
        if j == 1:
            q = ring_of(0.925, am + 0.16, z + 0.024)
            parts.append(box(c, M["gold"], (0.05, 0.06, 0.044), at=q, rot=(0, 0, am + 0.16), bevel=0.003, name="pump"))
            parts.append(rod(c, M["dark"], q + frame_at(am + 0.16)[1] * 0.03, q + frame_at(am + 0.16)[1] * 0.06, 0.016, n=14, name="motor"))
        # to the nearest of the press's manifolds (at the jaws' angles, press())
        th = round(am / (math.pi / 2)) * (math.pi / 2)
        wall = math.sqrt(RIN ** 2 - 0.2 ** 2)
        mani = ring_of(wall - 0.03, th, 0.086)
        for s in (-1, 1):
            e = p + t * s * 0.05
            mid = ring_of(0.852, (am + th) / 2 + s * 0.02, z + 0.008)
            parts.append(rod(c, M["hose"], e, mid, 0.004, n=6, name="hose"))
            parts.append(rod(c, M["hose"], mid, mani + frame_at(th)[1] * s * 0.012, 0.004, n=6, name="hose"))
    return parts


def kit_compute(c, M, H, k):
    """the dedups (compute: the similarity check): processors under finned heat sinks at each stretch, and the fibre
    bundle linking them round the top face"""
    parts = []
    up, z = V((0, 0, 1)), H / 2
    for L, am in zip(LONG, top_spots()):
        for o in (-0.085, 0.085):
            a = am + o
            d, t = frame_at(a)
            p = ring_of(0.922, a, z + 0.014)
            parts.append(box(c, M["black"], (0.06, 0.07, 0.026), at=p, rot=(0, 0, a), bevel=0.003, name="processor"))
            for i in range(8):
                parts.append(box(c, M["alu"], (0.052, 0.0025, 0.02), at=p + t * (-0.029 + 0.0083 * i) + up * 0.023, rot=(0, 0, a), name="heatsink"))
        a1 = L + 2 * math.pi / 3 - 0.09
        prev = None
        for i in range(13):
            aa = am + 0.13 + (a1 - am - 0.13) * i / 12
            pt = ring_of(0.95, aa, z + 0.006)
            if prev is not None:
                for o in (-0.006, 0, 0.006):
                    parts.append(rod(c, M["hose" if o else "encoder"], prev + (prev - V((0, 0, prev.z))).normalized() * o, pt + (pt - V((0, 0, pt.z))).normalized() * o, 0.0024, n=5, name="fibre"))
            if i % 3 == 0:
                parts.append(box(c, M["black"], (0.022, 0.008, 0.006), at=pt, rot=(0, 0, aa), name="tiedown"))
            prev = pt
    return parts


def kit_power(c, M, H, k):
    """Enrich (power): radiators on its outer face (clad), and at each stretch a power conditioner in gold foil, its thick
    cables over the bore's edge to the heaters' leads"""
    parts = []
    up, z = V((0, 0, 1)), H / 2
    heater = [2 * math.pi * (j + 0.5) / 10 for j in range(10)]
    for L, am in zip(LONG, top_spots()):
        d, t = frame_at(am)
        p = ring_of(0.918, am, z + 0.022)
        parts.append(box(c, M["gold"], (0.066, 0.1, 0.04), at=p, rot=(0, 0, am), bevel=0.003, name="conditioner"))
        parts.append(box(c, M["alu"], (0.07, 0.104, 0.004), at=p + up * 0.022, rot=(0, 0, am), name="lid"))
        # the heaters in its third of the ring
        mine = [a for a in heater if 0 < (a - L) % (2 * math.pi) < 2 * math.pi / 3]
        for i, a in enumerate(mine):
            s = (i - (len(mine) - 1) / 2) * 0.012
            gland = p - d * 0.034 + t * s * 2 + up * -0.008
            hd, ht = frame_at(a)
            edge = ring_of(0.846, (am + a) / 2, z + 0.006)
            lead = hd * (RIN - 0.006) + ht * 0.022 + V((0, 0, -0.04))
            parts.append(rod(c, M["hose"], gland, edge, 0.0042, n=6, name="cable"))
            parts.append(rod(c, M["hose"], edge, lead, 0.0042, n=6, name="cable"))
            parts.append(disc(c, M["dark"], 0.0065, 0.008, gland, -d, n=8, name="gland"))
    return parts


def kit_instrument(c, M, H, k):
    """Report (the instruments): its outer face in gold foil (clad), data recorders at each stretch, and the connector
    panel on its lower lip where the deck's harness comes in"""
    parts = []
    up, z = V((0, 0, 1)), H / 2
    for am in top_spots():
        d, t = frame_at(am)
        p = ring_of(0.918, am, z + 0.018)
        parts.append(box(c, M["alu"], (0.062, 0.084, 0.032), at=p, rot=(0, 0, am), bevel=0.003, name="recorder"))
        parts.append(box(c, M["black"], (0.004, 0.07, 0.022), at=p + d * 0.032, rot=(0, 0, am), name="faceplate"))
        for s in (-1, 1):
            parts.append(cyl(c, M["dark"], 0.007, 0.012, at=p + d * 0.036 + t * s * 0.02, rot=(0, math.pi / 2, am), n=10, name="connector"))
    for a0, a1 in ((-0.3, -0.03), (0.03, 0.3)):
        parts.append(sector(c, M["dark"], 1.012, 1.022, -H / 2 + 0.002, -H / 2 + 0.03, a0, a1, n=8, name="panel"))
    for a in BAR_ARC:
        d, t = frame_at(a * 0.6)
        parts.append(rod(c, M["bolt"], ring_of(1.022, a * 0.6, -H / 2 + 0.016), ring_of(1.034, a * 0.6, -H / 2 + 0.016), 0.0075, n=10, name="connector"))
    return parts


KITS = {"database": kit_database, "antenna": kit_antenna, "press": kit_press, "compute": kit_compute, "power": kit_power, "instrument": kit_instrument}


def bulkhead(c, M, k):
    """stage k's ring: the frame, lips, channel, bolts and longeron fittings every stage has (so the shaft reads as one
    machine, each stage its colour), clad and fitted out for its stage's work"""
    _, _, purpose, H = STAGES[k]
    parts = []
    # the frame: a machined box section, chamfered, its outer face recessed for the light channel
    prof = [(RIN + 0.004, -H / 2), (0.966, -H / 2), (0.97, -H / 2 + 0.004), (0.97, H / 2 - 0.004), (0.966, H / 2),
            (RIN + 0.004, H / 2), (RIN, H / 2 - 0.004), (RIN, -H / 2 + 0.004)]
    parts.append(lathe(c, M["machined"], prof, n=128, name="frame"))
    # its lips, top and bottom, proud of the cladding: a bolted flange each
    for z0, z1 in ((H / 2 - 0.014, H / 2), (-H / 2, -H / 2 + 0.014)):
        parts.append(lathe(c, M["machined"], [(0.96, z0), (1.008, z0), (1.012, z0 + 0.003), (1.012, z1 - 0.003), (1.008, z1), (0.96, z1)], n=128, name="lip"))
    parts += clad(c, M, {"compute": "panel", "power": "radiator", "instrument": "gold", "database": "bays" if k == 6 else "bay"}.get(purpose, "blanket"), H)
    # the light channel: a black-anodised trough, and in it a run of opal diffusers, a clip between each (on the press's
    # ring, a stiffening rib from lip to lip)
    parts.append(band(c, M["black"], 0.962, 0.975, -0.021, 0.021, name="trough"))
    for j in range(24):
        a0, a1 = 2 * math.pi * j / 24 + 0.008, 2 * math.pi * (j + 1) / 24 - 0.008
        if off_long((a0 + a1) / 2, 0.08): continue
        parts.append(sector(c, M["channel"], 0.973, 0.984, -0.0145, 0.0145, a0, a1, n=8, name="diffuser"))
        am = a1 + 0.008
        if purpose == "press":
            parts.append(box(c, M["machined"], (0.042, 0.014, H - 0.026), at=ring_of(0.99, am, 0), rot=(0, 0, am), bevel=0.003, name="rib"))
        else:
            parts.append(box(c, M["dark"], (0.016, 0.012, 0.036), at=ring_of(0.982, am, 0), rot=(0, 0, am), bevel=0.002, name="clip"))
    # bolts: a circle on each lip, and the frame's own on its top and bottom faces
    for j in range(36):
        a = 2 * math.pi * (j + 0.5) / 36
        if off_long(a, 0.07): continue
        parts += hexbolt(c, M, ring_of(0.99, a, H / 2), (0, 0, 1), 0.0062, washer=False)
        parts += hexbolt(c, M, ring_of(0.99, a, -H / 2), (0, 0, -1), 0.0062, washer=False)
    for j in range(24):
        a = 2 * math.pi * j / 24
        parts += hexbolt(c, M, ring_of(0.885, a, H / 2), (0, 0, 1))
        parts += hexbolt(c, M, ring_of(0.885, a, -H / 2), (0, 0, -1))
    # where each longeron meets it: a base plate bolted to the frame, two cheeks, the pin, and the longeron's end block
    for a in LONG:
        d, t = frame_at(a)
        parts.append(box(c, M["dark"], (0.014, 0.13, H + 0.012), at=d * 0.976, rot=(0, 0, a), bevel=0.003, name="baseplate"))
        for s in (-1, 1):
            for z in (-(H / 2 - 0.02), H / 2 - 0.02):
                parts += hexbolt(c, M, d * 0.983 + t * s * 0.05 + V((0, 0, z)), d, 0.0055)
            parts.append(box(c, M["machined"], (0.075, 0.012, H - 0.02), at=d * 1.02 + t * s * 0.024, rot=(0, 0, a), bevel=0.003, name="cheek"))
        parts.append(cyl(c, M["bolt"], 0.009, 0.066, at=d * EDGE, rot=(math.pi / 2, 0, a), n=12, name="pin"))
        for s in (-1, 1):
            parts.append(cyl(c, M["bolt"], 0.013, 0.004, at=d * EDGE + t * s * 0.033, rot=(math.pi / 2, 0, a), n=6, name="nut"))
        parts.append(box(c, M["node"], (0.03, 0.034, H + 0.05), at=d * EDGE, rot=(0, 0, a), bevel=0.004, name="endblock"))
    # handrails on the top face, a standoff at each end
    for a in LONG:
        a0 = a - math.pi / 3 - 0.15
        for p in (ring_of(0.868, a0 - 0.12, H / 2), ring_of(0.868, a0 + 0.12, H / 2)):
            parts.append(rod(c, M["rail"], p, p + V((0, 0, 0.026)), 0.0045, n=6, name="standoff"))
        for i in range(6):
            q0 = ring_of(0.868, a0 - 0.12 + 0.24 * i / 6, H / 2 + 0.026)
            q1 = ring_of(0.868, a0 - 0.12 + 0.24 * (i + 1) / 6, H / 2 + 0.026)
            parts.append(rod(c, M["rail"], q0, q1, 0.0045, n=6, name="handrail"))
    parts += KITS[purpose](c, M, H, k)
    return join(parts, f"ring{k}")


def stage_tag(c, M, k):
    """stage k's name, stencilled on its ring's top face by the first fitting"""
    a, H = LONG[0] + 0.62, STAGES[k][3]
    return tag(c, M["paint"], STAGES[k][0], 0.04, ring_of(0.905, a, H / 2), a - math.pi / 2, lift=0.0004, extrude=0.0004, name=f"tag{k}")


# ================================================================ the fixtures
def store(c, M, H):
    """Start's and Save's magazine"""
    parts = []
    h, R = 0.62, 0.33
    z0, z1 = -h / 2, h / 2
    # the turntable the stack stands on: a chamfered plate, its bolt circle
    parts.append(lathe(c, M["machined"], [(0.001, z0 - 0.026), (R + 0.03, z0 - 0.026), (R + 0.036, z0 - 0.02), (R + 0.036, z0 - 0.006), (R + 0.03, z0), (0.001, z0)], n=96, name="turntable"))
    for j in range(12):
        a = 2 * math.pi * (j + 0.5) / 12
        parts += hexbolt(c, M, ring_of(0.24, a, z0), (0, 0, 1), 0.0055, washer=False)
    # six rails round the stack, extrusions with a slot down their inner face, and a shelf tab at each of its places
    for j in range(6):
        a = 2 * math.pi * j / 6 + 0.25
        d, t = frame_at(a)
        parts.append(box(c, M["alu"], (0.026, 0.026, h), at=d * R, rot=(0, 0, a), bevel=0.003, name="rail"))
        parts.append(box(c, M["black"], (0.004, 0.009, h - 0.02), at=d * (R - 0.0125), rot=(0, 0, a), name="slot"))
        for k in range(MAG_N):
            z = MAG_Y0 + k * MAG_DY - 0.011
            parts.append(box(c, M["dark"], (0.03, 0.016, 0.004), at=d * (R - 0.028) + V((0, 0, z)), rot=(0, 0, a), name="tab"))
    # three flanged hoops the rails pass through, bolted between them
    for z in (z0 + 0.02, 0.0, z1 - 0.008):
        parts.append(band(c, M["machined"], R - 0.016, R + 0.022, z - 0.008, z + 0.008, n=96, name="hoop"))
        for j in range(6):
            a = 2 * math.pi * j / 6 + 0.25 + math.pi / 6
            parts += hexbolt(c, M, ring_of(R + 0.003, a, z + 0.008), (0, 0, 1), 0.0045, washer=False)
    # three box-section spokes from the middle hoop to the bore, each braced to the top and bottom hoops
    for L in LONG:
        a = L + 0.5
        d, t = frame_at(a)
        r0, r1 = R + 0.02, RIN - 0.008
        parts.append(box(c, M["machined"], (r1 - r0, 0.028, 0.024), at=d * ((r0 + r1) / 2), rot=(0, 0, a), bevel=0.003, name="spoke"))
        parts.append(box(c, M["dark"], (0.008, 0.056, 0.07), at=d * (RIN - 0.004), rot=(0, 0, a), bevel=0.002, name="endplate"))
        for s in (-1, 1):
            for z in (-0.022, 0.022):
                parts += hexbolt(c, M, d * (RIN - 0.008) + t * s * 0.018 + V((0, 0, z)), -d, 0.0042, washer=False)
            parts.append(rod(c, M["dark"], d * (RIN - 0.012) + V((0, 0, s * 0.03)), d * (R + 0.024) + V((0, 0, s * (h / 2 - 0.02))), 0.0055, n=8, name="brace"))
    # its drive under the turntable, in gold foil, and the harness up a rail and out along a spoke
    zd = z0 - 0.026 - 0.026
    parts.append(box(c, M["gold"], (0.11, 0.08, 0.05), at=(0, 0, zd), bevel=0.003, name="drive"))
    parts.append(cyl(c, M["dark"], 0.026, 0.03, at=(0, 0, zd - 0.04), n=16, bevel=0.002, name="motor"))
    a = LONG[0] + 0.25
    d, t = frame_at(a)
    path = [V((0.04, 0, zd)), d * (R - 0.02) + V((0, 0, z0 - 0.03)), d * (R - 0.02) + V((0, 0, -0.02)), d * (RIN - 0.02) + V((0, 0, -0.02))]
    for p, q in zip(path, path[1:]):
        parts.append(rod(c, M["lead"], p, q, 0.003, n=6, name="harness"))
    return join(parts, "fix_store")


def search(c, M, H):
    """Search: dish antennas round the ring, on booms off its top lip"""
    parts = []
    R, depth = 0.055, 0.02
    f = R * R / (4 * depth)
    for j in range(12):
        a = 2 * math.pi * (j + 0.5) / 12
        d, t = frame_at(a)
        up = V((0, 0, 1))
        # the clamp on the top lip, and the boom out to the gimbal behind the dish
        parts.append(box(c, M["dark"], (0.042, 0.03, 0.011), at=d * 0.992 + V((0, 0, H / 2 + 0.0055)), rot=(0, 0, a), bevel=0.002, name="clamp"))
        for s in (-1, 1):
            parts += hexbolt(c, M, d * 0.982 + t * s * 0.009 + V((0, 0, H / 2 + 0.011)), up, 0.0034, washer=False)
        g = d * 1.074 + V((0, 0, 0.024))
        parts.append(rod(c, M["alu"], d * 1.0 + V((0, 0, H / 2 + 0.006)), g - d * 0.006, 0.0055, n=10, name="boom"))
        for s in (-1, 1):
            parts.append(box(c, M["dark"], (0.018, 0.004, 0.022), at=g + t * s * 0.0085, rot=(0, 0, a), name="cheek"))
        parts.append(rod(c, M["bolt"], g - t * 0.012, g + t * 0.012, 0.003, n=8, name="pin"))
        # the reflector, opening outwards, its hub and ribs on the back
        ctr = d * 1.1 + V((0, 0, 0.024))
        parts.append(dish(c, M["white"], R, depth, ctr, d, n=24, k=5, thick=0.003, name="reflector"))
        parts.append(rod(c, M["dark"], g, ctr + d * 0.001, 0.009, n=12, name="hub"))
        rim = [ctr + d * depth + (t * math.cos(th) + up * math.sin(th)) * R for th in (2 * math.pi * i / 6 for i in range(6))]
        for p in rim:
            parts.append(rod(c, M["dark"], ctr - d * 0.002, p - d * 0.004 + (ctr - p).normalized() * 0.004, 0.0022, n=4, name="rib"))
        # the feed horn at the focus, on three struts from the rim, opening back at the reflector
        fp = ctr + d * f
        parts.append(cone(c, M["alu"], fp - d * 0.004, fp + d * 0.012, 0.0095, 0.0042, n=12, name="horn"))
        parts.append(box(c, M["gold"], (0.014, 0.012, 0.012), at=fp + d * 0.018, rot=(0, 0, a), name="lnb"))
        for i in (0, 2, 4):
            parts.append(rod(c, M["dark"], rim[i] - d * 0.002, fp + d * 0.008, 0.0016, n=4, name="strut"))
        # the coax: from the feed down a strut, round the back to the hub, along the boom to the ring
        coax = [fp + d * 0.024, rim[4] - d * 0.006 + up * 0.003, ctr - d * 0.006 - up * 0.008, g - up * 0.006, d * 1.0 + V((0, 0, H / 2 + 0.0)), d * 0.975 + V((0, 0, H / 2 + 0.004))]
        for p, q in zip(coax, coax[1:]):
            parts.append(rod(c, M["hose"], p, q, 0.0017, n=5, name="coax"))
    return join(parts, "fix_search")


def press(c, M, H):
    """Extract: a die press inscribed in the bore"""
    parts = []
    s = RIN / math.sqrt(2) - 0.02
    up = V((0, 0, 1))
    for j in range(4):
        th = j * math.pi / 2
        d, t = frame_at(th)
        # the jaw: a tool-steel beam, its ground platen on its face, held by cap screws
        parts.append(box(c, M["steel"], (0.044, 2 * s, 0.076), at=d * (s + 0.022), rot=(0, 0, th), bevel=0.005, name="jaw"))
        parts.append(box(c, M["platen"], (0.01, 2 * s - 0.09, 0.052), at=d * (s - 0.004), rot=(0, 0, th), bevel=0.002, name="platen"))
        for u in (-0.4, -0.2, 0.0, 0.2, 0.4):
            for z in (-0.017, 0.017):
                parts.append(disc(c, M["dark"], 0.0036, 0.002, d * (s - 0.0094) + t * u + up * z, d, n=6, name="screw"))
        back = s + 0.044
        # two hydraulic rams driving it, off trunnions on the bore
        for u in (-0.2, 0.2):
            wall = math.sqrt(RIN ** 2 - u ** 2)
            b0, b1 = d * (wall - 0.026) + t * u, d * (back + 0.062) + t * u
            parts.append(box(c, M["dark"], (0.026, 0.064, 0.064), at=d * (wall - 0.013) + t * u, rot=(0, 0, th), name="trunnion"))
            parts.append(rod(c, M["steel"], b0, b1, 0.024, n=20, name="barrel"))
            for e, sgn in ((b0, 1), (b1, -1)):
                parts.append(box(c, M["machined"], (0.012, 0.058, 0.058), at=e + d * (0.006 * sgn * -1), rot=(0, 0, th), name="endcap"))
            for ct in (-1, 1):
                for cz in (-1, 1):
                    off = t * ct * 0.022 + up * cz * 0.022
                    parts.append(rod(c, M["bolt"], b0 + off - d * 0.012, b1 + off + d * 0.012, 0.0026, n=5, name="tierod"))
            parts.append(rod(c, M["chrome"], b1, d * back + t * u, 0.011, n=14, name="ramrod"))
            parts.append(box(c, M["dark"], (0.018, 0.03, 0.03), at=d * (back + 0.009) + t * u, rot=(0, 0, th), name="clevis"))
            # its ports, and the hoses up over the bore to the manifold above it
            for e in (b0 + d * 0.02, b1 - d * 0.02):
                parts.append(rod(c, M["bolt"], e + up * 0.022, e + up * 0.034, 0.0045, n=6, name="port"))
            mani = d * (wall - 0.03) + up * 0.075
            for e in (b0 + d * 0.02, b1 - d * 0.02):
                p = e + up * 0.034
                parts.append(rod(c, M["hose"], p, p + up * 0.02, 0.0042, n=6, name="hose"))
                parts.append(rod(c, M["hose"], p + up * 0.02, mani + t * u * 0.0 - d * 0.0, 0.0042, n=6, name="hose"))
            parts.append(box(c, M["machined"], (0.03, 0.05, 0.022), at=mani + t * 0.0, rot=(0, 0, th), name="manifold"))
        # two guide bars in linear bearings on the jaw's back, keeping it square
        for u in (-0.45, 0.45):
            wall = math.sqrt(RIN ** 2 - u ** 2)
            parts.append(rod(c, M["chrome"], d * (back - 0.004) + t * u, d * (wall - 0.004) + t * u, 0.0085, n=12, name="guide"))
            parts.append(box(c, M["dark"], (0.03, 0.036, 0.036), at=d * (back + 0.015) + t * u, rot=(0, 0, th), name="bearing"))
            parts.append(box(c, M["dark"], (0.016, 0.04, 0.05), at=d * (wall - 0.008) + t * u, rot=(0, 0, th), bevel=0.002, name="mount"))
    # the frame blocks at the corners, where the jaws meet
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        e, t = frame_at(a)
        parts.append(box(c, M["black"], (0.07, 0.07, 0.09), at=e * (RIN - 0.04), rot=(0, 0, a), bevel=0.006, name="corner"))
        for z in (-0.03, 0.03):
            parts += hexbolt(c, M, e * (RIN - 0.075) + V((0, 0, z)), -e, 0.0045, washer=False)
    return join(parts, "fix_press")


def comparator(c, M, H):
    """Dedup: a twin ring hung under the bulkhead"""
    parts = []
    zc = -0.25
    up = V((0, 0, 1))
    # the fixed inner race, the seal, the outer race that turns on it, and the ring gear round that
    parts.append(band(c, M["machined"], 0.86, 0.918, zc - 0.028, zc + 0.028, name="inner race"))
    parts.append(band(c, M["black"], 0.917, 0.927, zc - 0.022, zc + 0.022, name="seal"))
    parts.append(band(c, M["alu"], 0.926, 0.972, zc - 0.03, zc + 0.03, name="outer race"))
    parts.append(band(c, M["dark"], 0.971, 0.978, zc - 0.018, zc + 0.018, name="gear root"))
    for i in range(160):
        a = 2 * math.pi * i / 160
        parts.append(box(c, M["dark"], (0.012, 0.018, 0.034), at=ring_of(0.982, a, zc), rot=(0, 0, a), name="tooth"))
    # the encoder's scale on the outer race's top, and its two read heads on brackets from the struts
    parts.append(band(c, M["encoder"], 0.936, 0.962, zc + 0.03, zc + 0.0318, name="scale"))
    for a in (1.15, 1.15 + math.pi):
        d, t = frame_at(a)
        parts.append(box(c, M["gold"], (0.034, 0.026, 0.016), at=ring_of(0.949, a, zc + 0.044), rot=(0, 0, a), bevel=0.002, name="readhead"))
        parts.append(box(c, M["dark"], (0.06, 0.012, 0.008), at=ring_of(0.92, a, zc + 0.056), rot=(0, 0, a), name="bracket"))
        parts.append(rod(c, M["hose"], ring_of(0.95, a, zc + 0.052), ring_of(0.95, a + 0.02, -H / 2), 0.0022, n=5, name="cable"))
    # six struts down from the bulkhead's bottom face to the inner race, a flange and bolts at each end
    for j in range(6):
        a = 2 * math.pi * j / 6 + 0.2
        d, t = frame_at(a)
        top, bot = ring_of(0.889, a, -H / 2), ring_of(0.889, a, zc + 0.028)
        parts.append(rod(c, M["machined"], top, bot, 0.0105, n=14, name="strut"))
        for p, sgn in ((top, -1), (bot, 1)):
            parts.append(disc(c, M["dark"], 0.02, 0.005, p + up * sgn * 0.0025, up, n=16, name="flange"))
            for s in (-1, 1):
                parts += hexbolt(c, M, p + up * sgn * 0.005 + t * s * 0.014, up * sgn, 0.0032, washer=False)
    # the drive: a motor in gold foil off a hanger from the bulkhead, its pinion meshing with the ring gear
    a = 2.6
    d, t = frame_at(a)
    parts.append(box(c, M["dark"], (0.02, 0.05, -H / 2 - zc - 0.01), at=ring_of(1.03, a, (-H / 2 + zc) / 2 + 0.005), rot=(0, 0, a), bevel=0.002, name="hanger"))
    parts.append(rod(c, M["steel"], ring_of(1.008, a, zc - 0.02), ring_of(1.008, a, zc + 0.02), 0.022, n=24, name="pinion"))
    parts.append(box(c, M["gold"], (0.05, 0.06, 0.06), at=ring_of(1.058, a, zc), rot=(0, 0, a), bevel=0.003, name="motor"))
    parts.append(rod(c, M["hose"], ring_of(1.06, a, zc + 0.03), ring_of(1.06, a + 0.03, -H / 2), 0.0026, n=5, name="cable"))
    # bolts round the inner race's top, between the struts
    for j in range(24):
        a = 2 * math.pi * (j + 0.5) / 24
        parts += hexbolt(c, M, ring_of(0.875, a, zc + 0.028), up, 0.0042, washer=False)
    return join(parts, "fix_comparator")


def heaters(c, M, H):
    """Enrich: ten infrared emitters standing round the bore, proud of the bulkhead above and below it"""
    parts = []
    Z = 0.205
    for j in range(10):
        a = 2 * math.pi * (j + 0.5) / 10
        d, t = frame_at(a)
        p = d * 0.745
        # the reflector trough, open towards the bore's middle, and the housing's back behind it
        parts.append(trough(c, M["reflector"], 0.036, -Z + 0.02, Z - 0.02, p, -d, name="reflector"))
        parts.append(box(c, M["machined"], (0.012, 0.082, 2 * Z - 0.03), at=p + d * 0.043, rot=(0, 0, a), name="housing"))
        # its back sheds heat through a stack of fins
        for i in range(11):
            z = -Z + 0.05 + (2 * Z - 0.1) * i / 10
            parts.append(box(c, M["dark"], (0.016, 0.07, 0.0035), at=p + d * 0.057 + V((0, 0, z)), rot=(0, 0, a), name="fin"))
        for s in (-1, 1):
            parts.append(box(c, M["machined"], (0.05, 0.004, 2 * Z - 0.03), at=p + d * 0.018 + t * s * 0.039, rot=(0, 0, a), name="side"))
        # the filament, coiled, in its quartz sleeve
        parts.append(helix(c, M["heater"], 0.0085, 0.0024, -Z + 0.03, Z - 0.03, 20, p - d * 0.004, per=5, name="filament"))
        parts.append(cyl(c, M["quartz"], 0.0145, 2 * Z - 0.04, at=p - d * 0.004, n=16, name="sleeve"))
        # its ceramic end blocks, terminals and leads
        for sz in (-1, 1):
            e = p + V((0, 0, sz * (Z - 0.008)))
            parts.append(box(c, M["ceramic"], (0.07, 0.088, 0.024), at=e + d * 0.012, rot=(0, 0, a), bevel=0.003, name="endblock"))
            for s in (-1, 1):
                parts.append(cyl(c, M["bolt"], 0.0045, 0.012, at=e + d * 0.03 + t * s * 0.022 + V((0, 0, sz * 0.016)), n=6, name="terminal"))
        # the leads run down from the lower terminals to the bulkhead's bore
        for s in (-1, 1):
            q0 = p + d * 0.03 + t * s * 0.022 + V((0, 0, -Z - 0.01))
            q1 = q0 + d * 0.03 + V((0, 0, 0.05))
            q2 = d * (RIN - 0.004) + t * s * 0.022 + V((0, 0, -0.04))
            parts.append(rod(c, M["lead"], q0, q1, 0.0026, n=5, name="lead"))
            parts.append(rod(c, M["lead"], q1, q2, 0.0026, n=5, name="lead"))
        # two arms holding it off the bore
        for z in (-0.035, 0.035):
            parts.append(box(c, M["dark"], (RIN - 0.79, 0.022, 0.016), at=d * ((RIN + 0.79) / 2) + V((0, 0, z)), rot=(0, 0, a), name="arm"))
            parts += hexbolt(c, M, d * (RIN - 0.002) + V((0, 0, z)), -d, 0.005, washer=False)
    return join(parts, "fix_heaters")


def deck(c, M, H):
    """Report: an instrument deck cantilevered off the ring round +x (the site turns it to you); the bars stand on its top
    at BAR_ARC"""
    parts = []
    A0, A1 = -0.62, 0.62
    r0, r1 = 1.34, 1.66
    zt, zb = DECK_Z, DECK_Z - 0.034          # its top, where the bars stand, and its beams' bottom
    up = V((0, 0, 1))
    # box beams round its inner and outer edges, and across its ends
    for rr in (r0, r1):
        parts.append(sector(c, M["machined"], rr - 0.014, rr + 0.014, zb, zt, A0, A1, n=56, name="beam"))
    for a in (A0, A1):
        d, t = frame_at(a)
        parts.append(box(c, M["machined"], (r1 - r0, 0.028, zt - zb), at=d * ((r0 + r1) / 2) + up * ((zt + zb) / 2), rot=(0, 0, a), name="beam"))
    # ribs between them; on top, black panels with a seam between each, fastened at their corners; under, gold foil
    nrib = 8
    for i in range(1, nrib):
        a = A0 + (A1 - A0) * i / nrib
        d, t = frame_at(a)
        parts.append(box(c, M["dark"], (r1 - r0 - 0.028, 0.012, zt - zb - 0.006), at=d * ((r0 + r1) / 2) + up * ((zt + zb) / 2 - 0.003), rot=(0, 0, a), name="rib"))
    for i in range(nrib):
        a0, a1 = A0 + (A1 - A0) * i / nrib + 0.0035, A0 + (A1 - A0) * (i + 1) / nrib - 0.0035
        parts.append(sector(c, M["black"], r0 + 0.014, r1 - 0.014, zt - 0.005, zt, a0, a1, n=6, name="panel"))
        parts.append(sector(c, M["gold"], r0 + 0.015, r1 - 0.015, zb + 0.001, zb + 0.005, a0 + 0.006, a1 - 0.006, n=6, name="mli"))
        for aa in (a0 + 0.012, a1 - 0.012):
            for rr in (r0 + 0.03, r1 - 0.03):
                parts += hexbolt(c, M, ring_of(rr, aa, zt), up, 0.0038, washer=False)
    # three brackets: a box beam under it off a plate on the ring's face, a knee brace under that, a tie rod above
    for a in (-0.32, 0.0, 0.32):
        d, t = frame_at(a)
        zbb = zb - 0.026
        parts.append(box(c, M["dark"], (0.016, 0.07, 0.15), at=d * 1.02 + up * -0.085, rot=(0, 0, a), bevel=0.003, name="plate"))
        for z in (-0.03, -0.13):
            for s in (-1, 1):
                parts += hexbolt(c, M, d * 1.028 + t * s * 0.022 + up * z, d, 0.0042, washer=False)
        parts.append(box(c, M["machined"], (r0 - 1.02, 0.024, 0.026), at=d * ((r0 + 1.02) / 2) + up * (zbb + 0.013), rot=(0, 0, a), bevel=0.003, name="cantilever"))
        parts.append(rod(c, M["machined"], d * 1.03 + up * -0.15, d * 1.24 + up * zbb, 0.007, n=10, name="knee"))
        tie0, tie1 = d * 1.012 + up * (H / 2 + 0.012), d * (r1 - 0.02) + up * (zt + 0.014)
        parts.append(box(c, M["dark"], (0.03, 0.02, 0.024), at=tie0, rot=(0, 0, a), bevel=0.002, name="lug"))
        parts.append(box(c, M["dark"], (0.03, 0.02, 0.022), at=tie1, rot=(0, 0, a), bevel=0.002, name="lug"))
        mid = (tie0 + tie1) / 2
        parts.append(rod(c, M["bolt"], tie0, tie1, 0.0034, n=6, name="tierod"))
        parts.append(rod(c, M["node"], mid - (tie1 - tie0).normalized() * 0.022, mid + (tie1 - tie0).normalized() * 0.022, 0.006, n=8, name="turnbuckle"))
    # a handrail round its outer edge
    n = 16
    pts = [ring_of(r1 - 0.006, A0 + 0.02 + (A1 - A0 - 0.04) * i / n, zt) for i in range(n + 1)]
    for i, p in enumerate(pts):
        if i % 2 == 0:
            parts.append(rod(c, M["rail"], p, p + up * 0.045, 0.004, n=6, name="standoff"))
        if i:
            parts.append(rod(c, M["rail"], pts[i - 1] + up * 0.045, p + up * 0.045, 0.004, n=6, name="handrail"))
    # under each bar, a junction box in gold foil and its harness to the ring
    for a in BAR_ARC:
        d, t = frame_at(a)
        jb = ring_of(BAR_R, a, zb - 0.017)
        parts.append(box(c, M["gold"], (0.08, 0.07, 0.03), at=jb, rot=(0, 0, a), bevel=0.003, name="junction"))
        # (into its connector on the ring's lower lip, kit_instrument)
        path = [jb - d * 0.04, ring_of(r0 + 0.02, a, zb - 0.01), ring_of(1.1, a * 0.6, zb - 0.012), ring_of(1.034, a * 0.6, -H / 2 + 0.016)]
        for p, q in zip(path, path[1:]):
            parts.append(rod(c, M["lead"], p, q, 0.0032, n=6, name="harness"))
    return join(parts, "fix_deck")


def bar_sections(c, M):
    """the report's bars: a telescoping mast of NB nested sections, each BL tall, authored at the origin with its foot at
    z 0 and its face to +x (out from the ring; the site turns each to its place round the deck). The base has its flange,
    bolted to the deck; each section a collar round its top that the next slides out of; the top one a cap and its light."""
    out = []
    up = V((0, 0, 1))
    for i in range(NB):
        w, dd = 0.2 - 0.018 * i, 0.1 - 0.012 * i     # across, and deep
        parts = [box(c, M["machined"], (dd, w, BL), at=(0, 0, BL / 2), bevel=0.003, name="section")]
        # two guide strips down its face
        for s in (-1, 1):
            parts.append(box(c, M["dark"], (0.004, 0.01, BL - 0.03), at=(dd / 2 + 0.0015, s * (w / 2 - 0.022), BL / 2 - 0.004), name="guide"))
        if i < NB - 1:
            parts.append(box(c, M["dark"], (dd + 0.012, w + 0.012, 0.022), at=(0, 0, BL - 0.011), bevel=0.003, name="collar"))
            for s in (-1, 1):
                parts.append(disc(c, M["bolt"], 0.0042, 0.003, V((dd / 2 + 0.0075, s * w * 0.3, BL - 0.011)), V((1, 0, 0)), n=6, name="bolt"))
        else:
            parts.append(box(c, M["barlight"], (dd + 0.006, w + 0.006, 0.026), at=(0, 0, BL - 0.03), name="light"))
            parts.append(box(c, M["dark"], (dd + 0.012, w + 0.012, 0.012), at=(0, 0, BL - 0.006), bevel=0.003, name="cap"))
        if i == 0:
            parts.append(box(c, M["dark"], (dd + 0.07, w + 0.07, 0.01), at=(0, 0, 0.005), bevel=0.002, name="flange"))
            for sx in (-1, 1):
                for sy in (-1, 1):
                    parts += hexbolt(c, M, V((sx * (dd / 2 + 0.022), sy * (w / 2 + 0.022), 0.01)), up, 0.0045, washer=False)
            # its electronics, in gold foil on its back
            parts.append(box(c, M["gold"], (0.014, w * 0.62, BL * 0.42), at=(-dd / 2 - 0.007, 0, BL * 0.32), bevel=0.002, name="box"))
        out.append(join(parts, f"bar{i}"))
    return out


# ---------------------------------------------------------------- the mast's pieces, each at the origin in ring units
def mast_pieces(c, M):
    out = []
    # the longeron: a tube one unit long up z, its end fittings left to the rings and the hinge
    out.append(cyl(c, M["longeron"], 0.0095, 1.0, at=(0, 0, 0.5), n=12, name="mast_longeron"))
    # the hinge at mid-bay: two clevis halves and the pin, along z, its pin across x
    h = [box(c, M["node"], (0.026, 0.026, 0.03), at=(0, 0, 0.017), bevel=0.003, name="hinge"),
         box(c, M["node"], (0.026, 0.026, 0.03), at=(0, 0, -0.017), bevel=0.003, name="hinge"),
         cyl(c, M["bolt"], 0.0065, 0.036, at=(0, 0, 0), rot=(0, math.pi / 2, 0), n=10, name="pin")]
    out.append(join(h, "mast_hinge"))
    # the batten frame at mid-bay: three tubes between the longerons, a corner fitting at each
    b = []
    pts = [V((EDGE * math.cos(a), EDGE * math.sin(a), 0)) for a in LONG]
    for i in range(3):
        p, q = pts[i], pts[(i + 1) % 3]
        d = (q - p).normalized()
        b.append(rod(c, M["longeron"], p + d * 0.03, q - d * 0.03, 0.0065, n=10, name="batten"))
        b.append(box(c, M["node"], (0.05, 0.05, 0.022), at=p, rot=(0, 0, math.atan2(p.y, p.x)), bevel=0.004, name="corner"))
    out.append(join(b, "mast_batten"))
    # a diagonal: tensioned cable, one unit long up z
    out.append(cyl(c, M["cable"], 0.0028, 1.0, at=(0, 0, 0.5), n=6, name="mast_cable"))
    # its turnbuckle, at the cable's middle
    tb = [cyl(c, M["bolt"], 0.0055, 0.05, n=8, name="body"),
          cyl(c, M["node"], 0.0042, 0.018, at=(0, 0, 0.034), n=8, name="end"),
          cyl(c, M["node"], 0.0042, 0.018, at=(0, 0, -0.034), n=8, name="end")]
    out.append(join(tb, "mast_turnbuckle"))
    return out


FIXTURES = {"store": store, "search": search, "press": press, "comparator": comparator, "heaters": heaters, "deck": deck}


def build(c):
    """each ring built (RINGS), each fixture once (as its first stage's ring is high), the bars, the tags, and the mast's
    pieces"""
    M = mats()
    rings = [bulkhead(c, M, k) for k in RINGS]
    first = {fx: STAGES[[s[1] for s in STAGES].index(fx)][3] for fx in FIXTURES}
    parts = rings + [fn(c, M, first[fx]) for fx, fn in FIXTURES.items()] + bar_sections(c, M)
    tags = [stage_tag(c, M, k) for k in range(8)]
    textured(c, 0.2, {"mmod blanket": 0.26, "gold foil": 0.06, "machined": 0.25})
    return parts, tags, mast_pieces(c, M)


# ================================================================ export
def at_origin(objs):
    bpy.context.scene.cursor.location = (0, 0, 0)
    for o in objs:
        bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")


def bake_part(o, others_hidden, path, size=512, samples=48, distance=0.12):
    """ambient occlusion into one part's own second UV map, without joining it to the rest (as crawler.py)"""
    me = o.data
    for uv in list(me.uv_layers)[1:]: me.uv_layers.remove(uv)
    if not me.uv_layers: me.uv_layers.new(name="UVMap")
    ao_uv = me.uv_layers.new(name="ao"); me.uv_layers.active = ao_uv
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.006, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    me.uv_layers.active = me.uv_layers[0]
    img_ = bpy.data.images.new(o.name + " ao", size, size, alpha=False, float_buffer=False)
    img_.colorspace_settings.name = "Non-Color"
    nodes = []
    for i, m in enumerate(me.materials):
        if m is None: continue
        m = m.copy(); me.materials[i] = m
        nt = m.node_tree
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = img_; t.name = "ao bake"
        uvn = nt.nodes.new("ShaderNodeUVMap"); uvn.uv_map = "ao"; nt.links.new(uvn.outputs["UV"], t.inputs["Vector"])
        nt.nodes.active = t; nodes.append((m, t))
    for x in others_hidden: x.hide_render = True
    sc = bpy.context.scene
    was = sc.render.engine
    sc.render.engine = "CYCLES"
    try: sc.cycles.device = "GPU"
    except Exception: pass
    sc.cycles.samples = samples
    sc.render.bake.margin = 4
    sc.world.light_settings.distance = distance
    bpy.ops.object.bake(type="AO")
    for x in others_hidden: x.hide_render = False
    img_.filepath_raw = path; img_.file_format = "PNG"; img_.save()
    sc.render.engine = was
    g = bpy.data.node_groups.get("glTF Material Output")
    if not g:
        g = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        g.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    for m, t in nodes:
        nt = m.node_tree
        sep = nt.nodes.new("ShaderNodeSeparateColor"); nt.links.new(t.outputs["Color"], sep.inputs["Color"])
        go = nt.nodes.new("ShaderNodeGroup"); go.node_tree = g
        nt.links.new(sep.outputs[0], go.inputs["Occlusion"])


def export_all(c, path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in c.all_objects: o.select_set(True)
    bpy.context.view_layer.objects.active = next(iter(c.all_objects))
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True)


def cycles(samples):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"; prefs.get_devices()
    for d in prefs.devices: d.use = True
    sc.cycles.device = "GPU"; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6


def placed(c, o, at, rot_z=0.0):
    """a linked copy of part o at `at`, turned rot_z round z"""
    x = o.copy(); c.objects.link(x); x.hide_render = False
    x.matrix_world = Matrix.Translation(V(at)) @ Matrix.Rotation(rot_z, 4, "Z")
    return x


def preview(c, parts, tags, pieces):
    """Cycles stills: each stage's ring with its fixture, lit as the site lights it while it burns, and the deck with its
    bars raised to the report's heights"""
    stage()
    cycles(40)
    for m in bpy.data.materials:
        b = next((n for n in (m.node_tree.nodes if m.node_tree else []) if n.type == "BSDF_PRINCIPLED"), None)
        if not b: continue
        if m.name == "heater":
            b.inputs["Emission Color"].default_value = (1.0, 0.36, 0.08, 1); b.inputs["Emission Strength"].default_value = 6.0
        if m.name in ("channel", "barlight"):
            b.inputs["Emission Color"].default_value = srgb("#f5c77a"); b.inputs["Emission Strength"].default_value = 3.0
    by = {o.name: o for o in parts}
    for o in parts + tags + pieces: o.hide_render = True
    shots = []
    ring = lambda k: by[f"ring{k if k in RINGS else 3}"]
    for k, (_, fx, _, H) in enumerate(STAGES):
        X = V((4.0 * k, 0, 0))
        for o in (ring(k), by[f"fix_{fx}"], tags[k]):
            placed(c, o, X)
        if fx == "deck":
            for a, h in zip(BAR_ARC, (1.3, 0.91, 0.39, 0.343)):
                for i in range(NB):
                    y = (max(BL, h) - BL) * i / (NB - 1) if i else 0.0
                    placed(c, by[f"bar{i}"], X + ring_of(BAR_R, a, DECK_Z + y), a)
        # three-quarter from above, as the fall sees it; and close on its equipment and cladding at -y
        shots.append((f"{OUT}pipeline-stage{k}-{fx}.png", X + V((2.6, -4.6, 3.4)), X + V((0.2, 0, -0.1))))
        shots.append((f"{OUT}pipeline-stage{k}-{fx}-close.png", X + V((0.75, -2.05, 0.75)), X + V((0.12, -0.9, 0.0))))
    # the report's deck and bars, from outside and from under it
    X = V((4.0 * 7, 0, 0))
    shots.append((f"{OUT}pipeline-report-bars.png", X + V((5.2, -2.4, 1.2)), X + V((1.45, 0, 0.45))))
    shots.append((f"{OUT}pipeline-report-under.png", X + V((4.0, -1.4, -1.6)), X + V((1.45, 0, 0.35))))
    # the whole shaft, each stage at its depth (lib/voyage/world.ts: a bay is 2.155 ring radii, the report half a bay
    # under Save)
    X = V((-8.0, 0, 0))
    for k, (_, fx, _, _) in enumerate(STAGES):
        z = -2.155 * (k if k < 7 else 6.5)
        for o in (ring(k), by[f"fix_{fx}"]):
            placed(c, o, X + V((0, 0, z)))
    shots.append((f"{OUT}pipeline-shaft.png", X + V((14.0, -30.0, 4.0)), X + V((0, 0, -7.2))))
    only = os.environ.get("SHOTS")
    for path, cam, look in shots:
        if only and not any(w in path for w in only.split(",")): continue
        shoot(path, cam, look=look, res=(700, 1300) if path.endswith("shaft.png") else (1050, 700))


if __name__ == "__main__":
    clear()
    c = coll("pipeline")
    parts, tags, pieces = build(c)
    apply_all(c)
    at_origin(parts + tags + pieces)
    print("pipeline tris", tri_count(c))
    for o in parts + tags + pieces: print(o.name, "tris", sum(len(p.vertices) - 2 for p in o.data.polygons))
    if MODE == "preview":
        preview(c, parts, tags, pieces)
    else:
        for o in parts:
            bake_part(o, [x for x in parts + tags + pieces if x is not o], f"{OUT}{o.name}-ao.png", size=256 if o.name.startswith("bar") else 512)
        export_all(c, f"{OUT}pipeline.raw.glb")
