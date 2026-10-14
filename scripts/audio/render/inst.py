"""
The instrument: each star a note of D minor pentatonic, D5 to D7. Two voices, each rendered note by note (no
pitch-shifting in the page), mono, two seconds with a short room:
- celesta: stamperadam's soft celesta (Freesound, CC0; HQ previews), where the sky can be dragged;
- bell: Surge XT's Bell 2, the score's family: a star hovered anywhere else, and a star lit as Tycho reads.
Writes inst-<voice>-<midi>.wav; run through shots.py.
"""
import glob
import os

import numpy as np
import soundfile as sf
from pedalboard import Convolution, Pedalboard

import fx
from fx import HALL, envelope, peak
from render import SR, Note, Sampler, Surge, midi
from sources import CELESTA

SCALE = [midi(n) for n in ("D5", "F5", "G5", "A5", "C6", "D6", "F6", "G6", "A6", "C7", "D7")]
LEN = 2.0


def celesta():
    # the pack's files are named two octaves under the pitch they sound at (C2.wav sounds C4)
    zones = {}
    for f in glob.glob(f"{CELESTA}/*.wav"):
        n, o = os.path.basename(f)[:-5], int(os.path.basename(f)[-5])
        zones[12 * (o + 1) + {"C": 0, "E": 4, "G#": 8}[n] + 24] = [f]
    return Sampler(zones, release=1.0)


def render_set(name, inst):
    room = Pedalboard([Convolution(HALL, mix=0.18)])
    for m in SCALE:
        y = inst.render([Note(0.0, 1.2, m, 80)], LEN + 0.5)
        y = room(y, SR)[:, : int(LEN * SR)]
        y = envelope(y, 0.002, 0.5).mean(axis=0, keepdims=True).repeat(2, axis=0)
        sf.write(f"{fx.OUT}/inst-{name}-{m}.wav", peak(y, -6).T, SR, subtype="FLOAT")
    print(name, "done")


class Bell:
    def __init__(self):
        self.s = Surge("Plucks/Bell 2")

    def render(self, notes, seconds):
        return self.s.render([Note(0.3, n.dur, n.pitch, n.vel) for n in notes], seconds + 0.3)[:, int(0.3 * SR) :]


def main():
    # the celesta plays where the sky drags; the bell for a star hovered anywhere else, and a star lit as he reads
    render_set("celesta", celesta())
    render_set("bell", Bell())


