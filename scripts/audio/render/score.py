"""
The score: Surge XT pads under an electric-piano motif, a muted bass pulse with a soft thump at 78 BPM, a slow lead in
Vangelis's manner, a drone whose pitch the page moves with scroll speed, and a sparkle while Tycho thinks. D minor
with a Dorian colour (the G/B in bar 9).

    python score.py <out dir>  ->  <out dir>/<stem>.wav   (pnpm audio:export --render score runs it)
"""
from pedalboard import Compressor, HighpassFilter, LowpassFilter, Pedalboard, Reverb

from composition import bed, keys, lead, pulse_bass, pulse_thump, thinking
from render import CYCLE, Surge, loop, match_seam, normalise, write
from sources import out_dir

def main():
    OUT = out_dir()
    space = lambda wet: Reverb(room_size=0.85, damping=0.55, wet_level=wet, dry_level=1 - wet * 0.5, width=1.0)
    hp = HighpassFilter(cutoff_frequency_hz=120)
    glue = Compressor(threshold_db=-18, ratio=2, attack_ms=20, release_ms=200)

    BED, DRONE, THINK = 37.0, 11.0, 13.0

    s = loop(Surge("Pads/MKS-70 Warm Pad"), bed(BED), BED, Pedalboard([space(0.3), glue]), held=["D2", "A2", "D3"])
    write(OUT, "bed", normalise(match_seam(s), -20))

    k = loop(Surge("Keys/Soft Suitcase"), keys(), CYCLE, Pedalboard([hp, space(0.25)]))
    write(OUT, "keys", normalise(match_seam(k), -24))

    bass = loop(Surge("Basses/Mellow"), pulse_bass(), CYCLE, Pedalboard([LowpassFilter(cutoff_frequency_hz=900)]))
    thump = loop(Surge("Percussion/Kick 909ish"), pulse_thump(), CYCLE, Pedalboard([LowpassFilter(cutoff_frequency_hz=140)]))
    p = normalise(bass, -22) + normalise(thump, -26)
    write(OUT, "pulse", normalise(match_seam(Pedalboard([glue])(p, 48000)), -21))

    l = loop(Surge("Leads/Butter"), lead(), CYCLE, Pedalboard([hp, space(0.35)]))
    write(OUT, "lead", normalise(match_seam(l), -24))

    d = loop(Surge("Pads/Still"), [], DRONE, Pedalboard([LowpassFilter(cutoff_frequency_hz=500)]), held=["D1", "A1"])
    write(OUT, "drone", normalise(match_seam(d), -22))

    t = loop(Surge("Pads/Sparkly"), thinking(THINK), THINK, Pedalboard([hp, space(0.45)]))
    write(OUT, "thinking", normalise(match_seam(t), -26))


if __name__ == "__main__":
    main()
