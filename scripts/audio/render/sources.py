"""
Where the renderer's sources live: downloaded by fetch.py into a cache outside the repo (they're not ours to commit),
`$AUDIO_SOURCES` or ~/.cache/portfolio-v2-audio. sources.json lists each with its licence.
"""
import os
import sys

SOURCES = os.path.expanduser(os.environ.get("AUDIO_SOURCES", "~/.cache/portfolio-v2-audio"))
FX = os.path.join(SOURCES, "fx")
CELESTA = os.path.join(SOURCES, "celesta")
HALL = os.path.join(SOURCES, "ir", "jack-lyons-stereo.wav")


def out_dir() -> str:
    """Where a render script writes its WAVs: its first argument (pnpm audio:export passes a temporary folder)."""
    if len(sys.argv) < 2:
        sys.exit(f"usage: {os.path.basename(sys.argv[0])} <out dir>")
    os.makedirs(sys.argv[1], exist_ok=True)
    return sys.argv[1]
