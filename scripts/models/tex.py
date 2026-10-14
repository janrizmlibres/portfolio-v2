"""Tileable surface maps for the station made real, which the relay and the buoy share (build.sh runs it when tex/ is
missing). Run with the system python (numpy + PIL):

    python3 scripts/models/tex.py

Writes tex/<surface>-{color,normal,rough,metal}.png. Every map tiles: noise is made in the frequency domain, and every
edge or stripe repeats exactly across the tile. Normal maps are OpenGL style (+y up the texture), as glTF and
Blender both read them.
"""
import os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tex")
os.makedirs(OUT, exist_ok=True)


def noise(n, beta, seed, stretch=(1.0, 1.0), lo=0.0, hi=1.0):
    """tileable 1/f^beta noise, zero mean, unit spread; stretch > 1 squeezes features along (rows, cols); lo/hi keep a
    band of frequencies (fractions of Nyquist)"""
    rng = np.random.default_rng(seed)
    fr = np.fft.fftfreq(n)[:, None] * stretch[0]
    fc = np.fft.rfftfreq(n)[None, :] * stretch[1]
    f = np.sqrt(fr ** 2 + fc ** 2)
    f[0, 0] = 1.0
    amp = f ** (-beta)
    amp[0, 0] = 0.0
    band = (f >= lo * 0.5) & (f <= hi * 0.5)
    amp = amp * band
    spec = amp * np.exp(1j * rng.uniform(0, 2 * np.pi, amp.shape))
    a = np.fft.irfft2(spec, s=(n, n))
    return (a - a.mean()) / (a.std() + 1e-9)


def normal_from(h, strength):
    """height (rows down, cols right) -> OpenGL tangent normal, encoded 0..255"""
    dc = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dr = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx, ny, nz = -dc * strength, dr * strength, np.ones_like(h)
    l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    n = np.stack([nx / l, ny / l, nz / l], -1)
    return ((n * 0.5 + 0.5) * 255).round().clip(0, 255).astype(np.uint8)


def save(name, a, mode=None):
    if a.dtype != np.uint8:
        a = (np.clip(a, 0, 1) * 255).round().astype(np.uint8)
    Image.fromarray(a, mode).save(os.path.join(OUT, name + ".png"), optimize=True)
    print("wrote", name, a.shape)


def grey(a):
    return np.clip(a, 0, 1)


def srgb(c):
    return np.array(c, dtype=np.float64) / 255.0


# ---------------------------------------------------------------- MMOD blanket (beta cloth over the hull)
def blanket(n=2048, cols=4, rows=2, seed=1):
    """quilted white beta-cloth panels: each a little puffed, seams sunk and stitched, panels aged differently"""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    ph = n / rows
    row = np.floor(yy / ph)
    # alternate rows stagger by half a panel, which still tiles with an even number of rows
    x = (xx + (row % 2) * (n / cols) * 0.5) % n
    pw = n / cols
    col = np.floor(x / pw)
    s = (x % pw) / pw
    t = (yy % ph) / ph
    pid = (row * cols + col).astype(int)
    k = rows * cols
    tone = rng.normal(0, 0.012, k)
    warm = rng.uniform(0, 1, k) ** 3 * 0.05
    puff = rng.uniform(0.6, 1.2, k)
    # the pillow, the seams' grooves, stitches either side of them
    pillow = (np.sin(np.pi * s) * np.sin(np.pi * t)) ** 0.35 * puff[pid]
    edge = np.minimum(np.minimum(s, 1 - s) * pw, np.minimum(t, 1 - t) * ph)  # px from the nearest seam
    groove = np.exp(-(edge / 3.0) ** 2)
    stitch_line = np.exp(-((edge - 11) / 1.6) ** 2)
    along = np.where(np.minimum(s, 1 - s) * pw < np.minimum(t, 1 - t) * ph, yy, x)
    stitch = stitch_line * (np.sin(along / 7.0 * 2 * np.pi) > 0.3)
    wrinkle = noise(n, 2.0, seed + 1, stretch=(1.0, 2.0), lo=0.01, hi=0.12)
    weave = noise(n, 0.0, seed + 2, lo=0.5, hi=1.0)
    h = pillow * 16.0 - groove * 7.0 - stitch * 0.8 + wrinkle * 1.0 + weave * 0.06
    save("blanket-normal", normal_from(h, 0.9))
    # colour: off-white, each panel its own white, darker in the seams, a little grime low down the tones
    base = srgb((221, 221, 219))
    grime = np.clip(noise(n, 2.0, seed + 3, hi=0.08) * 0.5 + 0.2, 0, 1) * 0.07
    smudge = np.clip(noise(n, 2.2, seed + 4, hi=0.04) - 1.2, 0, None) * 0.06
    v = 1 + tone[pid] - groove * 0.1 - stitch * 0.05 - grime - smudge
    c = np.stack([base[0] * v + warm[pid] * 0.3, base[1] * v + warm[pid] * 0.18, base[2] * v - warm[pid] * 0.25], -1)
    save("blanket-color", c)
    r = 0.72 + tone[pid] * 1.5 + groove * 0.12 - np.clip(noise(n, 1.4, seed + 5, hi=0.15), 0, None) * 0.06
    save("blanket-rough", grey(r))


# ---------------------------------------------------------------- multi-layer insulation, gold and silver
def foil(name, rgb, n=512, seed=10):
    """crinkled foil: sharp creases from ridged noise at two scales, specular breaking up across them (foil covers
    small parts, so its maps are small and carry no finest crinkle, which costs the most to store)"""
    h = np.zeros((n, n))
    for i, (b, lo, hi, w) in enumerate(((1.4, 0.008, 0.1, 1.0), (1.2, 0.06, 0.4, 0.55))):
        r = 1 - np.abs(noise(n, b, seed + i, lo=lo, hi=hi)) / 2.5
        h += np.clip(r, 0, 1) ** 3 * w
    save(name + "-normal", normal_from(h * 18, 1.0))
    crease = np.clip((h - h.mean()) / (h.std() * 2.5), -1, 1)
    base = srgb(rgb)
    # the colour stays even: the creases show by how they catch the light, not by a printed pattern
    v = 1 - np.clip(-crease, 0, 1) * 0.06 + noise(n, 1.5, seed + 7, hi=0.1) * 0.02
    save(name + "-color", np.stack([base[0] * v, base[1] * v, base[2] * v], -1))
    save(name + "-rough", grey(0.16 + np.abs(crease) * 0.12 + np.clip(noise(n, 1.3, seed + 8, hi=0.2), 0, None) * 0.04))


# ---------------------------------------------------------------- bare aluminium (truss, berthing rings)
def aluminium(n=1024, seed=20):
    brushed = noise(n, 1.0, seed, stretch=(1.0, 24.0), lo=0.05, hi=1.0)
    blot = noise(n, 2.0, seed + 1, hi=0.06)
    v = 1 + brushed * 0.015 + blot * 0.03
    base = srgb((178, 180, 184))
    save("alu-color", np.stack([base[0] * v, base[1] * v, base[2] * v], -1))
    save("alu-rough", grey(0.38 + brushed * 0.03 + blot * 0.05))


# ---------------------------------------------------------------- radiator panels
def radiator(n=1024, ribs=16, seed=30):
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    p = (yy % (n / ribs)) / (n / ribs)
    rib = np.exp(-((p - 0.5) / 0.08) ** 2)
    seam = np.exp(-(np.minimum(xx % (n / 2), n / 2 - xx % (n / 2)) / 2.0) ** 2)
    dirt = np.clip(noise(n, 1.8, seed, hi=0.1) * 0.5 + 0.3, 0, 1)
    save("radiator-normal", normal_from(rib * 3.0 - seam * 2.0, 1.0))
    base = srgb((232, 232, 228))
    v = 1 - seam * 0.15 - dirt * 0.05 - rib * 0.03
    save("radiator-color", np.stack([base[0] * v, base[1] * v, base[2] * v], -1))
    save("radiator-rough", grey(0.5 + dirt * 0.1 - rib * 0.08))


# ---------------------------------------------------------------- solar array blanket
def solar(n=1024, cells=(8, 4), seed=40):
    """dark blue cells under cover glass on a gold-tinted blanket; silver fingers and bus bars across each cell"""
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    cw, ch = n / cells[0], n / cells[1]
    s, t = (xx % cw) / cw, (yy % ch) / ch
    gap = (np.minimum(s, 1 - s) * cw < 3) | (np.minimum(t, 1 - t) * ch < 3)
    finger = (np.abs(((s * 24) % 1) - 0.5) < 0.04) & ~gap
    bus = ((np.abs(t - 0.33) < 0.012) | (np.abs(t - 0.67) < 0.012)) & ~gap
    rng = np.random.default_rng(seed)
    cid = (np.floor(yy / ch) * cells[0] + np.floor(xx / cw)).astype(int)
    tone = rng.normal(0, 0.06, cells[0] * cells[1])
    cell = srgb((24, 30, 64)) * (1 + tone[cid])[..., None]
    c = np.where(gap[..., None], srgb((150, 120, 70)), cell)
    c = np.where((finger | bus)[..., None], srgb((150, 152, 160)), c)
    save("solar-color", c)
    save("solar-rough", grey(np.where(gap, 0.5, np.where(finger | bus, 0.35, 0.12))))
    save("solar-metal", grey(np.where(finger | bus, 1.0, 0.0)))
    save("solar-normal", normal_from(np.where(gap, -1.5, 0.0) + (finger | bus) * 0.3, 1.0))


blanket()
foil("gold", (214, 160, 78), seed=10)
foil("silver", (205, 207, 212), seed=13)
aluminium()
radiator()
solar()
