"""
The scene changes and the wake's clunk, designed from recordings with A2's own synth for the tonal layers, as film
sound is built: a real source for the body, a sub for the weight, a ring for the tail.

Sources (sources.json; fetched by fetch.py, never committed):
- NASA: the Artemis II launch, pad microphone CS6 (2026-04-01; public domain, credit NASA/Lorne Mathre).
- Freesound CC0 (HQ previews): brktkrgll's sub-bass drop, Jofae's low impact, Skullsmasha's mechanical clamp,
  suspensiondigital's latch hit, Burningmonkey's servo, harrisonlace's shimmer, NahuelMartinez's stone slab grind,
  karlis.stigis's ice cracks, reathance's riser.
- Surge XT (A2's synth): the bell ring and the pad swell, in the score's key.

Run through shots.py, which renders every one-shot.
"""
import os

import numpy as np
import soundfile as sf
from pedalboard import Compressor, Convolution, Gain, HighpassFilter, Limiter, LowpassFilter, Pedalboard, PitchShift, Reverb

from render import SR, Note, Surge, midi
from sources import FX, HALL

# where every shot is written: set by shots.py
OUT = ""


def src(name, a, b, fade=0.05):
    """A stretch of a source recording, stereo, with short fades."""
    x, sr = sf.read(f"{FX}/{name}.wav", always_2d=True, dtype="float32")
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    y = x[int(a * sr) : int(b * sr)].T.copy()
    f = int(fade * SR)
    if f:
        y[:, :f] *= np.linspace(0, 1, f)
        y[:, -f:] *= np.linspace(1, 0, f)
    return y


def pad(y, seconds):
    out = np.zeros((2, int(seconds * SR)), dtype="float32")
    out[:, : min(out.shape[1], y.shape[1])] = y[:, : out.shape[1]]
    return out


def place(dst, y, at, gain=1.0):
    s = int(at * SR)
    e = min(dst.shape[1], s + y.shape[1])
    dst[:, s:e] += y[:, : e - s] * gain


def peak(y, db):
    return (y * (10 ** (db / 20) / (np.abs(y).max() + 1e-9))).astype("float32")


def envelope(y, attack, release):
    n = y.shape[1]
    e = np.ones(n, dtype="float32")
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a) ** 2
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 1.5
    return y * e


def surge(patch, notes, seconds):
    return Surge(patch).render(notes, seconds)


def hall(y, mix=0.3):
    return Pedalboard([Convolution(HALL, mix=mix)])(y, SR)


def finish(name, y, db=-3.0):
    y = Pedalboard([Limiter(threshold_db=-1.0, release_ms=120)])(y, SR)
    y = envelope(y, 0, min(0.4, y.shape[1] / SR / 3))  # every shot ends in silence, never on a cut
    y = peak(y, db)
    os.makedirs(OUT, exist_ok=True)
    sf.write(f"{OUT}/{name}.wav", y.T, SR, subtype="FLOAT")
    rms = 20 * np.log10(np.sqrt(np.mean(y**2)) + 1e-9)
    print(f"{name:8} {y.shape[1] / SR:5.2f} s  peak {db:5.1f}  rms {rms:6.1f}")


def main():
    # the dive past his star: rise -> impact -> ring
    out = np.zeros((2, int(9.5 * SR)), dtype="float32")
    rise = envelope(src("reathance_sounds_503818", 0.5, 5.6), 2.5, 0.15)
    place(out, Pedalboard([HighpassFilter(200)])(rise, SR), 0.0, 0.55)
    place(out, envelope(src("brktkrgll_sounds_856174", 0.25, 3.9), 0, 1.2), 5.0, 0.9)
    place(out, src("Jofae_sounds_408141", 0.0, 3.0), 5.05, 0.6)
    ring = surge("Plucks/Bell 1", [Note(0.5, 0.6, midi("D5"), 70), Note(0.5, 0.6, midi("A5"), 60)], 3.5)[:, int(0.45 * SR) :]
    place(out, hall(ring, 0.5), 5.05, 0.5)
    finish("dive", out, -6.0)

    # the orbit peeling off: the circle round home unwinding into the trajectory. A soft tone glides up a fifth as
    # the line straightens, over a breath of air, and the month ticks pass under it (no engine: nothing fires)
    out = np.zeros((2, int(3.4 * SR)), dtype="float32")
    tone = surge("Leads/Butter", [Note(0.3, 2.6, midi("A4"), 60)], 3.4)[:, int(0.3 * SR) :]
    n = tone.shape[1]
    rate = 1.0 * (1.5 ** (np.clip(np.linspace(-0.2, 1.1, n), 0, 1) ** 1.6))
    pos = np.cumsum(rate)
    pos = pos[pos < n - 1]
    gl = np.stack([np.interp(pos, np.arange(n), tone[c]) for c in range(2)]).astype("float32")
    place(out, envelope(Pedalboard([HighpassFilter(250)])(gl, SR), 0.6, 0.9), 0.0, 0.5)
    place(out, envelope(Pedalboard([HighpassFilter(1200)])(src("reathance_sounds_503818", 2.0, 4.6), SR), 1.0, 1.0), 0.2, 0.3)
    tick = Pedalboard([HighpassFilter(2000), PitchShift(semitones=14)])(src("suspensiondigital_sounds_389705", 0.0, 0.05, fade=0.004), SR)
    for k, at in enumerate(np.cumsum(np.linspace(0.32, 0.16, 10))):
        place(out, tick, 0.3 + at, 0.25 * (0.6 + 0.4 * k / 9))
    finish("peel", hall(out, 0.3), -12.0)

    # docking at a gate: the clamp's travel and hit, a latch, over a low boom
    out = np.zeros((2, int(3.2 * SR)), dtype="float32")
    place(out, src("Skullsmasha_sounds_123253", 1.7, 4.4), 0.0, 0.9)
    place(out, Pedalboard([HighpassFilter(300)])(src("suspensiondigital_sounds_389705", 0.0, 0.38), SR), 0.6, 0.5)
    place(out, envelope(Pedalboard([LowpassFilter(150)])(src("brktkrgll_sounds_856174", 0.3, 2.6), SR), 0, 1.0), 0.55, 0.7)
    finish("dock", hall(out, 0.15), -8.0)


    # Athena opening: ice cracking over a slow grind of stone
    out = np.zeros((2, int(4.0 * SR)), dtype="float32")
    place(out, envelope(src("NahuelMartinez_sounds_844329", 4.8, 8.4), 0.6, 1.0), 0.0, 0.7)
    place(out, Pedalboard([HighpassFilter(250)])(src("karlis.stigis_sounds_168712", 4.0, 7.5), SR), 0.3, 0.9)
    place(out, envelope(Pedalboard([LowpassFilter(120)])(src("brktkrgll_sounds_856174", 0.4, 2.5), SR), 0, 0.9), 0.2, 0.35)
    finish("open", hall(out, 0.25), -7.0)

    # the climax at "Paid for once": the boom on the line, and the whole chord ringing out
    out = np.zeros((2, 7 * SR), dtype="float32")
    place(out, envelope(src("brktkrgll_sounds_856174", 0.25, 3.9), 0, 1.2), 0.0, 1.0)
    place(out, src("Jofae_sounds_408141", 0.0, 6.5), 0.0, 0.8)
    chord = surge("Pads/MKS-70 Warm Pad", [Note(0.5, 2.5, midi(p), 80) for p in ("D3", "A3", "F4", "C5", "E5")], 6.5)[:, int(0.45 * SR) :]
    place(out, hall(chord, 0.45), 0.0, 0.45)
    finish("climax", out, -4.5)

    # the record flipping into the ribbon: a card flipped over, the ribbon's cards riffling out one after another,
    # and the last one settling
    out = np.zeros((2, int(2.4 * SR)), dtype="float32")
    place(out, src("qubodup_sounds_442858", 0.0, 0.55), 0.0, 0.8)
    place(out, envelope(src("Kodack_sounds_256508", 0.3, 1.75), 0.15, 0.4), 0.25, 0.9)
    last = Pedalboard([PitchShift(semitones=-2)])(src("qubodup_sounds_442858", 0.0, 0.55), SR)
    place(out, last, 1.65, 0.6)
    finish("ribbon", hall(out, 0.15), -4.0)

    # the pull-out at Contact: the score's own pad swelling, then settling into the thin bed
    sw = surge("Pads/MKS-70 Warm Pad", [Note(0.5, 4.0, midi(p), 70) for p in ("D3", "A3", "E4", "A4")], 7.5)[:, int(0.5 * SR) :]
    sw = envelope(sw, 3.0, 2.5)
    finish("pullout", hall(sw, 0.5), -9.0)

    # the wake's first sound: a soft relay, his systems coming on
    relay = Pedalboard([HighpassFilter(600), PitchShift(semitones=5)])(src("suspensiondigital_sounds_389705", 0.0, 0.3, fade=0.01), SR)
    finish("relay", hall(pad(relay, 0.9), 0.12), -12.0)


def warp():
    """The warp: a rising drone as he sets out (cut short if the trip is hurried), and the white hole's arrival."""
    # setting out: the riser over the launch's roar, swelling to the hidden jump (~3.3 s) and gone by arrival (~3.8 s)
    out = np.zeros((2, int(4.0 * SR)), dtype="float32")
    place(out, envelope(Pedalboard([HighpassFilter(150)])(src("reathance_sounds_503818", 0.5, 4.3), SR), 2.4, 0.5), 0.0, 0.6)
    roar = Pedalboard([LowpassFilter(500), Gain(8)])(src("launch", 14.0, 18.0, fade=0.3), SR)
    place(out, envelope(roar, 2.8, 0.6), 0.0, 0.5)
    rise = surge("Pads/MKS-70 Warm Pad", [Note(0.5, 3.5, midi(p), 70) for p in ("D3", "A3", "D4")], 4.5)[:, int(0.5 * SR) :]
    place(out, envelope(rise, 3.0, 0.5), 0.0, 0.35)
    finish("warp", hall(out, 0.25), -8.0)
    # arriving: the boom as the white hole opens, and a bright chord ringing out into the place he lands
    out = np.zeros((2, int(4.5 * SR)), dtype="float32")
    place(out, envelope(src("brktkrgll_sounds_856174", 0.25, 3.0), 0, 1.0), 0.0, 0.8)
    ring = surge("Plucks/Bell 2", [Note(0.3, 0.8, midi(p), 80) for p in ("D5", "A5", "E6")], 4.5)[:, int(0.25 * SR) :]
    place(out, hall(ring, 0.5), 0.02, 0.5)
    finish("warp-arrive", out, -9.0)


def interface():
    """The quiet layer: the crawler's fairing, and the UI's ticks. (A hovered star's bell is the instrument's, rendered
    by inst.py; dragging the sky is silent.)"""
    # the crawler's fairing parting: the clamp's motor, its release, a thump of air
    out = np.zeros((2, int(2.6 * SR)), dtype="float32")
    place(out, src("Skullsmasha_sounds_123253", 0.2, 1.9), 0.0, 0.7)
    place(out, Pedalboard([HighpassFilter(300)])(src("suspensiondigital_sounds_389705", 0.0, 0.38), SR), 1.5, 0.6)
    place(out, envelope(Pedalboard([LowpassFilter(160)])(src("brktkrgll_sounds_856174", 0.4, 1.6), SR), 0, 0.6), 1.5, 0.5)
    finish("fairing", hall(out, 0.2), -10.0)
    # UI ticks: tiny, dry, under everything
    tick = Pedalboard([HighpassFilter(1200), PitchShift(semitones=12)])(src("suspensiondigital_sounds_389705", 0.0, 0.08, fade=0.005), SR)
    finish("ui-hover", pad(tick, 0.15), -30.0)
    click = Pedalboard([HighpassFilter(500), PitchShift(semitones=7)])(src("suspensiondigital_sounds_389705", 0.0, 0.15, fade=0.005), SR)
    finish("ui-click", hall(pad(click, 0.4), 0.1), -22.0)
    # the bubble unfolding and folding: the shimmer's breath, rising and falling
    br = Pedalboard([HighpassFilter(800)])(src("harrisonlace_sounds_771946", 0.4, 1.0), SR)
    finish("ui-open", envelope(br, 0.15, 0.25), -24.0)
    finish("ui-fold", envelope(br[:, ::-1].copy(), 0.05, 0.3), -26.0)
    finish("toggle", hall(pad(click, 0.4), 0.1), -20.0)


