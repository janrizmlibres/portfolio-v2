"""
Renders every one-shot the page plays: the scene changes, the warp, the quiet layer (fx.py), Tycho's chirp grains
(chirps.py) and his emotes (emotes.py, which reads the grains), and the instrument's notes (inst.py).

    python shots.py <out dir>  ->  <out dir>/<name>.wav   (pnpm audio:export --render shots runs it)
"""
import chirps
import emotes
import fx
import inst
from sources import out_dir


def main():
    fx.OUT = out_dir()
    fx.main()
    fx.interface()
    fx.warp()
    chirps.main()
    emotes.main()
    inst.main()


if __name__ == "__main__":
    main()
