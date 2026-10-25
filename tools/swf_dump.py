import struct, sys, zlib, os

TAG_NAMES = {
    0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject", 5: "RemoveObject",
    6: "DefineBits", 7: "DefineButton", 8: "JPEGTables", 9: "SetBackgroundColor",
    10: "DefineFont", 11: "DefineText", 12: "DoAction", 13: "DefineFontInfo",
    14: "DefineSound", 15: "StartSound", 17: "DefineButtonSound", 18: "SoundStreamHead",
    19: "SoundStreamBlock", 20: "DefineBitsLossless", 21: "DefineBitsJPEG2",
    22: "DefineShape2", 23: "DefineButtonCxform", 24: "Protect", 26: "PlaceObject2",
    28: "RemoveObject2", 32: "DefineShape3", 33: "DefineText2", 34: "DefineButton2",
    35: "DefineBitsJPEG3", 36: "DefineBitsLossless2", 37: "DefineEditText",
    39: "DefineSprite", 43: "FrameLabel", 45: "SoundStreamHead2", 46: "DefineMorphShape",
    48: "DefineFont2", 56: "ExportAssets", 57: "ImportAssets", 58: "EnableDebugger",
    59: "DoInitAction", 60: "DefineVideoStream", 61: "VideoFrame", 62: "DefineFontInfo2",
    64: "EnableDebugger2", 65: "ScriptLimits", 66: "SetTabIndex", 69: "FileAttributes",
    70: "PlaceObject3", 71: "ImportAssets2", 73: "DefineFontAlignZones", 74: "CSMTextSettings",
    75: "DefineFont3", 76: "SymbolClass", 77: "Metadata", 78: "DefineScalingGrid",
    82: "DoABC", 83: "DefineShape4", 84: "DefineMorphShape2", 86: "DefineSceneAndFrameLabelData",
    87: "DefineBinaryData", 88: "DefineFontName", 89: "StartSound2", 90: "DefineBitsJPEG4",
    91: "DefineFont4", 93: "EnableTelemetry",
}

def read_rect(data, off):
    nbits = data[off] >> 3
    total = 5 + 4*nbits
    nbytes = (total + 7)//8
    return off + nbytes

def dump(path):
    b = open(path, 'rb').read()
    magic = b[:3]
    version = b[3]
    flen = struct.unpack('<I', b[4:8])[0]
    if magic == b'CWS':
        data = b[:8] + zlib.decompress(b[8:])
    elif magic == b'ZWS':
        data = b[:8] + zlib.decompress(b[12:])
    else:
        data = b
    print(f"magic={magic} version={version} declared_len={flen} decompressed_len={len(data)}")
    off = 8
    off = read_rect(data, off)
    frame_rate = struct.unpack('<H', data[off:off+2])[0]/256.0
    frame_count = struct.unpack('<H', data[off+2:off+4])[0]
    off += 4
    print(f"frame_rate={frame_rate} frame_count={frame_count} tag_start={off}")
    counts = {}
    out = []
    while off + 2 <= len(data):
        code_len = struct.unpack('<H', data[off:off+2])[0]
        code = code_len >> 6
        length = code_len & 0x3F
        hdr = 2
        if length == 0x3F:
            length = struct.unpack('<I', data[off+2:off+6])[0]
            hdr = 6
        body = data[off+hdr:off+hdr+length]
        name = TAG_NAMES.get(code, f"Tag{code}")
        counts[name] = counts.get(name, 0) + 1
        extra = ""
        if code in (2, 22, 32, 83):
            try:
                sid = struct.unpack('<H', body[:2])[0]
                extra = f" id={sid}"
            except Exception: pass
        if code == 76:  # SymbolClass
            try:
                n = struct.unpack('<H', body[:2])[0]
                extra = f" symbols={n}"
            except Exception: pass
        if code == 82:  # DoABC
            try:
                flags = struct.unpack('<I', body[:4])[0]
                name_bytes = body[4:]
                nul = name_bytes.find(b'\x00')
                abcname = name_bytes[:nul].decode('utf-8', 'replace') if nul >= 0 else '?'
                extra = f" flags={flags:#x} abcname={abcname!r} abc_len={length-(4+nul+1)}"
            except Exception as e:
                extra = f" err={e}"
        if code == 39:  # DefineSprite
            try:
                sid = struct.unpack('<H', body[:2])[0]
                nframes = struct.unpack('<H', body[2:4])[0]
                extra = f" id={sid} frames={nframes}"
            except Exception: pass
        if code == 87:  # DefineBinaryData
            try:
                sid = struct.unpack('<H', body[:2])[0]
                extra = f" id={sid} data_len={length-6}"
            except Exception: pass
        if code in (14,):  # DefineSound
            try:
                sid, fmt = struct.unpack('<HB', body[:3])
                extra = f" id={sid} fmt={fmt>>4} rate={fmt&3} size={(fmt>>1)&1} type={fmt&1}"
            except Exception: pass
        if code in (20, 36):  # lossless
            try:
                sid, fmt, w, h = struct.unpack('<HBHH', body[:7])
                extra = f" id={sid} fmt={fmt} {w}x{h}"
            except Exception: pass
        if code in (21, 35, 90):
            try:
                sid = struct.unpack('<H', body[:2])[0]
                extra = f" id={sid} jpeg_len={length-2}"
            except Exception: pass
        if code in (10, 48, 75):
            try:
                sid = struct.unpack('<H', body[:2])[0]
                extra = f" id={sid}"
            except Exception: pass
        if code == 24:
            extra = " PROTECTED"
        if code == 77:
            extra = " " + body[:200].decode('utf-8','replace')
        out.append(f"{off:7d}  {name:24s} len={length:7d}{extra}")
        off += hdr + length
        if code == 0:
            break
    print("\n".join(out))
    print("\nTag counts:")
    for k, v in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {k:24s} {v}")

if __name__ == '__main__':
    dump(sys.argv[1])
