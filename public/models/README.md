# 3D Anatomical Human Model Slot (`/public/models/human_body.glb`)

Place your high-detail adult anatomical `.glb` model (Standard or Draco-compressed) at:
`public/models/human_body.glb`

## Automatic Normalization & Features
1. **DRACOLoader**: Automatically decodes Draco-compressed `.glb` meshes via `https://www.gstatic.com/draco/versioned/decoders/1.5.7/`.
2. **Box3 Bounding Box Auto-Alignment**: Any `.glb` model (whether in cm, m, or arbitrary origin) is automatically scaled and centered to align with the 32 anatomical 3D hitboxes.
3. **Fresnel Rim Glow + Preserved Muscle/Skin Textures**: Original `map` and `normalMap` textures are preserved with a clinical matte finish, wrapped in a `1.006x` outer Fresnel rim-glow shader shell.
4. **Hitbox Calibration Mode**: Append `?debug=hitbox` to the URL to view colored wireframe hitboxes and live Y-offset / scale sliders.
