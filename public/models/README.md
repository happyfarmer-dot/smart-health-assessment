# 3D Human Body Model (`/public/models/human_body.glb`)

## Bundled model
The bundled `human_body.glb` is generated from the **MakeHuman hm08 base mesh**
(`makehuman/data/3dobjs/base.obj`, https://github.com/makehumancommunity/makehuman),
released under **CC0 1.0** by Data Collection AB, Joel Palmius and Jonas Hauquier.

Rebuild it with:
```bash
curl -L -o /tmp/base.obj https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/3dobjs/base.obj
python3 scripts/build-human-glb.py /tmp/base.obj public/models/human_body.glb
```
Only the `body` group is kept (helper/joint proxy geometry is removed). The 32 hitbox
coordinates in `AnatomicalHumanModel3D.tsx` (`HITBOX_COORDS_BUNDLED_GLB`) are calibrated
to this mesh.

## Using your own model
Replace `public/models/human_body.glb` with any standard or Draco-compressed `.glb`.
1. **DRACOLoader**: decodes Draco meshes via `https://www.gstatic.com/draco/versioned/decoders/1.5.7/`.
2. **Box3 auto-alignment**: any unit/origin is scaled to the standard height (feet y = -1.75, head y = +2.77).
3. **Fresnel rim glow + preserved textures**: `map` / `normalMap` are kept, wrapped in a `1.006x` Fresnel shell.
4. **Hitbox calibration**: append `?debug=hitbox` to the URL for wireframe hitboxes and Y-offset / scale sliders.
   Different poses (e.g. T-pose) may require adjusting `HITBOX_COORDS_BUNDLED_GLB`.
