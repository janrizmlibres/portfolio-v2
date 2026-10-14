"""
The score's composition, shared by every take: D minor with a Dorian colour (the G/B in bar 9) at 78 BPM, a 10-bar
pulsed cycle, and the unpulsed bed's colour notes, which sit over every chord in the cycle (E, G, A, D).
"""
import random

from render import BAR, BEAT, Note, midi

# bar by bar: (bass root, voicing for the keys)
CHORDS = [
    ("D2", ["A3", "C4", "E4", "F4"]),  # Dm9
    ("D2", ["A3", "C4", "E4", "F4"]),
    ("Bb1", ["F3", "A3", "D4", "F4"]),  # Bbmaj7
    ("Bb1", ["F3", "A3", "D4", "F4"]),
    ("F2", ["A3", "C4", "E4", "A4"]),  # Fmaj7
    ("F2", ["A3", "C4", "E4", "A4"]),
    ("C2", ["G3", "C4", "D4", "E4"]),  # Cadd9
    ("C2", ["G3", "C4", "D4", "E4"]),
    ("B1", ["G3", "B3", "D4", "G4"]),  # G/B, the Dorian colour
    ("A1", ["E3", "A3", "D4", "E4"]),  # Asus4 (resolving in the bar's second half)
]


def at(bar: int, beat: float) -> float:
    return bar * BAR + beat * BEAT


def pulse_bass():
    out = []
    for b, (root, _) in enumerate(CHORDS):
        for beat in range(4):
            out.append(Note(at(b, beat), BEAT * 0.55, midi(root), 92 if beat == 0 else 70))
    return out


def pulse_thump():
    # the heartbeat: a soft low thump on 1 and 3
    return [Note(at(b, beat), 0.2, midi("C2"), 100 if beat == 0 else 80) for b in range(10) for beat in (0, 2)]


def keys():
    out = []
    shape = [(0, 0), (1, 1), (1.5, 2), (2.5, 1), (3, 3)]
    for b, (_, v) in enumerate(CHORDS):
        if b == 9:
            v = v[:3] + ["C#4"]
        for beat, i in shape:
            out.append(Note(at(b, beat), BEAT * 1.6, midi(v[i]), 64 + (8 if beat == 0 else 0)))
    return out


def lead():
    spec = [
        (0, 0, 6, "A4"), (1, 2, 1, "G4"), (1, 3, 1, "F4"),
        (2, 0, 6, "D5"), (3, 2, 1, "C5"), (3, 3, 1, "A4"),
        (4, 0, 8, "C5"),
        (6, 0, 4, "E5"), (7, 0, 4, "D5"),
        (8, 0, 4, "B4"), (9, 0, 4, "A4"),
    ]
    return [Note(at(b, beat), d * BEAT * 0.98, midi(p), 76) for b, beat, d, p in spec]


def bed(length):
    # unpulsed: D and A always, with colour notes that sit over every chord in the cycle (E, G, A, D)
    colour = [(2, 12, "E4"), (11, 12, "G4"), (20, 10, "A4"), (28, length - 28 + 3, "D5")]
    return [Note(t, d, midi(p), 58) for t, d, p in colour]



def thinking(length):
    rnd = random.Random(7)
    pool = ["D5", "E5", "A5", "D6", "E6"]
    out, t = [], 0.4
    while t < length - 0.5:
        out.append(Note(t, 1.2, midi(rnd.choice(pool)), rnd.randint(40, 70)))
        t += rnd.uniform(0.5, 1.4)
    return out


