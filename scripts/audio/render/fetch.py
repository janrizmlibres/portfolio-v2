"""
Fetches the renderer's sources (sources.json) into the cache (sources.py), each once: the Freesound recordings and the
celesta's notes as HQ previews, the Artemis II pad recording cut to the stretch the burns use, the concert hall's
impulse response folded to stereo, and Surge XT (macOS: its VST3 and factory data out of the installer).

    python fetch.py
"""
import json
import os
import re
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile

from sources import CELESTA, FX, HALL, SOURCES

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (portfolio-v2 audio renderer)"}
LIST = json.load(open(os.path.join(HERE, "sources.json")))


def get(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()


def save(url: str, path: str):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=600) as r, open(path, "wb") as f:
        shutil.copyfileobj(r, f)


def ffmpeg(*args: str):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def freesound(who: str, sid: int, out_dir: str, name: str | None = None) -> str:
    """A Freesound sound's HQ preview as a 48 kHz stereo WAV, after checking its page says CC0."""
    if name and os.path.exists(os.path.join(out_dir, f"{name}.wav")):
        return os.path.join(out_dir, f"{name}.wav")
    page = get(f"https://freesound.org/people/{who}/sounds/{sid}/").decode("utf8", "ignore")
    if "publicdomain/zero" not in page:
        raise SystemExit(f"{who}/{sid} is no longer CC0: left out")
    # the celesta's notes are named by their page's title ("C2 soft.wav by stamperadam")
    name = name or re.search(r"<title>[^<]*?([A-G]#?\d) soft", page).group(1)
    out = os.path.join(out_dir, f"{name}.wav")
    if os.path.exists(out):
        return out
    preview = re.search(r"https://cdn\.freesound\.org/previews/[^\"]*-hq\.mp3", page).group(0)
    with tempfile.NamedTemporaryFile(suffix=".mp3") as mp3:
        save(preview, mp3.name)
        ffmpeg("-i", mp3.name, "-ar", "48000", "-ac", "2", out)
    print("fetched", out)
    return out


def launch():
    out = os.path.join(FX, "launch.wav")
    if os.path.exists(out):
        return
    s = LIST["launch"]
    with tempfile.NamedTemporaryFile(suffix=".wav") as raw:
        save(s["url"], raw.name)
        ffmpeg("-ss", str(s["from"]), "-t", str(s["seconds"]), "-i", raw.name, "-ar", "48000", "-ac", "1", out)
    print("fetched", out)


def hall():
    if os.path.exists(HALL):
        return
    from render import stereo_ir

    os.makedirs(os.path.dirname(HALL), exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        z = os.path.join(tmp, "ir.zip")
        save(LIST["hall"]["url"], z)
        zipfile.ZipFile(z).extractall(tmp)
        bformat = next(os.path.join(d, f) for d, _, fs in os.walk(tmp) for f in fs if os.path.join(d, f).endswith(LIST["hall"]["file"]))
        stereo_ir(bformat, HALL)
    print("fetched", HALL)


def surge():
    dest = os.path.join(SOURCES, "surge")
    if os.path.exists(os.path.join(dest, "Surge XT.vst3")):
        return
    if not shutil.which("hdiutil"):
        raise SystemExit("Surge XT: install it from " + LIST["surge"]["url"].rsplit("/", 1)[0] + f" and copy 'Surge XT.vst3' and SurgeXTData into {dest}")
    with tempfile.TemporaryDirectory() as tmp:
        dmg, mnt, pkg = os.path.join(tmp, "surge.dmg"), os.path.join(tmp, "mnt"), os.path.join(tmp, "pkg")
        save(LIST["surge"]["url"], dmg)
        subprocess.run(["hdiutil", "attach", "-nobrowse", "-readonly", "-mountpoint", mnt, dmg], check=True, stdout=subprocess.DEVNULL)
        try:
            inner = next(os.path.join(mnt, f) for f in os.listdir(mnt) if f.endswith(".pkg"))
            subprocess.run(["pkgutil", "--expand-full", inner, pkg], check=True, stdout=subprocess.DEVNULL)
        finally:
            subprocess.run(["hdiutil", "detach", mnt], stdout=subprocess.DEVNULL)
        os.makedirs(dest, exist_ok=True)
        shutil.copytree(os.path.join(pkg, "Surge_XT_VST3.pkg", "Payload", "Surge XT.vst3"), os.path.join(dest, "Surge XT.vst3"), symlinks=True)
        shutil.copytree(os.path.join(pkg, "Surge_XT_Resources.pkg", "Payload"), os.path.join(dest, "SurgeXTData"), symlinks=True)
    print("fetched", dest)


def main():
    os.makedirs(FX, exist_ok=True)
    os.makedirs(CELESTA, exist_ok=True)
    surge()
    launch()
    hall()
    for who, sid, _ in LIST["freesound"]["fx (who, id, what)"]:
        freesound(who, sid, FX, f"{who}_sounds_{sid}")
    c = LIST["freesound"]["celesta"]
    for sid in c["ids"]:
        freesound(c["who"], sid, CELESTA)
    print("sources in", SOURCES)


if __name__ == "__main__":
    main()
