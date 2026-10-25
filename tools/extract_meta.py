import struct, zlib, sys, os

path = sys.argv[1]
outdir = sys.argv[2]
os.makedirs(outdir, exist_ok=True)
b = open(path, 'rb').read()
data = b[:8] + zlib.decompress(b[8:])
off = 8
nbits = data[off] >> 3
off += (5 + 4*nbits + 7)//8 + 4

def read_tags(data, off, end):
    tags = []
    while off + 2 <= end:
        code_len = struct.unpack('<H', data[off:off+2])[0]
        code = code_len >> 6
        length = code_len & 0x3F
        hdr = 2
        if length == 0x3F:
            length = struct.unpack('<I', data[off+2:off+6])[0]
            hdr = 6
        body_start = off + hdr
        body = data[body_start:body_start+length]
        tags.append((off, code, body))
        off = body_start + length
        if code == 0:
            break
    return tags

tags = read_tags(data, off, len(data))
for _, code, body in tags:
    if code == 77:
        print("=== METADATA ===")
        print(body.decode('utf-8', 'replace'))
    if code == 76:
        n = struct.unpack('<H', body[:2])[0]
        p = 2
        print("\n=== SYMBOL CLASS (77 expected) ===")
        rows = []
        for i in range(n):
            sid = struct.unpack('<H', body[p:p+2])[0]; p += 2
            z = body.find(b'\x00', p)
            name = body[p:z].decode('utf-8', 'replace'); p = z + 1
            rows.append((sid, name))
        for sid, name in rows:
            print(f"{sid:5d}  {name}")
    if code == 82:
        flags = struct.unpack('<I', body[:4])[0]
        z = body.find(b'\x00', 4)
        abc = body[z+1:]
        open(os.path.join(outdir, 'main.abc'), 'wb').write(abc)
        print(f"\nABC extracted: {len(abc)} bytes, flags={flags:#x}")
    if code == 86:
        print("\n=== SCENE/FRAME LABELS ===", body.hex())
    if code == 39:
        sid, nf = struct.unpack('<H H', body[:4])
        inner = read_tags(body, 4, len(body))
        names = []
        for o, c, bb in inner:
            if c == 43:
                z = bb.find(b'\x00')
                names.append(bb[:z].decode('utf-8','replace'))
        if names:
            print(f"Sprite {sid} frame labels: {names}")
