"""
Tycho's emotes as sound: his body, not his radio. The chirp grains (chirps.py) pitched along a gesture's contour,
and real servo recordings (Freesound CC0) for the moves. One file per emote in lib/tycho/rig.ts's list.

Writes emote-<name>.wav (after chirps.py, whose grains it reads); run through shots.py.
"""
import numpy as np
import soundfile as sf
from pedalboard import HighpassFilter, LowpassFilter, Pedalboard, PitchShift

import fx
from fx import envelope, finish, hall, pad, place, src
from render import SR


def grain(i):
    x, _ = sf.read(f"{fx.OUT}/chirp{i}.wav", always_2d=True, dtype="float32")
    return x.T


def glide(y, r0, r1, seconds):
    """Plays `y` with its speed moving from r0 to r1 (exponentially) over `seconds`: a pitched chirp gesture."""
    n = int(seconds * SR)
    rate = r0 * (r1 / r0) ** np.linspace(0, 1, n)
    pos = np.cumsum(rate)
    pos = pos[pos < y.shape[1] - 1]
    out = np.stack([np.interp(pos, np.arange(y.shape[1]), y[c]) for c in range(2)]).astype("float32")
    return envelope(out, 0.004, min(0.06, out.shape[1] / SR / 3))


def servo(a, b, semis=0.0, hp=300):
    y = src("derjuli_sounds_824121", a, b, fade=0.03)
    return Pedalboard([PitchShift(semitones=semis), HighpassFilter(hp), LowpassFilter(6000)])(y, SR)


def emote(name, parts, seconds, db):
    out = np.zeros((2, int(seconds * SR)), dtype="float32")
    for y, at, g in parts:
        place(out, y, at, g)
    finish(f"emote-{name}", hall(out, 0.12), db)


def main():
    g1, g2, g3 = grain(1), grain(2), grain(3)
    emote("greet", [(glide(g2, 0.9, 1.3, 0.16), 0.0, 1), (glide(g2, 1.1, 1.7, 0.2), 0.18, 1), (servo(2.0, 2.4, 3), 0.0, 0.4)], 0.8, -16)
    emote("notice", [(glide(g1, 0.95, 1.45, 0.14), 0.05, 1), (servo(3.0, 3.25, 5), 0.0, 0.35)], 0.6, -18)
    emote("apologise", [(glide(g3, 1.2, 0.7, 0.35), 0.0, 1), (servo(4.0, 4.6, -3), 0.05, 0.3)], 0.9, -18)
    emote("allGood", [(glide(g1, 1.25, 1.3, 0.08), 0.0, 1), (glide(g1, 1.5, 1.6, 0.1), 0.12, 1)], 0.5, -18)
    emote("flinch", [(glide(g2, 1.8, 0.8, 0.12), 0.0, 1), (servo(5.0, 5.18, 7, 500), 0.0, 0.7)], 0.5, -15)
    emote("point", [(servo(6.0, 6.5, 2), 0.0, 1)], 0.7, -20)
    emote("glance", [(servo(7.0, 7.22, 6), 0.0, 1)], 0.4, -24)
    emote("scoot", [(servo(8.0, 8.6, 0), 0.0, 1), (glide(g1, 1.0, 1.2, 0.1), 0.45, 0.6)], 0.9, -20)
    emote("anticipate", [(envelope(servo(9.0, 9.7, -2), 0.4, 0.15), 0.0, 1)], 0.9, -22)
    emote("settle", [(envelope(servo(10.0, 10.7, -6), 0.05, 0.4), 0.0, 1)], 0.9, -22)


