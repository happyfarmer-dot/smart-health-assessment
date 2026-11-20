'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import { BodyRegionId } from '@/types/cdss';
import {
  REGION_INDEX_ORDER,
  REGION_TO_SHADER_INDEX,
  classifyBodyPointToRegion,
  getCanonicalRegionWorldCenter,
  GLSL_REGION_CLASSIFIER_CHUNK,
} from '@/lib/bodyRegionSurfaceMap';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';

export type ModelGenderVariant = 'male' | 'female';

export interface ModelBoundsInfo {
  centerY: number;
  height: number;
  width: number;
}

export interface ModelStatusInfo {
  isLoading: boolean;
  progressPct: number;
  usingFallback: boolean;
  resolvedVariant?: 'male' | 'female' | 'default' | 'male_morphed' | 'fallback';
}

interface AnatomicalHumanModel3DProps {
  debugHitbox?: boolean;
  showRegionBoundaries?: boolean;
  showOrganXray?: boolean;
  modelGender?: ModelGenderVariant;
  hideHtmlLabels?: boolean;
  yOffset?: number;
  scaleMultiplier?: number;
  onModelStatusChange?: (status: ModelStatusInfo) => void;
  onBoundsComputed?: (bounds: ModelBoundsInfo) => void;
}

const MODEL_TARGET_HEIGHT = 4.52;
const MODEL_BOTTOM_Y = -1.75;

const MODEL_CANDIDATES: Record<
  ModelGenderVariant,
  Array<{
    url: string;
    variant: 'male' | 'female' | 'default' | 'male_morphed';
    morphToMale?: boolean;
  }>
> = {
  male: [
    { url: '/models/human_body_male.glb', variant: 'male', morphToMale: false },
    { url: '/models/human_body.glb', variant: 'male_morphed', morphToMale: true },
  ],
  female: [
    { url: '/models/human_body_female.glb', variant: 'female', morphToMale: false },
    { url: '/models/human_body.glb', variant: 'default', morphToMale: false },
  ],
};

// 全域快取：依性別與形態變體快取已正規化的模型場景
const cachedGlbByGender = new Map<
  ModelGenderVariant,
  {
    group: THREE.Group | null;
    found: boolean;
    resolvedVariant: 'male' | 'female' | 'default' | 'male_morphed' | 'fallback';
  }
>();

function getDracoDecoderBasePath(): string {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/smart-health-assessment')) {
      return '/smart-health-assessment/draco/';
    }
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}/draco/`;
}

function getModelFullUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (
      pathname.startsWith('/smart-health-assessment') &&
      !path.startsWith('/smart-health-assessment')
    ) {
      return `/smart-health-assessment${path}`;
    }
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}${path}`;
}

/**
 * 醫療質感半透明 Fresnel 青藍色邊緣輪廓光着色器
 */
function createFresnelRimShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: new THREE.Color('#38bdf8') },
      uCoreColor: { value: new THREE.Color('#0284c7') },
      uIntensity: { value: 0.72 },
      uPower: { value: 2.35 },
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      uniform vec3 uCoreColor;
      uniform float uIntensity;
      uniform float uPower;

      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0), uPower);
        vec3 col = mix(uCoreColor, uRimColor, fresnel);
        gl_FragColor = vec4(col, fresnel * uIntensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/**
 * 表面貼合 32 解剖分區著色器 (Per-Fragment Surface-Conforming Shader)
 * - 100% 貼合人體皮膚網格（僅沿法線外推 0.0024 避免 Z-fighting）
 * - 逐像素依正規化座標 (nx, ny, nz) 與表面法線 normal.z 判定所屬分區
 * - 繪製清晰交界邊線、五大主題配色、Hover 發光與已選中部位脈動警示色
 */
function createSurfaceRegionOverlayMaterial(): THREE.ShaderMaterial {
  const emptyMask = new Array<number>(32).fill(0);
  return new THREE.ShaderMaterial({
    uniforms: {
      uInvRootMatrix: { value: new THREE.Matrix4() },
      uTime: { value: 0 },
      uShowRegions: { value: 1.0 },
      uShowXray: { value: 0.0 },
      uHoveredIdx: { value: -1.0 },
      uActiveIdx: { value: -1.0 },
      uSelectedMask: { value: emptyMask },
    },
    vertexShader: `
      uniform mat4 uInvRootMatrix;

      varying vec3 vNormCoord;
      varying float vCanonNrmZ;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      void main() {
        vec3 pushedPos = position + normal * 0.0024;
        vec4 worldPos = modelMatrix * vec4(pushedPos, 1.0);
        vec3 canonPos = (uInvRootMatrix * worldPos).xyz;

        vNormCoord = vec3(
          canonPos.x / 4.52,
          (canonPos.y + 1.75) / 4.52,
          canonPos.z / 4.52
        );

        vec3 worldNrm = normalize(mat3(modelMatrix) * normal);
        vWorldNormal = worldNrm;
        vCanonNrmZ = normalize(mat3(uInvRootMatrix) * worldNrm).z;
        vViewDir = normalize(cameraPosition - worldPos.xyz);

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uShowRegions;
      uniform float uShowXray;
      uniform float uHoveredIdx;
      uniform float uActiveIdx;
      uniform float uSelectedMask[32];

      varying vec3 vNormCoord;
      varying float vCanonNrmZ;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      ${GLSL_REGION_CLASSIFIER_CHUNK}

      vec3 getThemeColor(int themeId) {
        if (themeId == 0) return vec3(0.024, 0.714, 0.831); // Cyan (#06b6d4) 頭頸五官
        if (themeId == 1) return vec3(0.231, 0.510, 0.965); // Blue (#3b82f6) 胸部上背
        if (themeId == 2) return vec3(0.961, 0.620, 0.043); // Amber (#f59e0b) 腹部五區
        if (themeId == 3) return vec3(0.957, 0.247, 0.369); // Rose (#f43f5e) 下背骨盆臀會陰
        return vec3(0.063, 0.725, 0.506);                   // Emerald (#10b981) 四肢關節
      }

      void main() {
        int regionId = 0;
        int themeId = 0;
        float borderDist = 1.0;

        classifyBodySurface(vNormCoord, vCanonNrmZ, regionId, themeId, borderDist);

        bool isHovered = (uHoveredIdx >= -0.5) && (regionId == int(floor(uHoveredIdx + 0.5)));
        bool isActive = (uActiveIdx >= -0.5) && (regionId == int(floor(uActiveIdx + 0.5)));

        float selVal = 0.0;
        for (int i = 0; i < 32; i++) {
          if (i == regionId) {
            selVal = uSelectedMask[i];
          }
        }
        bool isSelected = selVal > 0.5;

        if (uShowRegions < 0.5 && !isHovered && !isActive && !isSelected) {
          discard;
        }

        vec3 themeCol = getThemeColor(themeId);
        float fresnel = pow(
          1.0 - max(dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0),
          2.0
        );

        // 邊界細線厚度（頭頸五官更精細，軀幹四肢保持清晰分界）
        float borderWidth = (vNormCoord.y > 0.825) ? 0.0023 : 0.0038;
        float borderMask = 1.0 - smoothstep(borderWidth * 0.4, borderWidth, borderDist);

        vec3 baseFill = themeCol;
        vec3 borderCol = mix(themeCol, vec3(0.95, 0.98, 1.0), 0.58);
        float fillAlpha = (uShowRegions > 0.5)
          ? ((uShowXray > 0.5) ? 0.14 : 0.24)
          : 0.0;
        float borderAlpha = (uShowRegions > 0.5)
          ? ((uShowXray > 0.5) ? 0.45 : 0.78)
          : 0.0;

        if (isSelected) {
          float pulse = 0.5 + 0.5 * sin(uTime * 3.8);
          vec3 warnRed = vec3(0.96, 0.19, 0.34);
          vec3 warnGlow = vec3(1.0, 0.58, 0.32);
          baseFill = mix(warnRed, warnGlow, 0.25 * pulse + 0.35 * fresnel);
          borderCol = vec3(1.0, 0.82, 0.86);
          fillAlpha = 0.48 + 0.14 * pulse;
          borderAlpha = 0.96;
        }

        if (isHovered || isActive) {
          vec3 hiCol = mix(themeCol, vec3(0.88, 0.98, 1.0), 0.38);
          baseFill = mix(hiCol, vec3(1.0), 0.45 * fresnel);
          borderCol = vec3(1.0, 1.0, 1.0);
          fillAlpha = max(fillAlpha, 0.48) + 0.16 * fresnel;
          borderAlpha = 0.98;
        }

        vec3 finalCol = mix(baseFill, borderCol, borderMask);
        float finalAlpha = max(fillAlpha, borderMask * borderAlpha);

        if (finalAlpha < 0.01) {
          discard;
        }

        gl_FragColor = vec4(finalCol, clamp(finalAlpha, 0.0, 0.94));
      }
    `,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.FrontSide,
  });
}

/**
 * 程式化男性體態變形（Morph Female/Neutral Base GLB -> Male Proportions）
 * - 拓寬肩寬與上胸廓 (+14.5%)
 * - 平緩前胸乳房凸起
 * - 微調腰部曲線 (+7%)，減弱沙漏腰收窄
 * - 收窄骨盆與髖寬 (-9.5%) 並微收後臀凸起
 */
function morphSceneToMaleProportions(scene: THREE.Object3D): void {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if (size.y <= 0.0001) return;

  const worldPos = new THREE.Vector3();
  const invWorld = new THREE.Matrix4();

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const clonedGeo = mesh.geometry.clone();
      const posAttr = clonedGeo.getAttribute('position');
      if (!posAttr) return;

      mesh.updateWorldMatrix(true, false);
      invWorld.copy(mesh.matrixWorld).invert();

      for (let i = 0; i < posAttr.count; i++) {
        worldPos.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);

        const ny = (worldPos.y - box.min.y) / size.y;
        const dx = worldPos.x - center.x;
        const dz = worldPos.z - center.z;
        const nx = dx / size.y;

        // 1. 寬肩與上胸擴張
        const wShoulder = Math.exp(-Math.pow((ny - 0.785) / 0.065, 2));
        // 2. 腰部微寬（減弱女性腰線內凹）
        const wWaist = Math.exp(-Math.pow((ny - 0.62) / 0.055, 2));
        // 3. 骨盆與髖部收窄
        const wHip = Math.exp(-Math.pow((ny - 0.50) / 0.065, 2));

        const xScale = 1.0 + 0.145 * wShoulder + 0.07 * wWaist - 0.095 * wHip;
        worldPos.x = center.x + dx * xScale;

        // 4. 平緩前胸乳房突出 (ny ~ 0.735, 雙側胸峰與中線過渡)
        if (dz > 0) {
          const wBreastY = Math.exp(-Math.pow((ny - 0.735) / 0.028, 2));
          const wBreastX =
            Math.exp(-Math.pow((Math.abs(nx) - 0.036) / 0.034, 2)) +
            0.45 * Math.exp(-Math.pow(nx / 0.035, 2));
          const depthMask = Math.min(1.0, dz / (0.045 * size.y));
          worldPos.z -=
            size.y * 0.023 * wBreastY * Math.min(1.0, wBreastX) * depthMask;
        }

        // 5. 微調後臀翹度
        if (dz < 0) {
          const wGluteY = Math.exp(-Math.pow((ny - 0.49) / 0.045, 2));
          const wGluteX = Math.exp(-Math.pow(nx / 0.085, 2));
          const backMask = Math.min(1.0, -dz / (0.04 * size.y));
          worldPos.z += size.y * 0.015 * wGluteY * wGluteX * backMask;
        }

        worldPos.applyMatrix4(invWorld);
        posAttr.setXYZ(i, worldPos.x, worldPos.y, worldPos.z);
      }

      posAttr.needsUpdate = true;
      clonedGeo.computeVertexNormals();
      mesh.geometry = clonedGeo;
    }
  });
}

function applyXrayToGroup(group: THREE.Object3D, showOrganXray: boolean) {
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.userData?.isBaseSkin && mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.transparent = showOrganXray;
        mesh.material.opacity = showOrganXray ? 0.24 : 1.0;
        mesh.material.depthWrite = !showOrganXray;
        mesh.material.needsUpdate = true;
      }
      if (mesh.userData?.isRimShell && mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.uIntensity.value = showOrganXray ? 0.36 : 0.72;
      }
    }
  });
}

/**
 * 內臟與器官半透明 X 光參考層 (Organ & Viscera Translucent Reference Layer)
 */
function TranslucentOrgansReferenceLayer({ visible }: { visible: boolean }) {
  const pulseRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!visible || !pulseRef.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 4.2) * 0.045;
    pulseRef.current.scale.set(s, s, s);
  });

  if (!visible) return null;

  return (
    <group>
      {/* 腦部與視神經參考 */}
      <mesh position={[0, 2.52, -0.02]} raycast={() => {}}>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.4}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* 氣管與甲狀腺 */}
      <mesh position={[0, 2.02, 0.06]} raycast={() => {}}>
        <cylinderGeometry args={[0.04, 0.045, 0.26, 12]} />
        <meshStandardMaterial
          color="#22d3ee"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* 肺葉 (右肺 / 左肺) */}
      <mesh
        position={[-0.17, 1.46, 0.02]}
        scale={[0.85, 1.45, 0.75]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#1d4ed8"
          emissiveIntensity={0.35}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[0.17, 1.46, 0.02]}
        scale={[0.8, 1.42, 0.75]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.155, 16, 16]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#1d4ed8"
          emissiveIntensity={0.35}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* 心臟 (脈動亮點) */}
      <group ref={pulseRef} position={[0.07, 1.42, 0.1]}>
        <mesh scale={[0.9, 1.15, 0.85]} raycast={() => {}}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#e11d48"
            emissiveIntensity={0.85}
            transparent
            opacity={0.78}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 肝臟與膽囊 (右側 -X) */}
      <mesh
        position={[-0.16, 1.07, 0.08]}
        scale={[1.4, 0.75, 0.85]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color="#d97706"
          emissive="#b45309"
          emissiveIntensity={0.45}
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </mesh>

      {/* 胃部與胰臟 (中上與左上 +X) */}
      <mesh
        position={[0.12, 1.05, 0.08]}
        scale={[1.1, 0.85, 0.8]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={0.35}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* 脾臟 (左側遠端 +X) */}
      <mesh
        position={[0.25, 1.12, -0.02]}
        scale={[0.6, 0.9, 0.7]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial
          color="#a855f7"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* 左右腎臟 (偏後腹腔 -Z) */}
      <mesh
        position={[-0.14, 0.96, -0.08]}
        scale={[0.65, 1.15, 0.55]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial
          color="#ec4899"
          transparent
          opacity={0.58}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[0.14, 0.98, -0.08]}
        scale={[0.65, 1.15, 0.55]}
        raycast={() => {}}
      >
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial
          color="#ec4899"
          transparent
          opacity={0.58}
          depthWrite={false}
        />
      </mesh>

      {/* 闌尾參考 (右下腹 -X) */}
      <mesh
        position={[-0.19, 0.65, 0.1]}
        rotation={[0.3, 0, -0.5]}
        raycast={() => {}}
      >
        <capsuleGeometry args={[0.022, 0.09, 6, 8]} />
        <meshStandardMaterial
          color="#fb7185"
          emissive="#e11d48"
          emissiveIntensity={0.65}
          transparent
          opacity={0.78}
          depthWrite={false}
        />
      </mesh>

      {/* 膀胱 / 骨盆臟器 */}
      <mesh position={[0, 0.44, 0.09]} raycast={() => {}}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshStandardMaterial
          color="#fb923c"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * 第一層：人體皮膚基底與表面貼合 32 區著色層
 */
function AnatomicalBodyVisualBase({
  showOrganXray,
  modelGender,
  surfaceOverlayMat,
  onModelStatusChange,
  onBoundsComputed,
}: {
  showOrganXray: boolean;
  modelGender: ModelGenderVariant;
  surfaceOverlayMat: THREE.ShaderMaterial;
  onModelStatusChange?: (status: ModelStatusInfo) => void;
  onBoundsComputed?: (bounds: ModelBoundsInfo) => void;
}) {
  const [externalGlbGroup, setExternalGlbGroup] = useState<THREE.Group | null>(
    null
  );
  const [isLoadingGlb, setIsLoadingGlb] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);

  // 更新掛載於外部 GLB 的分區著色覆蓋層材質
  useEffect(() => {
    if (!externalGlbGroup) return;
    externalGlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.userData?.isRegionOverlay) {
        (child as THREE.Mesh).material = surfaceOverlayMat;
      }
    });
  }, [externalGlbGroup, surfaceOverlayMat]);

  useEffect(() => {
    let isMounted = true;
    const cached = cachedGlbByGender.get(modelGender);

    if (cached) {
      setExternalGlbGroup(cached.group);
      if (cached.group) {
        applyXrayToGroup(cached.group, showOrganXray);
      }
      onModelStatusChange?.({
        isLoading: false,
        progressPct: 100,
        usingFallback: !cached.found,
        resolvedVariant: cached.resolvedVariant,
      });
      if (cached.group && onBoundsComputed) {
        const box = new THREE.Box3().setFromObject(cached.group);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        onBoundsComputed({
          centerY: center.y,
          height: size.y,
          width: size.x,
        });
      }
      return;
    }

    const candidates = MODEL_CANDIDATES[modelGender];
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(getDracoDecoderBasePath());
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    async function tryLoadCandidate(index: number) {
      if (index >= candidates.length) {
        cachedGlbByGender.set(modelGender, {
          group: null,
          found: false,
          resolvedVariant: 'fallback',
        });
        if (isMounted) {
          setExternalGlbGroup(null);
          setIsLoadingGlb(false);
          onModelStatusChange?.({
            isLoading: false,
            progressPct: 100,
            usingFallback: true,
            resolvedVariant: 'fallback',
          });
        }
        dracoLoader.dispose();
        return;
      }

      const candidate = candidates[index];
      const fullUrl = getModelFullUrl(candidate.url);

      try {
        const res = await fetch(fullUrl, { method: 'HEAD' });
        if (!res.ok) {
          tryLoadCandidate(index + 1);
          return;
        }
      } catch {
        // Ignore HEAD restriction and try GET via GLTFLoader
      }

      if (isMounted) {
        setIsLoadingGlb(true);
        onModelStatusChange?.({
          isLoading: true,
          progressPct: 8,
          usingFallback: false,
        });
      }

      loader.load(
        fullUrl,
        (gltf) => {
          const rawScene = gltf.scene.clone(true);

          if (candidate.morphToMale) {
            morphSceneToMaleProportions(rawScene);
          }

          const box = new THREE.Box3().setFromObject(rawScene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const uniformScale =
            size.y > 0.001 ? MODEL_TARGET_HEIGHT / size.y : 1;

          const baseSkinMat = new THREE.MeshStandardMaterial({
            color: '#9db4cc',
            roughness: 0.54,
            metalness: 0.14,
            emissive: '#0c1f35',
            emissiveIntensity: 0.2,
            transparent: showOrganXray,
            opacity: showOrganXray ? 0.24 : 1.0,
            depthWrite: !showOrganXray,
          });

          const baseMeshes: THREE.Mesh[] = [];
          rawScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = baseSkinMat.clone();
              mesh.userData = { isBaseSkin: true };
              mesh.renderOrder = 1;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              baseMeshes.push(mesh);
            }
          });

          const fresnelShellMat = createFresnelRimShaderMaterial();
          for (const srcMesh of baseMeshes) {
            if (!srcMesh.parent) continue;

            // 1. Fresnel 外輪廓光殼（關閉 raycast 以免干擾點擊皮膚判定）
            const rimShell = new THREE.Mesh(srcMesh.geometry, fresnelShellMat);
            rimShell.position.copy(srcMesh.position);
            rimShell.quaternion.copy(srcMesh.quaternion);
            rimShell.scale.copy(srcMesh.scale).multiplyScalar(1.006);
            rimShell.userData = { isRimShell: true };
            rimShell.renderOrder = 2;
            rimShell.raycast = () => {};
            srcMesh.parent.add(rimShell);

            // 2. 表面貼合 32 區著色覆蓋層（關閉 raycast，直接由基底皮膚接手精確撞擊點）
            const overlayMesh = new THREE.Mesh(
              srcMesh.geometry,
              surfaceOverlayMat
            );
            overlayMesh.position.copy(srcMesh.position);
            overlayMesh.quaternion.copy(srcMesh.quaternion);
            overlayMesh.scale.copy(srcMesh.scale);
            overlayMesh.userData = { isRegionOverlay: true };
            overlayMesh.renderOrder = 3;
            overlayMesh.raycast = () => {};
            srcMesh.parent.add(overlayMesh);
          }

          const normalizedContainer = new THREE.Group();
          rawScene.scale.setScalar(uniformScale);
          rawScene.position.set(
            -center.x * uniformScale,
            MODEL_BOTTOM_Y - box.min.y * uniformScale,
            -center.z * uniformScale
          );
          normalizedContainer.add(rawScene);

          cachedGlbByGender.set(modelGender, {
            group: normalizedContainer,
            found: true,
            resolvedVariant: candidate.variant,
          });
          applyXrayToGroup(normalizedContainer, showOrganXray);

          if (isMounted) {
            setExternalGlbGroup(normalizedContainer);
            setIsLoadingGlb(false);
            setLoadingPct(100);
            onModelStatusChange?.({
              isLoading: false,
              progressPct: 100,
              usingFallback: false,
              resolvedVariant: candidate.variant,
            });
            const normBox = new THREE.Box3().setFromObject(normalizedContainer);
            const normSize = normBox.getSize(new THREE.Vector3());
            const normCenter = normBox.getCenter(new THREE.Vector3());
            onBoundsComputed?.({
              centerY: normCenter.y,
              height: normSize.y,
              width: normSize.x,
            });
          }
          dracoLoader.dispose();
        },
        (progressEvent) => {
          if (!isMounted) return;
          if (progressEvent.total > 0) {
            const pct = Math.min(
              99,
              Math.round((progressEvent.loaded / progressEvent.total) * 100)
            );
            setLoadingPct(pct);
            onModelStatusChange?.({
              isLoading: true,
              progressPct: pct,
              usingFallback: false,
            });
          }
        },
        () => {
          tryLoadCandidate(index + 1);
        }
      );
    }

    tryLoadCandidate(0);

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelGender]);

  useEffect(() => {
    if (externalGlbGroup) {
      applyXrayToGroup(externalGlbGroup, showOrganXray);
    }
  }, [externalGlbGroup, showOrganXray]);

  // 內建平滑備援幾何 (萬一離線或模型載入失敗時備援使用)
  const torsoHeadLatheGeo = useMemo(() => {
    const rawProfile: [number, number][] = [
      [0.01, 0.12],
      [0.26, 0.18],
      [0.37, 0.34],
      [0.34, 0.54],
      [0.285, 0.78],
      [0.33, 1.05],
      [0.39, 1.36],
      [0.43, 1.58],
      [0.45, 1.74],
      [0.23, 1.88],
      [0.145, 1.96],
      [0.135, 2.08],
      [0.14, 2.18],
      [0.18, 2.26],
      [0.215, 2.38],
      [0.225, 2.52],
      [0.205, 2.66],
      [0.12, 2.75],
      [0.005, 2.77],
    ];
    const points = rawProfile.map(
      ([r, y]) => new THREE.Vector2(modelGender === 'male' ? r * 1.04 : r, y)
    );
    const curve = new THREE.SplineCurve(points);
    const geo = new THREE.LatheGeometry(curve.getPoints(64), 48);
    geo.scale(1.06, 1.0, 0.68);
    geo.computeVertexNormals();
    return geo;
  }, [modelGender]);

  const legLatheGeo = useMemo(() => {
    const rawProfile: [number, number][] = [
      [0.02, -1.75],
      [0.11, -1.73],
      [0.095, -1.66],
      [0.078, -1.52],
      [0.125, -1.16],
      [0.115, -0.92],
      [0.145, -0.58],
      [0.195, -0.15],
      [0.215, 0.22],
      [0.05, 0.36],
    ];
    const points = rawProfile.map(([r, y]) => new THREE.Vector2(r, y));
    const curve = new THREE.SplineCurve(points);
    const geo = new THREE.LatheGeometry(curve.getPoints(48), 32);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const armLatheGeo = useMemo(() => {
    const rawProfile: [number, number][] = [
      [0.02, -0.14],
      [0.075, -0.06],
      [0.062, 0.14],
      [0.095, 0.46],
      [0.112, 0.72],
      [0.122, 0.96],
      [0.145, 1.24],
      [0.135, 1.38],
      [0.04, 1.44],
    ];
    const points = rawProfile.map(([r, y]) => new THREE.Vector2(r, y));
    const curve = new THREE.SplineCurve(points);
    const geo = new THREE.LatheGeometry(curve.getPoints(40), 28);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const matteAnatomicalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9db4cc',
        roughness: 0.56,
        metalness: 0.12,
        emissive: '#0c1f35',
        emissiveIntensity: 0.2,
        transparent: showOrganXray,
        opacity: showOrganXray ? 0.24 : 1.0,
        depthWrite: !showOrganXray,
      }),
    [showOrganXray]
  );

  const fresnelMaterial = useMemo(() => createFresnelRimShaderMaterial(), []);

  return (
    <group>
      {isLoadingGlb && (
        <Html center position={[0, 1.1, 0]} zIndexRange={[10, 0]}>
          <div className="rounded-xl border border-cyan-500/40 bg-slate-950/90 px-4 py-2.5 text-center shadow-2xl backdrop-blur-md min-w-[200px]">
            <div className="text-xs font-bold text-cyan-300">
              正在解碼 3D 解剖模型 (DRACO)... {loadingPct}%
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-200"
                style={{ width: `${Math.max(12, loadingPct)}%` }}
              />
            </div>
          </div>
        </Html>
      )}

      {externalGlbGroup ? (
        <primitive object={externalGlbGroup} />
      ) : (
        <group>
          <mesh
            geometry={torsoHeadLatheGeo}
            material={matteAnatomicalMaterial}
            renderOrder={1}
          />
          <mesh
            geometry={torsoHeadLatheGeo}
            material={fresnelMaterial}
            scale={[1.006, 1.006, 1.006]}
            renderOrder={2}
            raycast={() => {}}
          />
          <mesh
            geometry={torsoHeadLatheGeo}
            material={surfaceOverlayMat}
            renderOrder={3}
            raycast={() => {}}
          />

          <group position={[-0.22, 0, 0]} rotation={[0, 0, -0.025]}>
            <mesh
              geometry={legLatheGeo}
              material={matteAnatomicalMaterial}
              renderOrder={1}
            />
            <mesh
              geometry={legLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
              renderOrder={2}
              raycast={() => {}}
            />
            <mesh
              geometry={legLatheGeo}
              material={surfaceOverlayMat}
              renderOrder={3}
              raycast={() => {}}
            />
          </group>
          <group position={[0.22, 0, 0]} rotation={[0, 0, 0.025]}>
            <mesh
              geometry={legLatheGeo}
              material={matteAnatomicalMaterial}
              renderOrder={1}
            />
            <mesh
              geometry={legLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
              renderOrder={2}
              raycast={() => {}}
            />
            <mesh
              geometry={legLatheGeo}
              material={surfaceOverlayMat}
              renderOrder={3}
              raycast={() => {}}
            />
          </group>

          <group position={[-0.86, 0.34, 0.02]} rotation={[0, 0, -0.24]}>
            <mesh
              geometry={armLatheGeo}
              material={matteAnatomicalMaterial}
              renderOrder={1}
            />
            <mesh
              geometry={armLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
              renderOrder={2}
              raycast={() => {}}
            />
            <mesh
              geometry={armLatheGeo}
              material={surfaceOverlayMat}
              renderOrder={3}
              raycast={() => {}}
            />
          </group>
          <group position={[0.86, 0.34, 0.02]} rotation={[0, 0, 0.24]}>
            <mesh
              geometry={armLatheGeo}
              material={matteAnatomicalMaterial}
              renderOrder={1}
            />
            <mesh
              geometry={armLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
              renderOrder={2}
              raycast={() => {}}
            />
            <mesh
              geometry={armLatheGeo}
              material={surfaceOverlayMat}
              renderOrder={3}
              raycast={() => {}}
            />
          </group>
        </group>
      )}
    </group>
  );
}

export function AnatomicalHumanModel3D({
  showRegionBoundaries = true,
  showOrganXray = false,
  modelGender = 'female',
  hideHtmlLabels = false,
  yOffset = 0,
  scaleMultiplier = 1,
  onModelStatusChange,
  onBoundsComputed,
}: AnatomicalHumanModel3DProps) {
  const {
    selectedRegions,
    activeRegionId,
    hoveredRegionId,
    setActiveRegion,
    setHoveredRegion,
  } = useDiagnosisStore();

  const rootGroupRef = useRef<THREE.Group>(null);
  const invRootMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempLocalPos = useMemo(() => new THREE.Vector3(), []);
  const tempWorldNrm = useMemo(() => new THREE.Vector3(), []);
  const tempNormalMat = useMemo(() => new THREE.Matrix3(), []);

  const surfaceOverlayMat = useMemo(
    () => createSurfaceRegionOverlayMaterial(),
    []
  );

  // 清理 ShaderMaterial
  useEffect(() => {
    return () => {
      surfaceOverlayMat.dispose();
    };
  }, [surfaceOverlayMat]);

  // 同步 Uniforms 狀態
  useEffect(() => {
    surfaceOverlayMat.uniforms.uShowRegions.value = showRegionBoundaries
      ? 1.0
      : 0.0;
    surfaceOverlayMat.uniforms.uShowXray.value = showOrganXray ? 1.0 : 0.0;
    surfaceOverlayMat.uniforms.uHoveredIdx.value =
      hoveredRegionId !== null
        ? REGION_TO_SHADER_INDEX[hoveredRegionId] ?? -1.0
        : -1.0;
    surfaceOverlayMat.uniforms.uActiveIdx.value =
      activeRegionId !== null
        ? REGION_TO_SHADER_INDEX[activeRegionId] ?? -1.0
        : -1.0;

    const mask = new Array<number>(32).fill(0);
    for (let i = 0; i < REGION_INDEX_ORDER.length; i++) {
      const id = REGION_INDEX_ORDER[i];
      if (selectedRegions[id]) {
        mask[i] = 1.0;
      }
    }
    surfaceOverlayMat.uniforms.uSelectedMask.value = mask;
  }, [
    surfaceOverlayMat,
    showRegionBoundaries,
    showOrganXray,
    hoveredRegionId,
    activeRegionId,
    selectedRegions,
  ]);

  // 每幀更新模型逆矩陣與閃爍時間
  useFrame(({ clock }) => {
    if (rootGroupRef.current) {
      rootGroupRef.current.updateWorldMatrix(true, false);
      invRootMatrix.copy(rootGroupRef.current.matrixWorld).invert();
      surfaceOverlayMat.uniforms.uInvRootMatrix.value.copy(invRootMatrix);
    }
    surfaceOverlayMat.uniforms.uTime.value = clock.getElapsedTime();
  });

  // 將 Raycast 撞擊點轉回正規化身體座標並呼叫完全一致的分區分類器
  const resolveEventRegionId = (
    e: ThreeEvent<PointerEvent | MouseEvent>
  ): BodyRegionId | null => {
    if (!rootGroupRef.current || !e.face) return null;

    rootGroupRef.current.updateWorldMatrix(true, false);
    invRootMatrix.copy(rootGroupRef.current.matrixWorld).invert();

    // 世界撞擊點 -> rootGroupRef 本地座標
    tempLocalPos.copy(e.point).applyMatrix4(invRootMatrix);
    const nx = tempLocalPos.x / MODEL_TARGET_HEIGHT;
    const ny = (tempLocalPos.y - MODEL_BOTTOM_Y) / MODEL_TARGET_HEIGHT;
    const nz = tempLocalPos.z / MODEL_TARGET_HEIGHT;

    // 撞擊面法線（物件本地 -> 世界 -> rootGroupRef 本地）
    tempNormalMat.getNormalMatrix(e.object.matrixWorld);
    tempWorldNrm.copy(e.face.normal).applyMatrix3(tempNormalMat).normalize();
    tempNormalMat.getNormalMatrix(invRootMatrix);
    tempWorldNrm.applyMatrix3(tempNormalMat).normalize();

    return classifyBodyPointToRegion(nx, ny, nz, tempWorldNrm.z);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const regionId = resolveEventRegionId(e);
    if (regionId) {
      if (hoveredRegionId !== regionId) {
        setHoveredRegion(regionId);
      }
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredRegion(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const regionId = resolveEventRegionId(e);
    if (regionId) {
      setActiveRegion(regionId);
    }
  };

  // Hover 時顯示浮動小標籤，若有已開啟彈窗則隱藏以免穿透遮擋
  const labelRegionId: BodyRegionId | null =
    hoveredRegionId || activeRegionId || null;
  const labelRegion = labelRegionId ? BODY_REGION_MAP[labelRegionId] : null;
  const rawLabelPos = labelRegionId
    ? getCanonicalRegionWorldCenter(labelRegionId)
    : ([0, 0, 0] as [number, number, number]);
  const labelPosition: [number, number, number] = [
    rawLabelPos[0],
    rawLabelPos[1] + 0.48,
    rawLabelPos[2],
  ];

  return (
    <group
      ref={rootGroupRef}
      position={[0, -0.48 + yOffset, 0]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <AnatomicalBodyVisualBase
        showOrganXray={showOrganXray}
        modelGender={modelGender}
        surfaceOverlayMat={surfaceOverlayMat}
        onModelStatusChange={onModelStatusChange}
        onBoundsComputed={onBoundsComputed}
      />

      <TranslucentOrgansReferenceLayer visible={showOrganXray} />

      {!hideHtmlLabels && labelRegion && (
        <Html
          position={labelPosition}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded-lg border border-cyan-400/70 bg-slate-950/92 px-2.5 py-1 text-[11px] font-bold text-white shadow-xl backdrop-blur-md flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>{labelRegion.nameZh}</span>
            {selectedRegions[labelRegion.id] && (
              <span className="rounded bg-rose-600 px-1 py-0.5 text-[9px] text-white">
                {selectedRegions[labelRegion.id].qualityIds.length +
                  selectedRegions[labelRegion.id].specificSymptomIds.length}
                項
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
