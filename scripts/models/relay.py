"""The relay (Work as a chain of relays, round 1): Janriz, 2026-10-10, on Work's docks: "It would be nice if they're like
'jump points' or something where one goes to the other. Think Mass Effect." Our own relay in that spirit, built from
the station's materials so it belongs to the same world. Run headless, its own Blender process
(`scripts/models/build.sh relay`).

Blender's +y is the way it throws (glTF's -z). From the back:
- the spine: a lattice truss carrying a power module, two radiator wings and a reactor drum;
- the yoke: a crossbar and two arms reaching forward past the gimbal, holding its bearings;
- the gimbal: the outer ring turns on the arms' bearings (about x), the inner ring turns inside it (about the outer
  ring's own z); both are box-section rings in blankets, with copper windings and an emitter strip facing the core;
- the core: a sphere of light, held in the gimbal's middle;
- the throw (VARIANT): "barrel", six coils closing in round the axis that you're thrown down, or "rails", the arms
  running on forward and closing in, lined with coils on their inner faces.

Parts are separate nodes so the site can turn them: frame (spine, yoke, throw), ringA (outer), ringB (inner, a child of
ringA), core. Each emitter (the rings' strips, each coil) has its own material, so the site can light them in turn.

MODE: "preview" (Cycles, a few cameras), "export" (bakes occlusion per part, writes out/relay-<VARIANT>.raw.glb).
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)) + "/"
exec(open(HERE + "shiplib.py").read())
V = Vector
TEX = HERE + "tex/"

# leaner than shiplib's, for the site: a relay is mostly thin rods, and thin rods drawn in many sides cost the GPU far
# more than they show (measured: the full relay held in frame cost ~5 ms a frame at 1440, most of it its trusses)
_rod = rod
def rod(c, m, a, b, r, n=5, name="rod"):
    return _rod(c, m, a, b, r, n=min(n, 5), name=name)
def truss(c, m, a, b, w, bays, r, name="truss"):
    """a square lattice truss from a to b, w across, in `bays` bays: four longerons, battens and diagonals"""
    a, b = Vector(a), Vector(b); d = (b - a).normalized()
    u = d.orthogonal().normalized(); v = d.cross(u).normalized()
    corners = [(u + v), (u - v), (-u - v), (-u + v)]
    parts = []
    for k in corners: parts.append(rod(c, m, a + k * w / 2, b + k * w / 2, r, n=5, name=name))
    for i in range(bays + 1):
        p = a + (b - a) * (i / bays)
        for j in range(4):
            parts.append(rod(c, m, p + corners[j] * w / 2, p + corners[(j + 1) % 4] * w / 2, r * 0.7, n=4, name=name))
        if i < bays:
            q = a + (b - a) * ((i + 1) / bays)
            for j in range(4):
                parts.append(rod(c, m, p + corners[j] * w / 2, q + corners[(j + 1) % 4] * w / 2, r * 0.6, n=4, name=name))
    return join(parts, name)
OUT = HERE + "out/"
os.makedirs(OUT, exist_ok=True)
MODE = os.environ.get("MODE", "preview")
VARIANT = os.environ.get("VARIANT", "barrel")

clear()
SC = bpy.context.scene
PARTS = {k: coll(k) for k in ("frame", "ringA", "ringB", "core", "parts")}
C = PARTS["frame"]

# ---------------------------------------------------------------- materials: the station's maps
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

def surface(name, tex, metal=0.0, normal=1.0):
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

def plain(name, rgb, metal=0.0, rough=0.5, emit=None, strength=0.0):
    m, nt, b = principled(name)
    b.inputs["Base Color"].default_value = srgb(rgb)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit); b.inputs["Emission Strength"].default_value = strength
    return m

M = {
    "blanket": surface("mmod blanket", "blanket", normal=1.0),
    "gold": surface("gold foil", "gold", metal=0.35, normal=0.45),
    "silver": surface("silver foil", "silver", metal=1.0, normal=0.35),
    "alu": surface("aluminium", "alu", metal=1.0, normal=0.4),
    "radiator": surface("radiator", "radiator", normal=0.8),
    # fittings mostly diffuse, as on the station: a mirror metal in space reflects black
    "alu plain": plain("aluminium plain", "#a9acb1", 0.4, 0.48),
    "dark": plain("dark metal", "#3a3c41", 0.6, 0.4),
    "black": plain("black anodised", "#18191c", 0.3, 0.55),
    "rail": plain("handrail", "#c79a3e", 0.0, 0.45),
    "grey": plain("grey paint", "#8d9096", 0.0, 0.5),
    "copper": plain("copper windings", "#b8734a", 0.5, 0.42),
    "core": plain("core", "#ffffff", 0.0, 0.5, emit="#cfe6ff", strength=12.0),
    "nav red": plain("nav red", "#200000", 0.0, 0.4, emit="#ff3b2e", strength=6.0),
    "nav green": plain("nav green", "#002000", 0.0, 0.4, emit="#3bff6a", strength=6.0),
}
CHARGE = float(os.environ.get("CHARGE", "0"))
EMITTERS = []
def emitter(name):
    """an emitter strip's own material, so the site can light each in turn: dark at rest, lit as the relay charges. Each
    is a shade apart from the others, or the compressor merges them into one"""
    k = len(EMITTERS); EMITTERS.append(name)
    return plain("emitter " + name, "#10161e", 0.3, 0.35 + 0.002 * k, emit="#9fd0ff", strength=6.0 * CHARGE)

# ---------------------------------------------------------------- geometry with real UVs
def tube(m, r, a, b, n=48, tile=0.16, r2=None, caps=True, name="tube"):
    """a cylinder (a frustum with r2) from a to b, UVs in world units / tile, a whole number of tiles round it"""
    a, b = V(a), V(b); d = b - a; ln = d.length; ax = d.normalized()
    u0 = ax.orthogonal().normalized(); w0 = ax.cross(u0)
    rb = r if r2 is None else r2
    n = max(12, int(n * 0.67))
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

def hoop(m, R, w, h, axis, center=(0, 0, 0), a0=0.0, a1=2 * math.pi, ref=None, tile=0.1, seg=None, name="hoop"):
    """a ring of rectangular section (w across, radially; h along the axis) round `axis` through `center`, from angle a0
    to a1 (measured from `ref`); each side its own strip, smooth along the ring and sharp at its corners"""
    N = V(axis).normalized(); C0 = V(center)
    u = V(ref) if ref is not None else N.orthogonal()
    u = (u - N * u.dot(N)).normalized(); v = N.cross(u)
    span = a1 - a0; full = abs(abs(span) - 2 * math.pi) < 1e-6
    seg = seg or max(6, int(abs(span) / (2 * math.pi) * 104))
    prof = [(R - w / 2, -h / 2), (R + w / 2, -h / 2), (R + w / 2, h / 2), (R - w / 2, h / 2)]
    outs = [lambda d: -N, lambda d: d, lambda d: N, lambda d: -d]
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    P = lambda a, r, z: C0 + (u * math.cos(a) + v * math.sin(a)) * r + N * z
    acc = 0.0
    for s in range(4):
        (r0, z0), (r1, z1) = prof[s], prof[(s + 1) % 4]
        L = math.hypot(r1 - r0, z1 - z0)
        strip = [(bm.verts.new(P(a0 + span * i / seg, r0, z0)), bm.verts.new(P(a0 + span * i / seg, r1, z1))) for i in range(seg + 1)]
        # each vert's place on the map: along the ring (its index), and round the section
        where = {}
        for i, (va, vb) in enumerate(strip):
            where[va] = (R * abs(span) * i / seg / tile, acc / tile); where[vb] = (R * abs(span) * i / seg / tile, (acc + L) / tile)
        for i in range(seg):
            f = bm.faces.new((strip[i][0], strip[i][1], strip[i + 1][1], strip[i + 1][0])); f.smooth = True
            am = a0 + span * (i + 0.5) / seg
            f.normal_update()
            if f.normal.dot(outs[s](u * math.cos(am) + v * math.sin(am))) < 0: f.normal_flip()
            for loop in f.loops: loop[uvl].uv = where[loop.vert]
        acc += L
    if not full:
        for a, sgn in ((a0, -1), (a1, 1)):
            vs = [bm.verts.new(P(a, r, z)) for r, z in prof]
            f = bm.faces.new(vs); f.smooth = False
            f.normal_update()
            tdir = (-u * math.sin(a) + v * math.cos(a)) * (1 if span > 0 else -1) * sgn
            if f.normal.dot(tdir) < 0: f.normal_flip()
            for loop in f.loops:
                p = loop.vert.co - C0
                loop[uvl].uv = (p.dot(u) / tile, p.dot(N) / tile)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); C.objects.link(o)
    me.materials.append(m)
    return o

def slab(m, size, at, axes, tile, name="slab", bevel=0.0):
    """a box of `size` along the given axes (three unit vectors), box-projected UVs at one tile per `tile`"""
    o = box(C, m, size, at=(0, 0, 0), name=name, bevel=bevel)
    x, y, z = (V(a).normalized() for a in axes)
    o.matrix_world = Matrix((x, y, z)).transposed().to_4x4()
    o.location = V(at)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    if any(n.type == "TEX_IMAGE" for n in m.node_tree.nodes): cube_uv(o, tile)
    return o

def beam(m, a, b, w, h, up=(0, 0, 1), tile=0.12, name="beam"):
    """a box-section beam from a to b, w across and h along `up`"""
    a, b = V(a), V(b); d = (b - a).normalized(); z = V(up); z = (z - d * z.dot(d)).normalized(); y = z.cross(d)
    return slab(m, ((b - a).length, w, h), (a + b) / 2, (d, y, z), tile, name=name)

def handrail(a, b, out, lift=0.012):
    a, b, out = V(a), V(b), V(out).normalized()
    rod(C, M["rail"], a + out * lift, b + out * lift, 0.0024, n=4, name="handrail")
    for k in range(5):
        p = a + (b - a) * (k / 4)
        rod(C, M["rail"], p, p + out * lift, 0.0018, n=4, name="handrail post")

def cbm(at, axis, r):
    """a common berthing mechanism: a machined ring with its latches"""
    ax = V(axis).normalized()
    tube(M["alu plain"], r, V(at) - ax * 0.008, V(at) + ax * 0.008, n=48, name="berthing ring")
    u = ax.orthogonal().normalized(); w = ax.cross(u)
    for k in range(8):
        t = 2 * math.pi * k / 8
        d = u * math.cos(t) + w * math.sin(t)
        slab(M["dark"], (0.008, 0.008, 0.013), V(at) + d * (r + 0.003), (d, d.cross(ax), ax), 1, name="latch")

def rcs(p, out, side):
    """a reaction-control block: a dark cube with three nozzles"""
    p, out, side = V(p), V(out).normalized(), V(side).normalized()
    up = out.cross(side).normalized()
    slab(M["dark"], (0.03, 0.03, 0.03), p, (out, side, up), 1, name="rcs block", bevel=0.003)
    for d in (out, side, up):
        tube(M["black"], 0.005, p + d * 0.015, p + d * 0.03, n=10, r2=0.008, caps=False, name="rcs nozzle")

# ---------------------------------------------------------------- the gimbal: two rings round the core
X, Y, Z = V((1, 0, 0)), V((0, 1, 0)), V((0, 0, 1))
RA, WA, HA = 0.78, 0.07, 0.12     # outer ring: radius, section across, section along its axis
RB, WB, HB = 0.6, 0.06, 0.1      # inner ring
CORE_R = 0.1

def gimbal_ring(R, w, h, N, ref, pivots, emit, segs=16):
    """a ring in blanketed box segments with machined joints, a dark machined inner face carrying an emitter strip that
    looks at the core, handrails, latches and a few RCS blocks outside; `pivots` are the angles where bearings stand"""
    N = V(N); ref = V(ref); v = N.cross(ref)
    gap = 0.01
    dirn = lambda a: ref * math.cos(a) + v * math.sin(a)
    for k in range(segs):
        a0 = 2 * math.pi * k / segs; a1 = 2 * math.pi * (k + 1) / segs
        hoop(M["blanket"], R + 0.006, w - 0.012, h, N, a0=a0 + gap / R, a1=a1 - gap / R, ref=ref, tile=0.035, name="ring segment")
        hoop(M["dark"], R - w / 2 + 0.006, 0.012, h * 0.92, N, a0=a0 + gap / R, a1=a1 - gap / R, ref=ref, name="ring inner face")
        hoop(M["alu plain"], R, w * 1.08, h * 1.06, N, a0=a1 - gap / R * 1.4, a1=a1 + gap / R * 1.4, ref=ref, seg=4, name="ring joint")
        mid = (a0 + a1) / 2
        near_pivot = any(abs(math.remainder(mid - p, 2 * math.pi)) < 0.3 for p in pivots)
        # latches either side of each joint, on both faces
        for zs in (-1, 1):
            for da in (-0.035, 0.035):
                d = dirn(a1 + da)
                slab(M["dark"], (0.012, 0.012, 0.008), d * (R + w * 0.2) + N * zs * (h / 2 + 0.004), (d, N.cross(d), N), 1, name="latch")
        if near_pivot: continue
        d = dirn(mid)
        if k % 2 == 1:
            p0, p1 = dirn(a0 + 0.06), dirn(a1 - 0.06)
            handrail(p0 * (R + w / 2) + N * h * 0.28, p1 * (R + w / 2) + N * h * 0.28, d)
            handrail(p0 * (R + w / 2) - N * h * 0.28, p1 * (R + w / 2) - N * h * 0.28, d)
        if k % 4 == 0:
            p0, p1 = dirn(a0 + 0.04), dirn(a1 - 0.04)
            rod(C, M["black"], p0 * R + N * (h / 2 + 0.006), p1 * R + N * (h / 2 + 0.006), 0.004, n=6, name="cable run")
            # a grapple fixture and a small foil-wrapped box on the outer face
            slab(M["gold"], (0.03, 0.06, 0.05), d * (R + w / 2 + 0.015) + N * h * 0.12, (d, N.cross(d), N), 0.05, name="oru")
        if k % 4 == 2:
            rcs(d * (R + w / 2 + 0.018), d, N.cross(d))
    hoop(emit, R - w / 2 - 0.002, 0.006, h * 0.22, N, ref=ref, tile=0.1, name="emitter strip")
    for p in pivots:
        d = dirn(p)
        tube(M["dark"], h * 0.62, d * (R - w / 2 - 0.004), d * (R + w / 2 + 0.006), n=40, name="bearing")
        tube(M["alu plain"], h * 0.66, d * (R + w / 2), d * (R + w / 2 + 0.012), n=40, caps=False, name="bearing band")

# outer ring (ringA): its plane holds x (the arms' bearings) and z (the inner ring's bearings); it turns about x
C = PARTS["ringA"]
gimbal_ring(RA, WA, HA, Y, X, pivots=[0, math.pi, math.pi / 2, 3 * math.pi / 2], emit=emitter("ring outer"))
for s in (-1, 1):
    # its axles out to the yoke's bearings
    tube(M["alu plain"], 0.034, X * s * (RA + WA / 2), X * s * 0.9, n=32, name="axle")
# inner ring (ringB): at rest in the y-z plane, turning about the outer ring's z
C = PARTS["ringB"]
gimbal_ring(RB, WB, HB, X, Y, pivots=[math.pi / 2, 3 * math.pi / 2], emit=emitter("ring inner"))
for s in (-1, 1):
    tube(M["alu plain"], 0.028, Z * s * (RB + WB / 2), Z * s * (RA - WA / 2), n=32, name="axle")
# the core
C = PARTS["core"]
sphere(C, M["core"], CORE_R, n=48, name="core")

# ---------------------------------------------------------------- the frame: yoke, spine, throw
C = PARTS["frame"]
ARM_X, BACK = 0.98, -0.95
FRONT = 1.55 if VARIANT == "barrel" else 0.55
# the yoke: lattice trusses, as long spans in space are, a crossbar behind the gimbal's sweep and two arms forward to
# the bearings; equipment boxes and cable trays ride them
TW = 0.15
def oru(at, out, along, size=(0.045, 0.1, 0.07), m=None):
    """an equipment box on a truss face, in blankets or foil, with a grapple pin"""
    out, along = V(out).normalized(), V(along).normalized(); up = out.cross(along)
    slab(m or M["grey"], size, V(at) + out * size[0] / 2, (out, along, up), 0.04, name="oru")
    tube(M["black"], 0.004, V(at) + out * size[0], V(at) + out * (size[0] + 0.014), n=8, name="grapple pin")
truss(C, M["alu plain"], (-ARM_X, BACK, 0), (ARM_X, BACK, 0), TW, 14, 0.006, name="crossbar")
for s in (-1, 1):
    truss(C, M["alu plain"], (s * ARM_X, BACK, 0), (s * ARM_X, FRONT, 0), TW, 16, 0.006, name="arm")
    # the corner, where arm meets crossbar: a blanketed node
    tube(M["blanket"], 0.12, (s * ARM_X, BACK, -0.13), (s * ARM_X, BACK, 0.13), n=64, tile=0.04, name="corner node")
    for zz in (-0.13, 0.13): tube(M["alu plain"], 0.124, (s * ARM_X, BACK, zz - 0.008), (s * ARM_X, BACK, zz + 0.008), n=64, caps=False, name="node seam")
    # the bearing the outer ring turns in, its drive outboard in gold foil
    tube(M["dark"], 0.115, (s * (ARM_X - 0.09), 0, 0), (s * (ARM_X + 0.09), 0, 0), n=48, name="yoke bearing")
    for x in (ARM_X - 0.09, ARM_X + 0.09):
        tube(M["alu plain"], 0.122, (s * (x - 0.008), 0, 0), (s * (x + 0.008), 0, 0), n=48, caps=False, name="yoke bearing band")
    tube(M["gold"], 0.1, (s * (ARM_X + 0.09), 0, 0), (s * (ARM_X + 0.2), 0, 0), n=48, tile=0.05, r2=0.075, name="drive housing")
    # equipment along the arm's outer face, a cable tray on top
    for y, mm in ((BACK + 0.32, M["grey"]), (-0.42, M["gold"]), (0.42, M["grey"]), (FRONT - 0.25, M["silver"])):
        oru((s * (ARM_X + TW / 2), y, -0.02), (s, 0, 0), (0, 1, 0), m=mm)
    rod(C, M["black"], (s * ARM_X, BACK + 0.08, TW / 2 + 0.012), (s * ARM_X, -0.14, TW / 2 + 0.012), 0.007, n=6, name="cable tray")
    rod(C, M["black"], (s * ARM_X, 0.14, TW / 2 + 0.012), (s * ARM_X, FRONT - 0.04, TW / 2 + 0.012), 0.007, n=6, name="cable tray")
    rcs((s * (ARM_X + TW / 2 + 0.02), FRONT - 0.06, -0.05), (s, 0, 0), (0, 1, 0))
for x, mm in ((-0.5, M["grey"]), (0.0, M["gold"]), (0.5, M["grey"])):
    oru((x, BACK - TW / 2, -0.02), (0, -1, 0), (1, 0, 0), m=mm)
rod(C, M["black"], (-ARM_X + 0.08, BACK, TW / 2 + 0.012), (ARM_X - 0.08, BACK, TW / 2 + 0.012), 0.007, n=6, name="cable tray")

# the spine: a truss back from the crossbar
SPINE_END = -2.75
truss(C, M["alu plain"], (0, BACK - 0.06, 0), (0, SPINE_END, 0), 0.2, 16, 0.006, name="spine truss")
# the power module round it
tube(M["blanket"], 0.25, (0, -1.15, 0), (0, -1.72, 0), n=96, tile=0.05, caps=False, name="power module")
for y, s in ((-1.15, 1), (-1.72, -1)):
    tube(M["blanket"], 0.25, (0, y, 0), (0, y + s * 0.06, 0), n=96, tile=0.06, r2=0.19, caps=False, name="power cone")
    cbm((0, y + s * 0.07, 0), (0, s, 0), 0.15)
tube(M["gold"], 0.255, (0, -1.4, 0), (0, -1.46, 0), n=96, tile=0.05, caps=False, name="power band")
for a in (0.4, 2.2, 4.0):
    d = V((math.cos(a), 0, math.sin(a)))
    handrail(d * 0.25 + V((0, -1.2, 0)), d * 0.25 + V((0, -1.66, 0)), d)
# radiator wings, up and down, edge-on to the throw
for s in (-1, 1):
    rod(C, M["alu plain"], (0, -2.15, s * 0.1), (0, -2.15, s * 0.28), 0.012, n=10, name="radiator mast")
    truss(C, M["alu plain"], (0, -2.15, s * 0.28), (0, -2.15, s * 1.42), 0.05, 10, 0.003, name="radiator truss")
    for i in range(3):
        zc = s * (0.47 + i * 0.36)
        for side in (-1, 1):
            slab(M["radiator"], (0.006, 0.26, 0.33), (0, -2.15 + side * 0.165, zc), ((1, 0, 0), (0, 1, 0), (0, 0, 1)), 0.1, name="radiator panel")
# the reactor drum aft, and a dish
tube(M["silver"], 0.22, (0, -2.5, 0), (0, -2.78, 0), n=72, tile=0.06, name="reactor drum")
for y in (-2.5, -2.78):
    tube(M["alu plain"], 0.225, (0, y - 0.008, 0), (0, y + 0.008, 0), n=72, caps=False, name="drum seam")
rod(C, M["alu plain"], (0, -2.64, 0.22), (0, -2.64, 0.36), 0.01, n=8, name="dish mast")
dish(C, M["radiator"], 0.11, 0.035, at=(0, -2.64, 0.38), facing=(0.3, -0.6, 0.75), n=48, k=10, thick=0.004, name="dish")
rcs((0.24, -2.64, 0), (1, 0, 0), (0, 1, 0)); rcs((-0.24, -2.64, 0), (-1, 0, 0), (0, 1, 0))

# the throw
COILS = []
def coil(y, R, k):
    """a superconducting coil: its winding pack wrapped in gold insulation foil, kept cold, between machined flanges;
    an emitter strip round its inner face"""
    hoop(M["gold"], R, 0.05, 0.07, Y, center=(0, y, 0), ref=X, tile=0.05, name="coil")
    for dy in (-0.04, 0.04):
        hoop(M["dark"], R, 0.064, 0.01, Y, center=(0, y + dy, 0), ref=X, name="coil flange")
    for j in range(16):
        a = 2 * math.pi * j / 16
        d = X * math.cos(a) + Z * math.sin(a)
        slab(M["alu plain"], (0.012, 0.016, 0.09), d * (R + 0.032) + Y * y, (d, Y.cross(d), Y), 1, name="coil clamp")
    hoop(emitter("coil %d" % k), R - 0.027, 0.005, 0.026, Y, center=(0, y, 0), ref=X, tile=0.1, name="coil emitter")
if VARIANT == "barrel":
    # six coils closing in round the axis, joined by three lattice longerons, held off the arms' front ends
    C = PARTS["parts"]
    for k in range(6):
        y = 1.5 + 0.36 * k; R = 0.46 - 0.022 * k
        coil(y, R, k)
        COILS.append((y, R))
    C = PARTS["frame"]
    # one longeron below and two at the upper sides, so the top is clear for coming down onto the axis
    for a in (-math.pi / 2, math.pi / 6, 5 * math.pi / 6):
        d0 = X * math.cos(a) + Z * math.sin(a)
        (y0, r0), (y1, r1) = COILS[0], COILS[-1]
        truss(C, M["alu plain"], d0 * (r0 + 0.085) + Y * (y0 - 0.06), d0 * (r1 + 0.085) + Y * (y1 + 0.06), 0.06, 14, 0.004, name="longeron")
        for y, R in COILS:
            beam(M["alu plain"], d0 * (R + 0.035) + Y * y, d0 * (R + 0.09) + Y * y, 0.03, 0.03, up=Y, name="coil mount")
        rod(C, M["black"], d0 * (r0 + 0.12) + Y * (y0 - 0.06), d0 * (r1 + 0.12) + Y * (y1 + 0.06), 0.006, n=6, name="feed line")
    # trusses from the arms' front ends to the first coils
    for s in (-1, 1):
        truss(C, M["alu plain"], (s * ARM_X, FRONT, 0), (s * (COILS[0][1] + 0.09), COILS[0][0], 0), 0.07, 5, 0.005, name="strut")
        truss(C, M["alu plain"], (s * ARM_X, FRONT, 0), (s * (COILS[2][1] + 0.09), COILS[2][0], 0), 0.05, 8, 0.004, name="strut")
    yM, rM = COILS[-1]
    for a, mm in ((0, M["nav green"]), (math.pi, M["nav red"])):
        sphere(C, mm, 0.012, at=(math.cos(a) * (rM + 0.07), yM + 0.05, math.sin(a) * (rM + 0.07)), n=12, name="nav light")
else:
    # the arms run on forward as trusses and close in, each lined with coil segments on its inner face
    TIP_X, TIP_Y = 0.42, 3.0
    for s in (-1, 1):
        a, b = V((s * ARM_X, FRONT, 0)), V((s * TIP_X, TIP_Y, 0))
        truss(C, M["alu plain"], a, b, TW, 22, 0.006, name="rail")
        d = (b - a).normalized(); inward = V((-s, 0, 0)); inward = (inward - d * inward.dot(d)).normalized()
        up = V((0, 0, 1))
        for k in range(8):
            p = a + (b - a) * (0.08 + 0.115 * k) + inward * (TW / 2 + 0.03)
            slab(M["gold"], (0.05, 0.16, 0.2), p, (inward, d, up), 0.05, name="rail coil")
            for dz in (-0.105, 0.105):
                slab(M["dark"], (0.064, 0.17, 0.012), p + up * dz, (inward, d, up), 1, name="rail coil flange")
            slab(emitter("coil %d" % min(5, k * 6 // 8)), (0.004, 0.12, 0.05), p + inward * 0.027, (inward, d, up), 1, name="rail emitter")
        rod(C, M["black"], a + up * (TW / 2 + 0.012), b + up * (TW / 2 + 0.012), 0.007, n=6, name="cable tray")
        sphere(C, M["nav green"] if s > 0 else M["nav red"], 0.012, at=b + d * 0.06, n=12, name="nav light")
    COILS = [(0.8 + 0.4 * k, 0.5) for k in range(6)]

# ---------------------------------------------------------------- the scaffold: a relay still being built (the site shows it on the
# oldest relay, whose last coils aren't mounted yet): a cage of thin trusses round the bare longerons, work lights on it
if VARIANT == "barrel":
    C = PARTS["parts"]
    M["scaffold"] = plain("scaffold steel", "#7d8087", 0.5, 0.45)
    M["work light"] = plain("work light", "#2a2418", 0.0, 0.4, emit="#ffe2b0", strength=8.0)
    M["work body"] = plain("work light body", "#34363c", 0.6, 0.4)
    y0, y1, h = 2.3, 3.55, 0.62
    for x, z in ((-h, -h), (-h, h), (h, -h), (h, h)):
        rod(C, M["scaffold"], (x, y0, z), (x, y1, z), 0.008, n=6, name="scaffold post")
    for y in (y0, y0 + 0.42, y0 + 0.84, y1):
        for (x0, z0), (x1, z1) in (((-h, -h), (h, -h)), ((h, -h), (h, h)), ((h, h), (-h, h)), ((-h, h), (-h, -h))):
            rod(C, M["scaffold"], (x0, y, z0), (x1, y, z1), 0.005, n=6, name="scaffold rail")
    for (x0, z0), (x1, z1) in (((-h, h), (h, h)), ((-h, -h), (-h, h))):
        rod(C, M["scaffold"], (x0, y0, z0), (x1, y1, z1), 0.004, n=6, name="scaffold brace")
    for x, y, z in ((-h, y0 + 0.2, h), (h, y0 + 0.62, h), (-h, y1 - 0.1, -h), (h, y1 - 0.3, -h)):
        d = V((-x, 0, -z)).normalized()
        slab(M["work body"], (0.03, 0.05, 0.04), V((x, y, z)) + d * 0.02, (d, Y, d.cross(Y)), 1, name="work light body")
        slab(M["work light"], (0.004, 0.04, 0.03), V((x, y, z)) + d * 0.037, (d, Y, d.cross(Y)), 1, name="work light")
    C = PARTS["frame"]

# ---------------------------------------------------------------- anchors: where the role's stack hangs its labels, on the
# equipment boxes (the left arm's, the crossbar's, the right arm's), as empties the site reads by name
ANCHORS = []
for y in (BACK + 0.32, -0.42, 0.42, FRONT - 0.25):
    ANCHORS.append(V((-(ARM_X + TW / 2 + 0.045), y, -0.02)))
for x in (-0.5, 0.0, 0.5):
    ANCHORS.append(V((x, BACK - TW / 2 - 0.045, -0.02)))
for y in (BACK + 0.32, -0.42, 0.42, FRONT - 0.25):
    ANCHORS.append(V((ARM_X + TW / 2 + 0.045, y, -0.02)))

for c in PARTS.values(): apply_all(c)
print("parts", {k: len(c.all_objects) for k, c in PARTS.items()}, "tris", sum(tri_count(c) for c in PARTS.values()))

# ---------------------------------------------------------------- the shot
def look(o, at):
    d = V(at) - o.location
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

cam = bpy.data.cameras.new("cam"); cam.sensor_fit = "VERTICAL"; cam.angle_y = math.radians(30)
cam.clip_start = 0.01; cam.clip_end = 200
co = bpy.data.objects.new("cam", cam); SC.collection.objects.link(co); SC.camera = co
sun = bpy.data.lights.new("sun", "SUN"); sun.energy = 5.34; sun.angle = math.radians(0.53); sun.color = (1.0, 0.97, 0.93)
so = bpy.data.objects.new("sun", sun); SC.collection.objects.link(so)
TO_SUN = V((-0.62, -0.42, 0.62)).normalized()
so.rotation_euler = TO_SUN.to_track_quat("Z", "Y").to_euler()
pt = bpy.data.lights.new("core light", "POINT"); pt.energy = 25 + 400 * CHARGE; pt.color = (0.62, 0.8, 1.0); pt.shadow_soft_size = CORE_R
po = bpy.data.objects.new("core light", pt); SC.collection.objects.link(po)
w = SC.world or bpy.data.worlds.new("World"); SC.world = w; w.use_nodes = True
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.8, 0.86, 1.0, 1); bg.inputs["Strength"].default_value = 0.07
lp = w.node_tree.nodes.new("ShaderNodeLightPath"); mix = w.node_tree.nodes.new("ShaderNodeMixShader")
blk = w.node_tree.nodes.new("ShaderNodeBackground"); blk.inputs["Color"].default_value = (0, 0, 0, 1)
wo = next(n for n in w.node_tree.nodes if n.type == "OUTPUT_WORLD")
w.node_tree.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0]); w.node_tree.links.new(bg.outputs[0], mix.inputs[1])
w.node_tree.links.new(blk.outputs[0], mix.inputs[2]); w.node_tree.links.new(mix.outputs[0], wo.inputs["Surface"])

SC.render.resolution_x, SC.render.resolution_y = 1440, 900
SC.render.resolution_percentage = int(os.environ.get("PCT", "50"))
SC.render.film_transparent = False
SC.render.image_settings.file_format = "PNG"
try: SC.view_settings.view_transform = "Khronos PBR Neutral"
except Exception as e: print("view transform", e)
SC.view_settings.look = "None"

def cycles(samples):
    SC.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"; prefs.get_devices()
    for d in prefs.devices: d.use = True
    SC.cycles.device = "GPU"; SC.cycles.samples = samples; SC.cycles.use_denoising = True
    SC.cycles.max_bounces = 6

# the hold (behind and left, above, looking on along the throw), the launch spot (down the throw), the side
SHOTS = {
    "hold": ((-2.9, -2.6, 1.35), (0.15, 0.7, -0.05)),
    "launch": ((0.0, 1.15, 0.0), (0.0, 5.0, 0.0)),
    "side": ((-7.2, 0.1, 1.2), (0.0, 0.1, 0.0)),
    "front": ((2.6, 5.4, 1.6), (0.0, 0.2, 0.0)),
}
if MODE == "preview":
    cycles(int(os.environ.get("SAMPLES", "24")))
    # the rings turned a little off their rest, as they'd be caught mid-turn
    for o in PARTS["ringA"].all_objects: o.matrix_world = Matrix.Rotation(0.5, 4, "X") @ o.matrix_world
    for o in PARTS["ringB"].all_objects:
        o.matrix_world = Matrix.Rotation(0.5, 4, "X") @ Matrix.Rotation(0.9, 4, "Z") @ o.matrix_world
    names = os.environ.get("SHOTS", ",".join(SHOTS)).split(",")
    for nm in names:
        p, t = SHOTS[nm]
        co.location = V(p); look(co, t)
        cam.angle_y = math.radians(70 if nm == "launch" else 30)
        SC.render.filepath = OUT + "%s-%s.png" % (VARIANT, nm)
        bpy.ops.render.render(write_still=True)
elif MODE == "site":
    # the site's model (public/voyage/relay/relay.glb via build.sh): the barrel, its occlusion baked per part, each coil
    # and the scaffold its own node (baked together, then split back by where each piece sits), the anchors as empties
    roots = {}
    for k in ("frame", "ringA", "ringB", "parts"):
        c = PARTS[k]
        cache = {}
        for o in c.all_objects:
            if o.type != "MESH": continue
            for i, m in enumerate(o.data.materials):
                if m.name.startswith("emitter"): continue
                if m.name not in cache: cache[m.name] = m.copy(); cache[m.name].name = m.name + " / " + k
                o.data.materials[i] = cache[m.name]
        size = 2048 if k == "frame" else 1024
        part, image = bake_ao(c, OUT + "relay-site-%s-ao.png" % k, size=size, samples=96, distance=0.25)
        bpy.ops.object.select_all(action="DESELECT"); part.select_set(True); bpy.context.view_layer.objects.active = part
        SC.cursor.location = (0, 0, 0)
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
        part.name = k
        roots[k] = part
    # split the parts back: each loose piece goes to the scaffold (by its material) or to the coil it sits at
    bpy.ops.object.select_all(action="DESELECT"); roots["parts"].select_set(True); bpy.context.view_layer.objects.active = roots["parts"]
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT"); bpy.ops.mesh.separate(type="LOOSE"); bpy.ops.object.mode_set(mode="OBJECT")
    pieces = [o for o in PARTS["parts"].all_objects if o.type == "MESH"]
    groups = {}
    for o in pieces:
        # a loose piece keeps every slot of the mesh it came from: read the materials its own faces use
        names = list({o.data.materials[f.material_index].name for f in o.data.polygons if o.data.materials[f.material_index]})
        if any(n.startswith(("scaffold", "work light")) for n in names):
            key = "scaffold"
        else:
            yc = sum((o.matrix_world @ v.co).y for v in o.data.vertices) / max(1, len(o.data.vertices))
            key = "coil %d" % min(range(len(COILS)), key=lambda i: abs(COILS[i][0] - yc))
        groups.setdefault(key, []).append(o)
    nodes = {}
    for key, objs in groups.items():
        j = join(objs, key)
        bpy.ops.object.select_all(action="DESELECT"); j.select_set(True); bpy.context.view_layer.objects.active = j
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
        j.name = key
        nodes[key] = j
    core = PARTS["core"].all_objects[0]; core.name = "core"
    root = bpy.data.objects.new("relay", None); PARTS["frame"].objects.link(root)
    roots["frame"].parent = root; roots["ringA"].parent = root; roots["ringB"].parent = roots["ringA"]; core.parent = root
    for j in nodes.values(): j.parent = root
    empties = []
    for i, p in enumerate(ANCHORS):
        e = bpy.data.objects.new("anchor %d" % i, None); PARTS["frame"].objects.link(e); e.location = p; e.parent = root; empties.append(e)
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, core, roots["frame"], roots["ringA"], roots["ringB"], *nodes.values(), *empties): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "relay.raw.glb", export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("nodes", sorted(nodes), "anchors", len(empties), "emitters", len(EMITTERS))
    print("coils", COILS)
    print("exported")
elif MODE == "export":
    # each part's materials its own, so each part's occlusion map is its own
    roots = {}
    for k in ("frame", "ringA", "ringB"):
        c = PARTS[k]
        cache = {}
        for o in c.all_objects:
            if o.type != "MESH": continue
            for i, m in enumerate(o.data.materials):
                if m.name.startswith("emitter"): continue
                if m.name not in cache: cache[m.name] = m.copy(); cache[m.name].name = m.name + " / " + k
                o.data.materials[i] = cache[m.name]
        part, image = bake_ao(c, OUT + "relay-%s-%s-ao.png" % (VARIANT, k), size=2048, samples=96, distance=0.25)
        bpy.ops.object.select_all(action="DESELECT"); part.select_set(True); bpy.context.view_layer.objects.active = part
        SC.cursor.location = (0, 0, 0)
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
        part.name = k
        roots[k] = part
    core = PARTS["core"].all_objects[0]; core.name = "core"
    root = bpy.data.objects.new("relay", None); PARTS["frame"].objects.link(root)
    roots["frame"].parent = root; roots["ringA"].parent = root; roots["ringB"].parent = roots["ringA"]; core.parent = root
    bpy.ops.object.select_all(action="DESELECT")
    for o in (root, core, *roots.values()): o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=OUT + "relay-%s.raw.glb" % VARIANT, export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("coils", COILS)
    print("exported")
