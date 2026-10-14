"""Helpers for modelling the ship variants in Blender (run inside Blender: exec(open(this).read())).

Every material is a plain Principled BSDF with exportable values (base colour, metallic, roughness, emission), so the
glTF the site loads carries exactly what's set here. Parts are built at real-ish proportions, then the whole ship is
scaled so its bounding sphere has radius 1, as the site expects of a body it places at `W.HOME.r`.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

def srgb(h):
    """display hex -> linear rgba, as Blender's base colour wants"""
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

def mat(name, base, metal=0.0, rough=0.5, emit=None, strength=0.0, image=None, normal=None, bump=0.6, emit_image=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    b.inputs["Base Color"].default_value = srgb(base)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit)
        b.inputs["Emission Strength"].default_value = strength
    if emit_image:
        et = nt.nodes.new("ShaderNodeTexImage"); et.image = bpy.data.images.load(emit_image, check_existing=True)
        nt.links.new(et.outputs["Color"], b.inputs["Emission Color"])
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(image, check_existing=True)
        nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    if normal:
        nm = nt.nodes.new("ShaderNodeTexImage"); nm.image = bpy.data.images.load(normal, check_existing=True)
        nm.image.colorspace_settings.name = "Non-Color"
        nn = nt.nodes.new("ShaderNodeNormalMap"); nn.inputs["Strength"].default_value = bump
        nt.links.new(nm.outputs["Color"], nn.inputs["Color"]); nt.links.new(nn.outputs["Normal"], b.inputs["Normal"])
    return m

# (the older ships' own maps; the station, relay and traffic builds set TEX to tex.py's after loading this)
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tex") + "/"

def palette():
    return {
        "white": mat("hull white", "#d6d8dc", 0.0, 0.42, image=TEX + "panels.png"),
        "pale": mat("panel pale", "#b9bcc2", 0.0, 0.5),
        "grey": mat("hull grey", "#8a8d94", 0.1, 0.5),
        "dark": mat("dark metal", "#34363c", 0.35, 0.42),
        "black": mat("black panel", "#141519", 0.2, 0.62),
        "gold": mat("gold foil", "#c9a052", 0.5, 0.34, normal=TEX + "foil-normal.png", bump=0.5),
        "silver": mat("silver foil", "#c9ccd2", 0.45, 0.3, normal=TEX + "foil-normal.png", bump=0.5),
        "solar": mat("solar cells", "#16224a", 0.4, 0.2, image=TEX + "solar.png"),
        "radiator": mat("radiator", "#e9e8e3", 0.0, 0.6, image=TEX + "radiator.png"),
        "armour": mat("armour", "#4a4d54", 0.35, 0.45, image=TEX + "armour.png"),
        "window": mat("window", "#2a2216", 0.0, 0.3, emit="#ffcf8f", strength=4.0),
        "glass": mat("glass", "#06080d", 0.3, 0.05, emit="#ffcf8f", strength=0.04),
        "drive": mat("drive glow", "#0b0f18", 0.0, 0.4, emit="#9fc4ff", strength=6.0),
        "red": mat("light red", "#200000", 0.0, 0.4, emit="#ff3b2e", strength=8.0),
        "green": mat("light green", "#002000", 0.0, 0.4, emit="#3bff6a", strength=8.0),
        "beacon": mat("light white", "#202020", 0.0, 0.4, emit="#ffffff", strength=10.0),
        "grid": mat("ion grid", "#16181d", 0.6, 0.4, emit="#9fc4ff", strength=2.2, emit_image=TEX + "ion-grid.png"),
        "rail": mat("handrail", "#c8a24c", 0.2, 0.5),
        "berth": mat("berthing ring", "#a9adb4", 0.5, 0.35),
        "tape": mat("foil tape", "#e4e3dd", 0.0, 0.55),
        "porthole": mat("porthole", "#06080d", 0.3, 0.05, emit="#ffcf8f", strength=0.1),
    }

def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.lights, bpy.data.cameras):
        for x in list(blk):
            if x.users == 0: blk.remove(x)

def coll(name):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c)
    return c

def link(o, c):
    for u in list(o.users_collection): u.objects.unlink(o)
    c.objects.link(o)
    return o

def _finish(o, m, c, bevel=0.0, smooth=30):
    if m: o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL"); b.width = bevel; b.segments = 2; b.limit_method = "ANGLE"; b.harden_normals = False
    if smooth is not None:
        bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
        try: bpy.ops.object.shade_auto_smooth(angle=math.radians(smooth))
        except Exception: bpy.ops.object.shade_smooth()
    return link(o, c)

def box(c, m, size, at=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, name="box"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, m, c, bevel)

def cyl(c, m, r, depth, at=(0, 0, 0), rot=(0, 0, 0), n=32, bevel=0.0, name="cyl", r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=depth, location=at, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r, radius2=r2, depth=depth, location=at, rotation=rot)
    o = bpy.context.object; o.name = name
    return _finish(o, m, c, bevel)

def sphere(c, m, r, at=(0, 0, 0), n=24, name="sphere", scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=n, ring_count=max(8, n // 2), radius=r, location=at)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, m, c)

def torus(c, m, R, r, at=(0, 0, 0), rot=(0, 0, 0), n=64, k=16, name="torus"):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=n, minor_segments=k, location=at, rotation=rot)
    o = bpy.context.object; o.name = name
    return _finish(o, m, c)

def rod(c, m, a, b, r, n=8, name="rod"):
    """a thin cylinder from a to b"""
    a, b = Vector(a), Vector(b); d = b - a
    o = cyl(c, m, r, d.length, at=(a + b) / 2, n=n, name=name, bevel=0.0)
    o.rotation_mode = "QUATERNION"; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return o

def truss(c, m, a, b, w, bays, r, name="truss"):
    """a square lattice truss from a to b, w across, in `bays` bays: four longerons, battens and diagonals"""
    a, b = Vector(a), Vector(b); d = (b - a).normalized()
    u = d.orthogonal().normalized(); v = d.cross(u).normalized()
    corners = [(u + v), (u - v), (-u - v), (-u + v)]
    parts = []
    for k in corners: parts.append(rod(c, m, a + k * w / 2, b + k * w / 2, r, name=name))
    for i in range(bays + 1):
        p = a + (b - a) * (i / bays)
        for j in range(4):
            parts.append(rod(c, m, p + corners[j] * w / 2, p + corners[(j + 1) % 4] * w / 2, r * 0.7, n=6, name=name))
        if i < bays:
            q = a + (b - a) * ((i + 1) / bays)
            for j in range(4):
                parts.append(rod(c, m, p + corners[j] * w / 2, q + corners[(j + 1) % 4] * w / 2, r * 0.6, n=6, name=name))
    return join(parts, name)

def join(objs, name):
    objs = [o for o in objs if o]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name
    return o

def array_around(objs, n, axis="Z", name="ring"):
    """copies of objs turned round the origin n times"""
    out = []
    for i in range(n):
        for o in objs:
            x = o.copy(); x.data = o.data.copy(); o.users_collection[0].objects.link(x)
            x.matrix_world = Matrix.Rotation(2 * math.pi * i / n, 4, axis) @ o.matrix_world
            out.append(x)
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
    return out

def apply_all(c):
    """bakes every modifier, so the export is what's previewed"""
    for o in list(c.all_objects):
        if o.type != "MESH": continue
        bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=md.name)
            except Exception: o.modifiers.remove(md)

def normalize(c, root_name):
    """parents every object to one empty and scales it so the ship's bounding sphere has radius 1 round the origin"""
    objs = [o for o in c.all_objects if o.type == "MESH"]
    pts = [o.matrix_world @ Vector(v) for o in objs for v in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    mid = (lo + hi) / 2
    R = max((o.matrix_world @ v.co - mid).length for o in objs for v in o.data.vertices)
    root = bpy.data.objects.new(root_name, None); c.objects.link(root)
    for o in objs:
        o.parent = root
    root.location = -mid / R
    root.scale = (1 / R, 1 / R, 1 / R)
    return root, R

def tri_count(c):
    n = 0
    for o in c.all_objects:
        if o.type != "MESH": continue
        dg = bpy.context.evaluated_depsgraph_get(); e = o.evaluated_get(dg); me = e.to_mesh()
        me.calc_loop_triangles(); n += len(me.loop_triangles); e.to_mesh_clear()
    return n

def stage(target_radius=1.0):
    """a preview set: black world, his star's warm key light from one side, a faint fill, a camera"""
    sc = bpy.context.scene
    w = sc.world or bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.004, 0.005, 0.009, 1); bg.inputs["Strength"].default_value = 1.0
    for o in [o for o in bpy.data.objects if o.type in ("LIGHT", "CAMERA")]: bpy.data.objects.remove(o, do_unlink=True)
    key = bpy.data.lights.new("star", "SUN"); key.energy = 4.0; key.color = (1.0, 0.94, 0.86); key.angle = math.radians(0.6)
    ko = bpy.data.objects.new("star", key); sc.collection.objects.link(ko)
    ko.rotation_euler = (math.radians(55), math.radians(-10), math.radians(-35))
    fill = bpy.data.lights.new("fill", "SUN"); fill.energy = 0.25; fill.color = (0.55, 0.5, 0.9)
    fo = bpy.data.objects.new("fill", fill); sc.collection.objects.link(fo)
    fo.rotation_euler = (math.radians(-120), 0, math.radians(150))
    cam = bpy.data.cameras.new("cam"); cam.lens = 85
    co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
    return co

def shoot(path, cam_pos, look=(0, 0, 0), res=(1280, 720), engine=None):
    sc = bpy.context.scene; co = sc.camera
    co.location = cam_pos
    d = Vector(look) - Vector(cam_pos)
    co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.filepath = path
    sc.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)

def cube_uv(o, size):
    """box-projected UVs, one texture tile per `size` units, so panels keep their size on every part"""
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=size, correct_aspect=False, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    return o

def textured(c, size, sizes=None):
    """box UVs on every part whose material carries a texture: one tile per `size` units, or per the size `sizes` gives
    its material (foil crinkles finer than panels are wide)"""
    sizes = sizes or {}
    for o in c.all_objects:
        if o.type != "MESH": continue
        mats = [m for m in o.data.materials if m and m.node_tree and any(n.type == "TEX_IMAGE" for n in m.node_tree.nodes)]
        if mats: cube_uv(o, sizes.get(mats[0].name, size))

def dish(c, m, R, depth, at, facing, n=48, k=10, thick=0.006, name="dish"):
    """a parabolic dish of radius R and depth `depth`, opening towards `facing`, with a back"""
    bm = bmesh.new()
    rings = []
    for i in range(k + 1):
        r = R * i / k; z = depth * (r / R) ** 2
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * j / n), r * math.sin(2 * math.pi * j / n), z)) for j in range(n)] if i else [bm.verts.new((0, 0, 0))])
    for j in range(n): bm.faces.new((rings[0][0], rings[1][j], rings[1][(j + 1) % n]))
    for i in range(1, k):
        for j in range(n): bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][(j + 1) % n], rings[i][(j + 1) % n]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    sol = o.modifiers.new("solid", "SOLIDIFY"); sol.thickness = thick; sol.offset = -1
    o.rotation_mode = "QUATERNION"; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(facing).normalized())
    o.location = at
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return _finish(o, m, c)

def capsule(c, m, r, length, at, axis=(0, 1, 0), n=48, name="capsule"):
    """a cylinder of radius r and straight length `length` with hemispherical ends, along `axis`"""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=n, ring_count=n // 2, radius=r, location=(0, 0, 0))
    o = bpy.context.object; o.name = name
    for v in o.data.vertices: v.co.z += (length / 2) * (1 if v.co.z > 1e-6 else -1 if v.co.z < -1e-6 else 0)
    o.rotation_mode = "QUATERNION"; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(axis).normalized())
    o.location = at
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return _finish(o, m, c)

def bake_ao(c, image_path, size=2048, samples=96, distance=0.25):
    """Joins the ship into one mesh, lays a second UV map out for it alone, bakes ambient occlusion into it with
    Cycles, and wires that map into every material as glTF's occlusion (read by three as aoMap, on its own uv)."""
    objs = [o for o in c.all_objects if o.type == "MESH"]
    ship = join(objs, c.name)
    me = ship.data
    for uv in list(me.uv_layers)[1:]: me.uv_layers.remove(uv)
    if not me.uv_layers: me.uv_layers.new(name="UVMap")
    ao_uv = me.uv_layers.new(name="ao"); me.uv_layers.active = ao_uv
    bpy.ops.object.select_all(action="DESELECT"); ship.select_set(True); bpy.context.view_layer.objects.active = ship
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    img = bpy.data.images.new("ao", size, size, alpha=False, float_buffer=False)
    img.colorspace_settings.name = "Non-Color"
    nodes = []
    for m in me.materials:
        nt = m.node_tree
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = img; t.name = "ao bake"
        uvn = nt.nodes.new("ShaderNodeUVMap"); uvn.uv_map = "ao"; nt.links.new(uvn.outputs["UV"], t.inputs["Vector"])
        nt.nodes.active = t; nodes.append((m, t))
    sc = bpy.context.scene
    was = sc.render.engine
    sc.render.engine = "CYCLES"
    try: sc.cycles.device = "GPU"
    except Exception: pass
    sc.cycles.samples = samples
    sc.render.bake.margin = 6
    sc.world.light_settings.distance = distance
    bpy.ops.object.bake(type="AO")
    img.filepath_raw = image_path; img.file_format = "PNG"; img.save()
    sc.render.engine = was
    # glTF's occlusion: a node group the exporter reads by name, fed the bake's red channel
    g = bpy.data.node_groups.get("glTF Material Output")
    if not g:
        g = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        g.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    for m, t in nodes:
        nt = m.node_tree
        sep = nt.nodes.new("ShaderNodeSeparateColor"); nt.links.new(t.outputs["Color"], sep.inputs["Color"])
        go = nt.nodes.new("ShaderNodeGroup"); go.node_tree = g
        nt.links.new(sep.outputs[0], go.inputs["Occlusion"])
    return ship, img

def export(c, root_name, path):
    """scales the ship to a bounding sphere of radius 1 and writes it as a .glb (+y up, as three expects)"""
    root, R = normalize(c, root_name)
    bpy.ops.object.select_all(action="DESELECT")
    for o in c.all_objects: o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    return R
