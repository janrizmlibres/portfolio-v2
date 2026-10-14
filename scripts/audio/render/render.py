"""
The score's renderer: Surge XT hosted headless by pedalboard, a sampler for recorded notes, the loop trick and the
stem writer. Each stem is a list of note events (composition.py) turned into a seamless loop at 48 kHz and written as
<stem>.wav for `pnpm audio:export`.

Loops: each stem is rendered for three cycles in one pass and the middle one kept, so it already carries the first
cycle's tails and wraps without a seam.
"""
from __future__ import annotations

import os
import struct
from dataclasses import dataclass, field

import numpy as np
import pedalboard
import soundfile as sf
from mido import Message

from jucestate import jenc, split
from sources import SOURCES

SR = 48000
BPM = 78
BEAT = 60 / BPM
BAR = 4 * BEAT
CYCLE = 10 * BAR  # the pulsed loop: 10 bars, 30.77 s

SURGE = os.path.join(SOURCES, "surge", "Surge XT.vst3")
PATCHES = os.path.join(SOURCES, "surge", "SurgeXTData", "patches_factory")

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def midi(name: str) -> int:
    """'D3' -> 50, 'Bb1' -> 34."""
    pitch, octave = name[:-1], int(name[-1])
    return 12 * (octave + 1) + NOTE[pitch]


@dataclass
class Note:
    t: float  # seconds into the cycle
    dur: float
    pitch: int
    vel: int = 90


def notes(spec: list[tuple[float, float, str | int, int]]) -> list[Note]:
    return [Note(t, d, midi(p) if isinstance(p, str) else p, v) for t, d, p, v in spec]


# ------------------------------------------------------------------ instruments
class Surge:
    """One Surge XT instance with a factory patch loaded."""

    def __init__(self, patch: str):
        self.plugin = pedalboard.load_plugin(SURGE)
        self.load(os.path.join(PATCHES, patch + ".fxp"))
        # the first render after a patch load drops its first events; warm it up
        self.plugin([Message("note_on", note=60, velocity=1, time=0.1), Message("note_off", note=60, time=0.2)], duration=1.0, sample_rate=SR, num_channels=2, reset=False)
        self.plugin([], duration=2.0, sample_rate=SR, num_channels=2, reset=False)

    def load(self, path: str):
        chunk = open(path, "rb").read()[60:]
        raw = self.plugin.raw_state
        m = split(raw)
        xml = raw[8 : 8 + struct.unpack("<I", raw[4:8])[0]]
        new = xml.replace(m.group(1), jenc(chunk).encode())
        self.plugin.raw_state = b"VC2!" + struct.pack("<I", len(new)) + new + raw[8 + len(xml) :]

    def render(self, events: list[Note], duration: float) -> np.ndarray:
        msgs = []
        for n in events:
            msgs.append(Message("note_on", note=n.pitch, velocity=n.vel, time=n.t))
            msgs.append(Message("note_off", note=n.pitch, time=n.t + n.dur))
        msgs.sort(key=lambda m: m.time)
        out = self.plugin(msgs, duration=duration, sample_rate=SR, num_channels=2, reset=False)
        self.plugin([], duration=1.0, sample_rate=SR, num_channels=2, reset=False)  # let it fall silent before the next use
        return out


class Sampler:
    """Recorded multisamples: {midi note: [wav paths, one per velocity layer, soft to loud]}. Plays the nearest
    sample, repitched by resampling, with an attack and a release fade. A note held longer than its sample is
    re-bowed: overlapping copies crossfaded, as a section changes bow."""

    def __init__(self, zones: dict[int, list[str]], release: float = 0.4, gain: float = 1.0, attack: float = 0.0, skip: float = 0.0, trim: float = 0.0):
        self.zones = {k: [self._read(p) for p in v] for k, v in zones.items()}
        self.release = release
        self.gain = gain
        self.attack = attack
        self.skip = skip  # seconds of each sample's own attack to skip (for re-bowed copies)
        self.trim = trim  # seconds of each sample's own fading tail to leave out of a re-bowed hold

    @staticmethod
    def _read(path: str) -> np.ndarray:
        x, sr = sf.read(path, always_2d=True, dtype="float32")
        if x.shape[1] == 1:
            x = np.repeat(x, 2, axis=1)
        if sr != SR:
            n = int(round(len(x) * SR / sr))
            idx = np.linspace(0, len(x) - 1, n)
            x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], axis=1).astype("float32")
        return x.T

    def _voice(self, x: np.ndarray, ratio: float, seconds: float, start: float = 0.0) -> np.ndarray:
        length = int(min((x.shape[1] - start * SR) / ratio, seconds * SR))
        idx = start * SR + np.arange(max(0, length)) * ratio
        return np.stack([np.interp(idx, np.arange(x.shape[1]), x[c]) for c in range(2)]).astype("float32")

    def render(self, events: list[Note], duration: float) -> np.ndarray:
        out = np.zeros((2, int(duration * SR)), dtype="float32")
        keys = np.array(sorted(self.zones))
        for n in events:
            k = int(keys[np.argmin(np.abs(keys - n.pitch))])
            layers = self.zones[k]
            x = layers[min(len(layers) - 1, int(n.vel / 128 * len(layers)))]
            ratio = 2 ** ((n.pitch - k) / 12)
            avail = x.shape[1] / ratio / SR
            want = n.dur + self.release
            if want <= avail:
                y = self._voice(x, ratio, want)
            else:
                # re-bow: copies of the sample's body, each overlapping the last by a 1.5 s equal-power crossfade
                xf = 1.5
                avail -= self.trim / ratio
                body = flatten(self._voice(x, ratio, avail), after=self.skip)
                step = max(int(1.0 * SR), int((avail - self.skip - xf) * SR))
                total = int(want * SR)
                y = np.zeros((2, total), dtype="float32")
                y[:, : min(total, body.shape[1])] = body[:, :total]
                pos = body.shape[1] - int(xf * SR)
                cont = flatten(self._voice(x, ratio, avail - self.skip, self.skip))
                while pos < total:
                    seg = cont.copy()
                    f = int(xf * SR)
                    fade_in = np.sin(np.linspace(0, np.pi / 2, f)) ** 1
                    seg[:, :f] *= fade_in
                    e = min(total, pos + seg.shape[1])
                    # fade the copy already sounding out under the new one
                    o = min(f, total - pos)
                    y[:, pos : pos + o] *= np.cos(np.linspace(0, np.pi / 2, f))[:o]
                    y[:, pos:e] += seg[:, : e - pos]
                    pos += step
            length = y.shape[1]
            if self.attack > 0:
                a = min(length, int(self.attack * SR))
                y[:, :a] *= np.linspace(0, 1, a) ** 2
            hold = int(n.dur * SR)
            if length > hold:
                fade = np.ones(length, dtype="float32")
                r = length - hold
                fade[hold:] = np.exp(-5 * np.arange(r) / max(r, 1))
                y *= fade
            y = y * ((n.vel / 127) ** 1.5 * self.gain)
            s = int(n.t * SR)
            e = min(out.shape[1], s + length)
            if e > s:
                out[:, s:e] += y[:, : e - s]
        return out


def flatten(y: np.ndarray, after: float = 0.0, window: float = 0.6) -> np.ndarray:
    """Evens out a sustained sample's slow swell and fade (from `after` seconds on), so a re-bowed hold stays level."""
    x = y.mean(axis=0)
    w = int(window * SR)
    env = np.sqrt(np.convolve(x**2, np.ones(w) / w, mode="same")) + 1e-6
    a = int(after * SR)
    target = np.median(env[a:]) if len(env) > a else np.median(env)
    g = np.ones_like(env)
    g[a:] = np.clip(target / env[a:], 0.25, 4.0)
    if a > 0:
        # ease from the sample's own attack into the levelled body
        r = min(w, len(g) - a)
        g[a : a + r] = np.linspace(1, 1, r) * (np.linspace(0, 1, r) * g[a : a + r] + np.linspace(1, 0, r))
    return (y * g).astype("float32")


# ------------------------------------------------------------------ loops and stems
def loop(instrument, cycle_events: list[Note], length: float, fx: pedalboard.Pedalboard | None = None, held: list[str] = ()) -> np.ndarray:
    """Renders three cycles in one pass and keeps the middle one, which carries the first's tails. `held` notes sound
    straight through all three, so a drone never retriggers at the wrap."""
    events = [Note(n.t + k * length, n.dur, n.pitch, n.vel) for k in range(3) for n in cycle_events]
    events += [Note(0, 3 * length + 0.5, midi(p), 70) for p in held]
    y = instrument.render(events, 3 * length + 1.0)
    if fx is not None:
        y = fx(y, SR, reset=True)
    n = int(round(length * SR))
    return y[:, n : 2 * n]


def match_seam(y: np.ndarray, ms: float = 4.0) -> np.ndarray:
    """Eases the last few ms towards the first sample, for a stem whose effect tails don't quite agree."""
    n = int(ms / 1000 * SR)
    w = np.linspace(0, 1, n, dtype="float32")
    y = y.copy()
    y[:, -n:] = y[:, -n:] * (1 - w) + y[:, :1] * w
    return y


def normalise(y: np.ndarray, rms_db: float, peak_db: float = -1.0) -> np.ndarray:
    rms = np.sqrt(np.mean(y**2)) or 1e-9
    g = 10 ** (rms_db / 20) / rms
    peak = np.abs(y).max() * g
    if peak > 10 ** (peak_db / 20):
        g *= 10 ** (peak_db / 20) / peak
    return (y * g).astype("float32")


def write(dir: str, name: str, y: np.ndarray):
    os.makedirs(dir, exist_ok=True)
    sf.write(os.path.join(dir, f"{name}.wav"), y.T, SR, subtype="FLOAT")
    rms = 20 * np.log10(np.sqrt(np.mean(y**2)) or 1e-9)
    print(f"{name:9} {y.shape[1] / SR:6.2f} s  rms {rms:6.1f} dBFS  peak {20 * np.log10(np.abs(y).max() or 1e-9):6.1f}")


def stereo_ir(bformat: str, out: str, width: float = 0.7) -> str:
    """A stereo impulse response from a B-format one (W, X, Y, Z): left = W + wY, right = W - wY."""
    x, sr = sf.read(bformat, always_2d=True, dtype="float32")
    w, y = x[:, 0], x[:, 2]
    st = np.stack([w + width * y, w - width * y], axis=1)
    n = int(round(len(st) * SR / sr))
    idx = np.linspace(0, len(st) - 1, n)
    st = np.stack([np.interp(idx, np.arange(len(st)), st[:, c]) for c in range(2)], axis=1)
    st /= np.abs(st).max()
    sf.write(out, st, SR, subtype="FLOAT")
    return out
