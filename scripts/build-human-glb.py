#!/usr/bin/env python3
"""
Build public/models/human_body.glb from the MakeHuman hm08 base mesh (CC0 1.0).

Source: https://github.com/makehumancommunity/makehuman (makehuman/data/3dobjs/base.obj)
Only the `body` group is kept (helper / joint proxy geometry is discarded).
Quads are triangulated, smooth vertex normals are computed, and a minimal
glTF 2.0 binary is written with a neutral matte clinical skin material.

Usage: python3 scripts/build-human-glb.py <base.obj> <out.glb>
"""
import json
import math
import struct
import sys


def main(src: str, dst: str) -> None:
    verts = []
    faces = []
    group = None
    with open(src, encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("v "):
                _, x, y, z = line.split()[:4]
                verts.append((float(x), float(y), float(z)))
            elif line.startswith("g "):
                group = line.split(maxsplit=1)[1].strip()
            elif line.startswith("f ") and group == "body":
                idx = [int(p.split("/")[0]) - 1 for p in line.split()[1:]]
                for i in range(1, len(idx) - 1):
                    faces.append((idx[0], idx[i], idx[i + 1]))

    # Re-index only the vertices that are used by the body faces
    used = sorted({i for f in faces for i in f})
    remap = {old: new for new, old in enumerate(used)}
    pos = [verts[i] for i in used]
    tris = [(remap[a], remap[b], remap[c]) for a, b, c in faces]

    # Smooth normals (area weighted)
    nrm = [[0.0, 0.0, 0.0] for _ in pos]
    for a, b, c in tris:
        ax, ay, az = pos[a]
        bx, by, bz = pos[b]
        cx, cy, cz = pos[c]
        ux, uy, uz = bx - ax, by - ay, bz - az
        vx, vy, vz = cx - ax, cy - ay, cz - az
        nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
        for k in (a, b, c):
            nrm[k][0] += nx
            nrm[k][1] += ny
            nrm[k][2] += nz
    for n in nrm:
        l = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2) or 1.0
        n[0] /= l
        n[1] /= l
        n[2] /= l

    pos_bytes = b"".join(struct.pack("<3f", *p) for p in pos)
    nrm_bytes = b"".join(struct.pack("<3f", *n) for n in nrm)
    idx_bytes = b"".join(struct.pack("<3I", *t) for t in tris)
    bin_blob = pos_bytes + nrm_bytes + idx_bytes
    while len(bin_blob) % 4:
        bin_blob += b"\x00"

    mins = [min(p[i] for p in pos) for i in range(3)]
    maxs = [max(p[i] for p in pos) for i in range(3)]

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "build-human-glb.py",
            "copyright": "MakeHuman hm08 base mesh, CC0 1.0 (Data Collection AB, Joel Palmius, Jonas Hauquier)",
        },
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": "HumanBody", "mesh": 0}],
        "meshes": [
            {
                "name": "HumanBodySkin",
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1},
                        "indices": 2,
                        "material": 0,
                    }
                ],
            }
        ],
        "materials": [
            {
                "name": "ClinicalMatteSkin",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.55, 0.63, 0.72, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.85,
                },
            }
        ],
        "buffers": [{"byteLength": len(bin_blob)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(pos_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": len(pos_bytes), "byteLength": len(nrm_bytes), "target": 34962},
            {
                "buffer": 0,
                "byteOffset": len(pos_bytes) + len(nrm_bytes),
                "byteLength": len(idx_bytes),
                "target": 34963,
            },
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(pos), "type": "VEC3", "min": mins, "max": maxs},
            {"bufferView": 1, "componentType": 5126, "count": len(nrm), "type": "VEC3"},
            {"bufferView": 2, "componentType": 5125, "count": len(tris) * 3, "type": "SCALAR"},
        ],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "

    total = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    with open(dst, "wb") as out:
        out.write(struct.pack("<III", 0x46546C67, 2, total))
        out.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        out.write(json_bytes)
        out.write(struct.pack("<II", len(bin_blob), 0x004E4942))
        out.write(bin_blob)

    print(f"verts={len(pos)} tris={len(tris)} bbox min={mins} max={maxs} bytes={total}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
