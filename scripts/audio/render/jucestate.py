"""Surge XT's plugin state is JUCE's base64 variant inside an XML blob: decode and encode it, so a factory patch can be
swapped into a loaded instance (render.py's Surge.load)."""
import re
ALPHA = ".ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+"
def jdec(s):
    size, enc = s.split(".", 1)
    size = int(size); out = bytearray(size); bit = 0
    for ch in enc:
        v = ALPHA.index(ch)
        for b in range(6):
            if bit >= size*8: break
            if v & (1<<b): out[bit>>3] |= 1 << (bit & 7)
            bit += 1
    return bytes(out)
def jenc(data):
    size = len(data); nbits = size*8; chars = []
    for i in range(0, nbits, 6):
        v = 0
        for b in range(6):
            bit = i+b
            if bit < nbits and data[bit>>3] & (1 << (bit & 7)): v |= 1<<b
        chars.append(ALPHA[v])
    return f"{size}." + "".join(chars)
def split(raw):
    m = re.search(rb"<IComponent>(.*?)</IComponent>", raw, re.S)
    return m

import struct
def load_fxp(plugin, path):
    fxp = open(path, "rb").read()
    chunk = fxp[60:]
    raw = plugin.raw_state
    m = split(raw)
    xml = raw[8:8+struct.unpack("<I", raw[4:8])[0]]
    newxml = xml.replace(m.group(1), jenc(chunk).encode())
    plugin.raw_state = b"VC2!" + struct.pack("<I", len(newxml)) + newxml + raw[8+len(xml):]
