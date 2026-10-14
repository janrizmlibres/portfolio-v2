"""
Tycho's designed chirp bank: four FM grains from Surge XT (sines and FM only, never square or saw), each one note at
A5 a little under half a second long. The voice plays them where it would start an FM chirp, pitched along the
same contour by playback rate, through the same suit radio.

Writes chirp1..4.wav; run through shots.py.
"""
import numpy as np
import soundfile as sf
from pedalboard import HighpassFilter, Pedalboard

import fx
from fx import envelope, peak
from render import SR, Note, Surge, midi

GRAINS = ["Plucks/Diamonds", "Leads/µcomputer", "Leads/Cell", "Keys/DX EP"]


def main():
    for i, patch in enumerate(GRAINS, 1):
        y = Surge(patch).render([Note(0.2, 0.3, midi("A5"), 100)], 1.0)[:, int(0.2 * SR) : int(0.65 * SR)]
        y = Pedalboard([HighpassFilter(300)])(y, SR)
        y = envelope(y, 0.003, 0.12)
        y = peak(y, -3)
        sf.write(f"{fx.OUT}/chirp{i}.wav", y.T, SR, subtype="FLOAT")
        print(f"chirp{i} {patch} rms {20 * np.log10(np.sqrt(np.mean(y**2)) + 1e-9):.1f}")


