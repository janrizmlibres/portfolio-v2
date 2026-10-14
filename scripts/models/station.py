"""The ring ship made to look real (ring-irl round 1): Janriz, 2026-10-10, "I want the ring ship to look like irl. And
have it take half of the screen like in Edolus", then "let's settle it by eye first" between a pre-render and the
real-time site. Run headless, its own Blender process (`scripts/models/build.sh station`), never the shared one.

Same plan as the ring he kept (twelve bays round a hub on four spokes, radius 1, turning on +z), built from what real
stations are made of: pressurised modules are cylinders in quilted white blankets (MMOD beta cloth), with conical ends,
berthing rings, handrails, grapple fixtures, a few small dark windows and cable runs; the thermal bays wear silver
foil and carry ribbed radiators; the docking adapter wears gold foil; the spokes are aluminium lattice trusses with a
transit tube; the hub carries a pair of solar array wings aft. The pattern repeats every quarter turn, so a turn of
90 degrees loops.

MODE (environment): "preview" (EEVEE, fast, for framing), "cycles" (the pre-render), "site" (bakes occlusion and writes
out/real.raw.glb, which build.sh compresses to public/voyage/ship/real.glb), "export" (the research render's glTF). The
shot is station-shot.json. Its maps are tex.py's, in tex/.
"""
import bpy, bmesh, math, json, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)) + "/"
exec(open(HERE + "shiplib.py").read())
V = Vector
TEX = HERE + "tex/"
OUT = HERE + "out/"
os.makedirs(OUT, exist_ok=True)
MODE = os.environ.get("MODE", "preview")
SHOT = json.load(open(HERE + "station-shot.json"))

clear()
SC = bpy.context.scene
C = coll("ring")

# ---------------------------------------------------------------- pieces: what arrives together as Work builds it
# (Janriz, 2026-10-11: Work's companies build home, one a quarter of the ring). Everything a piece's builder makes is
# tagged with its name, and the site's model keeps each piece as its own node; what no piece claims is the core.
PIECES = []
def piece(name, build, *args):
    before = set(C.objects)
    build(*args)
    for o in set(C.objects) - before: o["piece"] = name
    PIECES.append(name)

# ---------------------------------------------------------------- materials: the same maps feed both renders
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

def surface(name, tex, metal=0.0, normal=1.0, spec=0.5):
    """a textured surface: tex/<tex>-color, -rough, -normal, and -metal if it has one (else `metal`)"""
    m, nt, b = principled(name)
    nt.links.new(img(nt, TEX + tex + "-color.png").outputs["Color"], b.inputs["Base Color"])
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

def plain(name, rgb, metal=0.0, rough=0.5):
    m, nt, b = principled(name)
    b.inputs["Base Color"].default_value = srgb(rgb)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    return m

M = {
    "blanket": surface("mmod blanket", "blanket", normal=1.0),
    "gold": surface("gold foil", "gold", metal=1.0, normal=0.45),
    "silver": surface("silver foil", "silver", metal=1.0, normal=0.35),
    "alu": surface("aluminium", "alu", metal=1.0, normal=0.4),
    "radiator": surface("radiator", "radiator", normal=0.8),
    "solar": surface("solar cells", "solar", normal=0.5),
    # anodised, not mirror-bright: in space a mirror metal reflects black, so fittings read grey only if they're mostly
    # diffuse, as real ones are
    "alu plain": plain("aluminium plain", "#a9acb1", 0.4, 0.48),
    "dark": plain("dark metal", "#3a3c41", 0.6, 0.4),
    "black": plain("black anodised", "#18191c", 0.3, 0.55),
    "rail": plain("handrail", "#c79a3e", 0.0, 0.45),
    "glass": plain("window glass", "#050608", 0.0, 0.04),
    "grey": plain("grey paint", "#8d9096", 0.0, 0.5),
    # a module's bare structure, seen only while Work builds it, before its hull closes over it
    "cage": plain("cage", "#b9bdc3", 0.5, 0.42),
}

# ---------------------------------------------------------------- geometry with real UVs
def tube(m, r, a, b, n=48, tile=0.16, r2=None, caps=True, name="tube"):
    """a cylinder (a frustum with r2) from a to b, its UVs in world units / tile, a whole number of tiles round it so
    the map meets itself at the seam; the side shades smooth, the caps flat"""
    a, b = V(a), V(b); d = b - a; ln = d.length; ax = d.normalized()
    u0 = ax.orthogonal().normalized(); w0 = ax.cross(u0)
    rb = r if r2 is None else r2
    nu = max(1, round(2 * math.pi * max(r, rb) / tile))
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    ring = lambda c, rr: [bm.verts.new(c + (u0 * math.cos(2 * math.pi * j / n) + w0 * math.sin(2 * math.pi * j / n)) * rr) for j in range(n)]
    v0, v1 = ring(a, r), ring(b, rb)
    for j in range(n):
        k = (j + 1) % n
        f = bm.faces.new((v0[j], v0[k], v1[k], v1[j])); f.smooth = True
        uk = (j + 1) / n * nu
        for loop, uv in zip(f.loops, ((j / n * nu, 0), (uk, 0), (uk, ln / tile), (j / n * nu, ln / tile))):
            loop[uvl].uv = uv
    if caps:
        for vs, c, rr in ((v0, a, r), (v1, b, rb)):
            f = bm.faces.new(vs if vs is v1 else list(reversed(vs))); f.smooth = False
            for loop in f.loops:
                p = loop.vert.co - c
                loop[uvl].uv = (p.dot(u0) / tile, p.dot(w0) / tile)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); C.objects.link(o)
    me.materials.append(m)
    return o

def slab(m, size, at, axes, tile, name="slab", bevel=0.0):
    """a box of `size` along the given axes (three unit vectors), box-projected UVs at one tile per `tile`"""
    o = box(C, m, size, at=(0, 0, 0), name=name, bevel=bevel)
    x, y, z = (V(v).normalized() for v in axes)
    o.matrix_world = Matrix((x, y, z)).transposed().to_4x4()
    o.location = V(at)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    if any(n.type == "TEX_IMAGE" for n in m.node_tree.nodes): cube_uv(o, tile)
    return o

def handrail(a, b, out, lift=0.009):
    a, b, out = V(a), V(b), V(out).normalized()
    rod(C, M["rail"], a + out * lift, b + out * lift, 0.0018, n=6, name="handrail")
    for k in range(4):
        p = a + (b - a) * (k / 3)
        rod(C, M["rail"], p, p + out * lift, 0.0014, n=5, name="handrail post")

def cbm(at, axis, r):
    """a common berthing mechanism: a machined ring with its latches"""
    ax = V(axis).normalized()
    tube(M["alu plain"], r, V(at) - ax * 0.006, V(at) + ax * 0.006, n=48, name="berthing ring")
    u = ax.orthogonal().normalized(); w = ax.cross(u)
    for k in range(8):
        t = 2 * math.pi * k / 8
        d = u * math.cos(t) + w * math.sin(t)
        slab(M["dark"], (0.006, 0.006, 0.01), V(at) + d * (r + 0.002), (d, d.cross(ax), ax), 1, name="latch")

def grapple(at, normal):
    n = V(normal).normalized()
    tube(M["grey"], 0.014, V(at), V(at) + n * 0.004, n=24, name="grapple base")
    tube(M["black"], 0.0035, V(at), V(at) + n * 0.018, n=10, name="grapple pin")

def window(at, normal, r=0.0045):
    """a small window, as real ones are: a painted frame standing proud of the blanket, dark glass set in it"""
    n = V(normal).normalized()
    tube(M["grey"], r * 1.55, V(at) - n * 0.001, V(at) + n * 0.003, n=24, name="window frame")
    tube(M["glass"], r, V(at), V(at) + n * 0.0042, n=24, name="window")

# ---------------------------------------------------------------- the ring
R, SPAN = 1.0, 2 * math.pi / 12
MR = 0.078            # a module's radius
NR = 0.064            # a node's radius

def bay_frame(k):
    """bay k's module sits on the chord between the nodes either side of it: its centre, its axis (round the ring),
    the way out from the hub, and the axis's up (+z)"""
    a = SPAN * k
    out = V((math.cos(a), math.sin(a), 0)); t = V((-math.sin(a), math.cos(a), 0))
    return out * R * math.cos(SPAN / 2), t, out, V((0, 0, 1))

def frame_ring(m, c, ax, r, w, h, n=24, name="cage frame"):
    """a ring frame round axis ax at c: a rectangular section, h deep (inwards from r) and w wide along ax"""
    ax = V(ax).normalized(); u0 = ax.orthogonal().normalized(); w0 = ax.cross(u0)
    bm = bmesh.new()
    rows = []
    for j in range(n):
        a = 2 * math.pi * j / n; d = u0 * math.cos(a) + w0 * math.sin(a)
        rows.append([bm.verts.new(c + d * rr + ax * s) for rr, s in ((r - h, -w / 2), (r, -w / 2), (r, w / 2), (r - h, w / 2))])
    for j in range(n):
        A, B = rows[j], rows[(j + 1) % n]
        for q in range(4): bm.faces.new((A[q], A[(q + 1) % 4], B[(q + 1) % 4], B[q]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); C.objects.link(o)
    me.materials.append(m)
    return o

def cage(c, t, out, up, body):
    """a module's primary structure, inside its hull: ring frames along it (narrower ones in its conical ends) and the
    longerons between them"""
    for j in range(6):
        frame_ring(M["cage"], c + t * (-body + 2 * body * j / 5), t, MR * 0.985, 0.004, 0.006)
    for s in (-1, 1): frame_ring(M["cage"], c + t * s * (body + 0.022), t, MR * 0.74, 0.004, 0.006)
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8; d = out * math.cos(a) + up * math.sin(a)
        rod(C, M["cage"], c - t * body + d * MR * 0.95, c + t * body + d * MR * 0.95, 0.0019, n=4, name="cage longeron")

def module(k, kind):
    c, t, out, up = bay_frame(k)
    half = R * math.sin(SPAN / 2)          # half the chord
    body = half - NR * 1.05 - 0.034          # where the conical ends start
    cage(c, t, out, up, body)
    tube(M["blanket"], MR, c - t * body, c + t * body, n=64, tile=0.16, caps=False, name=kind)
    for s in (-1, 1):
        e = c + t * s * body
        cone = M["gold"] if kind == "lab" else M["blanket"]
        tube(cone, MR, e, e + t * s * 0.026, n=64, tile=0.08, r2=MR * 0.7, caps=False, name="end cone")
        cbm(e + t * s * 0.031, t * s, MR * 0.66)
    # handrails along the top, either side
    for side in (-1, 1):
        p = c + up * MR * 0.93 + out * side * MR * 0.36
        handrail(p - t * body * 0.8, p + t * body * 0.8, up * 0.93 + out * side * 0.36)
    # a cable run along the inner side, and one along the bottom
    for d in (-out, -up):
        p = c + d.normalized() * (MR + 0.003)
        rod(C, M["black"], p - t * body, p + t * body, 0.0022, n=6, name="cable run")
    if kind == "hab":
        # a few small windows looking out, and down onto the ring's own world
        for j in (-0.5, 0.0, 0.5):
            window(c + out * MR + t * body * j * 0.8 + up * 0.012, out)
        window(c + up * MR + t * body * 0.25, up, r=0.011)
        grapple(c + up * (MR + 0.001) - t * body * 0.45, up)
        # a small dish on a short mast
        p = c + up * MR - t * body * 0.1 + out * 0.03
        rod(C, M["alu plain"], p, p + up * 0.035, 0.003, n=8, name="antenna mast")
        dish(C, M["radiator"], 0.018, 0.006, at=p + up * 0.038, facing=(up + out * 0.4).normalized(), n=24, k=6, thick=0.002, name="antenna dish")
    elif kind == "lab":
        # an exposed platform on its outer face carrying experiment boxes in blankets and foil
        base = c + out * (MR + 0.012)
        slab(M["alu"], (0.004, body * 1.3, 0.09), base, (out, t, up), 0.08, name="platform")
        for j, (mm, h) in enumerate(((M["blanket"], 0.024), (M["gold"], 0.018), (M["blanket"], 0.03), (M["silver"], 0.02))):
            y = (j - 1.5) * body * 0.32
            slab(mm, (h, body * 0.26, 0.07), base + out * (0.002 + h / 2) + t * y, (out, t, up), 0.08 if mm is M["blanket"] else 0.05, name="experiment")
        grapple(c + up * (MR + 0.001) + t * body * 0.4, up)
    else:
        # power: a solar array wing above and below the ring's plane, each a pair of cell blankets either side of a
        # lattice mast, a blanket box at its root; and two RCS blocks
        for s in (-1, 1):
            p = c + up * s * MR
            rod(C, M["alu plain"], p, p + up * s * 0.03, 0.005, n=8, name="wing gimbal")
            slab(M["blanket"], (0.02, 0.05, 0.02), p + up * s * 0.04, (out, t, up), 0.08, name="wing box")
            truss(C, M["alu plain"], p + up * s * 0.05, p + up * s * 0.34, 0.008, 12, 0.0012, name="wing mast")
            for side in (-1, 1):
                slab(M["solar"], (0.0025, 0.07, 0.28), p + up * s * 0.195 + t * side * 0.042, (out, t, up), 0.056, name="solar wing")
                slab(M["gold"], (0.003, 0.074, 0.006), p + up * s * 0.338 + t * side * 0.042, (out, t, up), 0.05, name="wing tip bar")
        for s in (-1, 1):
            p = c + out * (MR * 0.75) + t * s * body * 0.6 + up * MR * 0.6
            slab(M["dark"], (0.016, 0.016, 0.016), p, (out, t, up), 1, name="rcs block", bevel=0.002)
            for d in (out, up, t * s):
                tube(M["black"], 0.0028, p + d * 0.008, p + d * 0.016, n=10, r2=0.0045, caps=False, name="rcs nozzle")

def node(k):
    """the node at the join between bay k and bay k+1: a short drum with blankets, on the ring"""
    a = SPAN * (k + 0.5)
    out = V((math.cos(a), math.sin(a), 0)); t = V((-math.sin(a), math.cos(a), 0)); c = out * R
    tube(M["blanket"], NR, c - t * NR * 0.95, c + t * NR * 0.95, n=56, tile=0.16, name="node")
    for s in (-1, 1):
        tube(M["alu plain"], NR * 1.02, c + t * s * NR * 0.95 - t * s * 0.006, c + t * s * NR * 0.95, n=56, caps=False, name="node seam")

kinds = ["hab", "lab", "thermal"]

# ---------------------------------------------------------------- spokes: a lattice truss and a transit tube each
HUB_R = 0.15
def spoke(i):
    a = SPAN * (3 * i + 1.5)                 # to the node between bays 3i+1 and 3i+2
    d = V((math.cos(a), math.sin(a), 0)); side = V((0, 0, 1)).cross(d)
    r0, r1 = HUB_R + 0.01, R - NR
    truss(C, M["alu plain"], d * r0 + side * 0.05, d * r1 + side * 0.05, 0.05, 14, 0.0028, name="spoke truss")
    tube(M["blanket"], 0.026, d * r0 - side * 0.012, d * r1 - side * 0.012, n=40, tile=0.12, name="transit tube")
    for k in range(1, 7):
        p = d * (r0 + (r1 - r0) * k / 7) - side * 0.012
        tube(M["alu plain"], 0.0285, p - d * 0.004, p + d * 0.004, n=40, caps=False, name="tube seam")
    rod(C, M["black"], d * r0 + side * 0.05 + V((0, 0, 0.03)), d * r1 + side * 0.05 + V((0, 0, 0.03)), 0.0035, n=6, name="cable tray")

def frame(i):
    """quarter i's frame: its spoke, and the three nodes its bays berth between (the ring grows round from bay 0, so a
    quarter's last node is where the next one's first bay berths, and the fourth's closes the ring on bay 0)"""
    spoke(i)
    for k in range(3 * i, 3 * i + 3): node(k)

for i in range(4):
    piece("frame-%d" % i, frame, i)
    for k in range(3 * i, 3 * i + 3): piece("bay-%d" % k, module, k, kinds[k % 3])

# ---------------------------------------------------------------- the hub
tube(M["blanket"], HUB_R, (0, 0, -0.26), (0, 0, 0.26), n=96, tile=0.16, name="hub")
for z in (-0.26, -0.09, 0.09, 0.26):
    tube(M["alu plain"], HUB_R * 1.012, (0, 0, z - 0.005), (0, 0, z + 0.005), n=96, caps=False, name="hub seam")
for i in range(4):
    a = SPAN * (3 * i + 1.5)
    d = V((math.cos(a), math.sin(a), 0))
    cbm(d * (HUB_R + 0.006), d, 0.045)
    handrail(d.cross(V((0, 0, 1))) * 0.03 + d * HUB_R + V((0, 0, -0.22)), d.cross(V((0, 0, 1))) * 0.03 + d * HUB_R + V((0, 0, 0.22)), d)
# forward: a docking adapter in blankets with a gold-foil band, its ring
tube(M["blanket"], 0.11, (0, 0, 0.26), (0, 0, 0.36), n=72, tile=0.16, r2=0.075, caps=False, name="adapter")
tube(M["gold"], 0.1, (0, 0, 0.29), (0, 0, 0.31), n=72, tile=0.06, r2=0.092, caps=False, name="adapter band")
cbm((0, 0, 0.365), (0, 0, 1), 0.072)
tube(M["dark"], 0.06, (0, 0, 0.36), (0, 0, 0.372), n=48, name="docking hatch")
# aft: a mast to the solar wings and a dish
tube(M["silver"], 0.06, (0, 0, -0.26), (0, 0, -0.3), n=48, tile=0.06, r2=0.04, caps=False, name="aft cone")
tube(M["alu plain"], 0.03, (0, 0, -0.3), (0, 0, -0.62), n=32, name="aft mast")
for s in (-1, 1):
    # a radiator pair on the aft mast, edge on to the ring
    rod(C, M["alu plain"], (0, 0, -0.46), (s * 0.06, 0, -0.46), 0.004, n=8, name="radiator arm")
    for i in range(2):
        slab(M["radiator"], (0.1, 0.003, 0.07), (s * (0.115 + i * 0.105), 0, -0.46), ((1, 0, 0), (0, 1, 0), (0, 0, 1)), 0.08, name="radiator panel")
dish(C, M["radiator"], 0.075, 0.024, at=(0, 0, -0.64), facing=(0, 0, -1), n=48, k=10, thick=0.003, name="dish")

apply_all(C)
print("parts", len(C.all_objects), "tris", tri_count(C))

# ---------------------------------------------------------------- the build: when each part appears as Work builds it
# Each vertex's time in the build (glTF's _BUILD), from 0 (there from the start: the core) to 1 (the ring closed);
# quarter i builds over [i/4, (i+1)/4], and the site shows what's built by then. A quarter's spoke runs out from the hub,
# then its skeleton (ring frames, longerons and nodes) runs along the ring both ways from where the spoke meets it, then
# the hull closes over that with the fittings just behind, and last its solar wings' masts run out. Times run along
# each part, so a long face reveals as the build passes along it.
SPOKE = {"transit tube", "tube seam", "cable tray"}
SKELETON = {"cage frame", "cage longeron", "node", "node seam"}
FITTING = {"handrail", "handrail post", "cable run", "window", "window frame", "grapple base", "grapple pin", "antenna mast",
           "antenna dish", "platform", "experiment", "rcs block", "rcs nozzle"}
WING = {"wing gimbal", "wing box", "wing mast", "solar wing", "wing tip bar"}
clamp = lambda x: max(0.0, min(1.0, x))

def build_time(p, i, kind):
    s = SPAN * (3 * i + 1.5)                                  # where the quarter's spoke meets the ring
    d = (math.atan2(p.y, p.x) - s + math.pi) % (2 * math.pi) - math.pi
    f = clamp(d / (SPAN * 1.1) if d > 0 else -d / (SPAN * 2.0))   # out along the ring from it, 0 to 1 at either end
    out = clamp((math.hypot(p.x, p.y) - (HUB_R + 0.01)) / (R - NR - HUB_R - 0.01))
    if kind == "spoke truss": u = 0.28 * out
    elif kind in SPOKE: u = 0.06 + 0.28 * out
    elif kind in SKELETON: u = 0.34 + 0.22 * f
    elif kind in WING: u = 0.86 + 0.14 * clamp((abs(p.z) - MR - 0.03) / 0.31)
    elif kind in FITTING: u = 0.56 + 0.28 * f
    else: u = 0.5 + 0.28 * f                                  # the hull: modules, their ends and berthing rings
    return (i + u) / 4

def stamp_build():
    for o in C.all_objects:
        if o.type != "MESH": continue
        me = o.data
        a = me.attributes.get("_BUILD") or me.attributes.new("_BUILD", "FLOAT", "POINT")
        if "piece" not in o: vals = [0.0] * len(me.vertices)
        else:
            i = int(o["piece"].split("-")[1]); i = i // 3 if o["piece"].startswith("bay") else i
            kind = o.name.split(".")[0]
            vals = [build_time(o.matrix_world @ v.co, i, kind) for v in me.vertices]
        a.data.foreach_set("value", vals)

# ---------------------------------------------------------------- the shot: the same camera and light as the three.js render
def look(o, at, up=(0, 0, 1)):
    d = V(at) - o.location
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

cam = bpy.data.cameras.new("cam"); cam.sensor_fit = "VERTICAL"; cam.angle_y = math.radians(SHOT["vfov"])
cam.clip_start = 0.01; cam.clip_end = 100
co = bpy.data.objects.new("cam", cam); SC.collection.objects.link(co); SC.camera = co
co.location = V(SHOT["cam"]); look(co, SHOT["target"])
sun = bpy.data.lights.new("sun", "SUN"); sun.energy = SHOT["key"]; sun.angle = math.radians(0.53); sun.color = SHOT.get("key_rgb", (1, 1, 1))
so = bpy.data.objects.new("sun", sun); SC.collection.objects.link(so)
so.rotation_euler = V(SHOT["to_sun"]).to_track_quat("Z", "Y").to_euler()
w = SC.world or bpy.data.worlds.new("World"); SC.world = w; w.use_nodes = True
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (*SHOT["fill_rgb"], 1); bg.inputs["Strength"].default_value = SHOT["fill"]

SC.render.resolution_x, SC.render.resolution_y = SHOT["res"]
SC.render.resolution_percentage = int(os.environ.get("PCT", "100"))
SC.render.film_transparent = True
SC.render.image_settings.file_format = "PNG"; SC.render.image_settings.color_mode = "RGBA"
try: SC.view_settings.view_transform = "Khronos PBR Neutral"
except Exception as e: print("view transform", e)
SC.view_settings.look = "None"; SC.view_settings.exposure = 0; SC.view_settings.gamma = 1

def part(ship, names):
    """parts each named piece off the joined ship as its own object, its origin at its middle (so the site can fly it
    in), sharing the ship's occlusion map; the core stays, its origin the hub's"""
    out = []
    for name in names:
        bpy.ops.object.select_all(action="DESELECT"); ship.select_set(True); bpy.context.view_layer.objects.active = ship
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.vertex_group_set_active(group=name)
        bpy.ops.object.vertex_group_select()
        bpy.ops.mesh.separate(type="SELECTED")
        bpy.ops.object.mode_set(mode="OBJECT")
        p = next(o for o in bpy.context.selected_objects if o is not ship)
        p.name = name
        bpy.ops.object.select_all(action="DESELECT"); p.select_set(True); bpy.context.view_layer.objects.active = p
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
        out.append(p)
    SC.cursor.location = (0, 0, 0)
    bpy.ops.object.select_all(action="DESELECT"); ship.select_set(True); bpy.context.view_layer.objects.active = ship
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    for o in (ship, *out): o.vertex_groups.clear()
    return out

def cycles(samples):
    SC.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"; prefs.get_devices()
    for d in prefs.devices: d.use = True
    SC.cycles.device = "GPU"; SC.cycles.samples = samples; SC.cycles.use_denoising = True
    SC.cycles.max_bounces = 8

if MODE == "preview":
    cycles(int(os.environ.get("SAMPLES", "24")))
    SC.render.filepath = OUT + os.environ.get("NAME", "preview") + ".png"
    bpy.ops.render.render(write_still=True)
elif MODE == "frames":
    # each framing in shot.json's "alts", for choosing one
    cycles(int(os.environ.get("SAMPLES", "16")))
    for i, alt in enumerate(SHOT["alts"]):
        co.location = V(alt["cam"]); look(co, alt["target"])
        if "vfov" in alt: cam.angle_y = math.radians(alt["vfov"])
        SC.render.filepath = OUT + "frame-%d.png" % i
        bpy.ops.render.render(write_still=True)
elif MODE == "cycles":
    cycles(int(os.environ.get("SAMPLES", "256")))
    SC.render.filepath = OUT + os.environ.get("NAME", "cycles") + ".png"
    bpy.ops.render.render(write_still=True)
elif MODE == "site":
    # the site's model (public/voyage/ship/real.glb via site.sh): the visitor (a crew capsule, its own node, which the
    # site flies in to the docking port), occlusion baked, scaled to a bounding radius of 1 round the hub (the model's
    # origin, so it turns true), +y the ring's axis
    VC = coll("visitor")
    _C = C; C = VC
    VM = {
        "white": plain("visitor white", "#dcdee2", 0.0, 0.4), "shield": plain("visitor shield", "#1d1b1a", 0.1, 0.75),
        "solar": plain("visitor solar", "#16224a", 0.4, 0.2), "dark": plain("visitor dark", "#34363c", 0.35, 0.42),
    }
    VM["window"] = plain("visitor window", "#2a2216", 0.0, 0.3)
    VM["strobe"] = plain("visitor strobe", "#202020", 0.0, 0.4)
    for k, (col, strength) in {"window": ("#ffcf8f", 3.0), "strobe": ("#ffffff", 10.0)}.items():
        b = next(n for n in VM[k].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        b.inputs["Emission Color"].default_value = srgb(col); b.inputs["Emission Strength"].default_value = strength
    VP = [cyl(C, VM["white"], 0.021, 0.026, at=(0, 0, 0.013), n=40, r2=0.012, name="capsule")]
    VP.append(cyl(C, VM["shield"], 0.0215, 0.003, at=(0, 0, -0.0005), n=40, name="heat shield"))
    VP.append(cyl(C, VM["white"], 0.0205, 0.024, at=(0, 0, -0.014), n=40, name="trunk"))
    VP.append(cyl(C, VM["solar"], 0.0207, 0.016, at=(0, 0, -0.016), n=40, name="trunk cells"))
    VP.append(torus(C, VM["dark"], 0.0085, 0.0015, at=(0, 0, 0.0265), n=24, k=6, name="capsule dock"))
    VP.append(cyl(C, VM["dark"], 0.0075, 0.002, at=(0, 0, 0.0265), n=20, name="capsule hatch"))
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        VP.append(box(C, VM["dark"], (0.004, 0.004, 0.005), at=(0.0185 * math.cos(a), 0.0185 * math.sin(a), 0.008), name="capsule rcs"))
    for a in (0.4, -0.4):
        VP.append(box(C, VM["window"], (0.0035, 0.0012, 0.0045), at=(0.0168 * math.cos(a), 0.0168 * math.sin(a), 0.012), rot=(0, 0.35, a), name="capsule window"))
    VP.append(sphere(C, VM["strobe"], 0.0016, at=(0, 0.019, 0.004), n=8, name="capsule strobe"))
    cap = join(VP, "visitor")
    apply_all(VC)
    # docked: its nose in the hub's docking ring, pointing aft along the axis
    cap.rotation_euler = (math.pi, 0, 0)
    cap.location = (0, 0, 0.372 + 0.0265)
    C = _C
    stamp_build()
    # each piece's vertices go in a group of its name, so it can be parted off again once the bake has joined them
    for o in C.all_objects:
        if o.type == "MESH" and "piece" in o:
            o.vertex_groups.new(name=o["piece"]).add(range(len(o.data.vertices)), 1.0, "REPLACE")
    ship, image = bake_ao(C, OUT + "real-ao.png", size=2048, samples=128, distance=0.2)
    # the skeleton is seen only before the hull closes over it, so the occlusion baked inside the hull isn't its own
    nt = M["cage"].node_tree
    for n in [n for n in nt.nodes if n.type == "GROUP" and n.node_tree and n.node_tree.name == "glTF Material Output"]: nt.nodes.remove(n)
    # scaled round the hub, not the box's middle: the site turns the model about its origin
    Rb = max((ship.matrix_world @ v.co).length for v in ship.data.vertices)
    parts = [ship] + part(ship, PIECES)
    ship.name = "core"
    root = bpy.data.objects.new("real", None); C.objects.link(root)
    for p in parts: p.parent = root
    cap.parent = root
    root.scale = (1 / Rb, 1 / Rb, 1 / Rb)
    rim = R * math.cos(SPAN / 2) + MR
    print("R", Rb, "rim", rim, "RIM_FRACTION", rim / Rb, "dock", (0.372 + 0.0265) / Rb)
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, cap, *parts): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "real.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_attributes=True)
    print("exported")
elif MODE == "export":
    ship, image = bake_ao(C, OUT + "ring-irl-ao.png", size=4096, samples=128, distance=0.2)
    bpy.ops.object.select_all(action="DESELECT"); ship.select_set(True); bpy.context.view_layer.objects.active = ship
    bpy.ops.export_scene.gltf(filepath=OUT + "ring-irl.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_tangents=True)
    print("exported")
