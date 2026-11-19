'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { BODY_REGIONS } from '@/data/bodyRegions';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BodyRegionDefinition, BodyRegionId } from '@/types/cdss';

/**
 * 全域輕量快取：避免在 2D 與 3D 模式間切換時重複下載 20MB 的 .glb 模型
 */
let cachedNormalizedGlbGroup: THREE.Group | null = null;
let cachedGlbAttemptFinished = false;
let cachedGlbFound = false;

/**
 * 醫療科技感 Fresnel 邊緣輪廓光 Shader (Rim Glow ShaderMaterial)
 * - 依據公式 pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0)
 * - 設為 transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
 * - 絕不覆蓋原模型肌肉與皮膚貼圖，而是包覆於 scale * 1.006 的透明外殼上
 */
function createFresnelRimShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: new THREE.Color('#38bdf8') },
      uRimPower: { value: 3.0 },
      uRimIntensity: { value: 0.68 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      uniform float uRimPower;
      uniform float uRimIntensity;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        float ndotv = max(dot(normalize(vViewDir), normalize(vNormalView)), 0.0);
        float fresnel = pow(1.0 - ndotv, uRimPower);
        vec3 col = mix(uRimColor, vec3(0.88, 0.96, 1.0), fresnel * 0.45);
        gl_FragColor = vec4(col * fresnel * uRimIntensity, fresnel * 0.72);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

export interface ModelCalibrationParams {
  debugHitbox: boolean;
  yOffset: number;
  scaleMultiplier: number;
  onModelStatusChange?: (status: {
    isLoading: boolean;
    progressPct: number;
    usingFallback: boolean;
  }) => void;
}

/**
 * 【第一層：單一完整視覺模型層 (Visual Mesh Layer)】
 * 1. 載入 `/public/models/human_body.glb`（自動相容 GitHub Pages `NEXT_PUBLIC_BASE_PATH` 與 `./models/human_body.glb`）
 * 2. 啟用 `DRACOLoader` 指向官方穩定 CDN `https://www.gstatic.com/draco/versioned/decoders/1.5.7/`
 * 3. 自動計算 `THREE.Box3` 邊界框，等比例縮放至標準解剖高度並對齊原點，確保與 32 個 3D 感應熱區座標完美吻合
 * 4. 保留原始 `.glb` 肌肉與皮膚 `map` / `normalMap` 貼圖（調整為低反光霧面質感），並克隆一層 `scale * 1.006` 的透明外殼套用 Fresnel 邊緣輪廓光 Shader
 * 5. 若尚未放入 `.glb` 或載入失敗，自動無縫降級至具備 Fresnel 輪廓光的平滑備援人體輪廓
 */
function UnifiedVisualBodyMeshLayer({
  yOffset,
  scaleMultiplier,
  onModelStatusChange,
}: {
  yOffset: number;
  scaleMultiplier: number;
  onModelStatusChange?: ModelCalibrationParams['onModelStatusChange'];
}) {
  const [externalGlbGroup, setExternalGlbGroup] = useState<THREE.Group | null>(
    cachedNormalizedGlbGroup
  );
  const [isLoadingGlb, setIsLoadingGlb] = useState<boolean>(
    !cachedGlbAttemptFinished
  );
  const [loadingPct, setLoadingPct] = useState<number>(0);

  const fresnelMaterial = useMemo(() => createFresnelRimShaderMaterial(), []);

  useEffect(() => {
    return () => {
      fresnelMaterial.dispose();
    };
  }, [fresnelMaterial]);

  useEffect(() => {
    let isMounted = true;

    if (cachedGlbAttemptFinished) {
      setExternalGlbGroup(cachedNormalizedGlbGroup);
      setIsLoadingGlb(false);
      onModelStatusChange?.({
        isLoading: false,
        progressPct: 100,
        usingFallback: !cachedGlbFound,
      });
      return;
    }

    const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(
      /\/$/,
      ''
    );
    const candidateUrls = Array.from(
      new Set([
        basePath ? `${basePath}/models/human_body.glb` : './models/human_body.glb',
        '/models/human_body.glb',
        './models/human_body.glb',
      ])
    );

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
    dracoLoader.setDecoderConfig({ type: 'js' });

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    async function tryLoadGlb() {
      setIsLoadingGlb(true);
      onModelStatusChange?.({
        isLoading: true,
        progressPct: 10,
        usingFallback: false,
      });

      let validUrl: string | null = null;
      for (const url of candidateUrls) {
        try {
          const headRes = await fetch(url, { method: 'HEAD' });
          const contentType = headRes.headers.get('content-type') || '';
          if (headRes.ok && !contentType.includes('text/html')) {
            validUrl = url;
            break;
          }
        } catch {
          // try next candidate
        }
      }

      if (!validUrl) {
        cachedGlbAttemptFinished = true;
        cachedGlbFound = false;
        if (isMounted) {
          setIsLoadingGlb(false);
          onModelStatusChange?.({
            isLoading: false,
            progressPct: 100,
            usingFallback: true,
          });
        }
        dracoLoader.dispose();
        return;
      }

      gltfLoader.load(
        validUrl,
        (gltf) => {
          if (!gltf?.scene) {
            cachedGlbAttemptFinished = true;
            cachedGlbFound = false;
            if (isMounted) {
              setIsLoadingGlb(false);
              onModelStatusChange?.({
                isLoading: false,
                progressPct: 100,
                usingFallback: true,
              });
            }
            dracoLoader.dispose();
            return;
          }

          const rawScene = gltf.scene;
          rawScene.updateMatrixWorld(true);

          // 規格 2：計算 THREE.Box3 邊界框並自動等比例正規化至標準身高（對齊 32 區感應熱區座標系：腳底 y = -1.75 至頭頂 y = +2.77，總高 4.52 單位）
          const box = new THREE.Box3().setFromObject(rawScene);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const TARGET_STANDARD_SPAN = 4.52;
          const TARGET_BOTTOM_Y = -1.75;
          const safeHeight = size.y > 0.0001 ? size.y : 1.0;
          const uniformScale = TARGET_STANDARD_SPAN / safeHeight;

          // 規格 3：保留原始肌肉與皮膚貼圖 (map, normalMap)，調整為低反光霧面質感，並克隆一層 scale * 1.006 的 Fresnel 邊緣輪廓光外殼
          const meshesToCloneForFresnel: THREE.Mesh[] = [];
          rawScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              const adjustMat = (mat: THREE.Material) => {
                const stdMat = mat as THREE.MeshStandardMaterial;
                if (stdMat && ('roughness' in stdMat || 'metalness' in stdMat)) {
                  // 保留原本的 map 與 normalMap，消除塑膠油光感
                  stdMat.roughness = Math.max(stdMat.roughness ?? 0.55, 0.58);
                  stdMat.metalness = Math.min(stdMat.metalness ?? 0.08, 0.12);
                  if (!stdMat.map) {
                    stdMat.color = new THREE.Color('#334155');
                  }
                  stdMat.needsUpdate = true;
                }
              };

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(adjustMat);
              } else if (mesh.material) {
                adjustMat(mesh.material);
              }

              meshesToCloneForFresnel.push(mesh);
            }
          });

          // 為每個皮膚/肌肉 Mesh 加上極微放大 (scale * 1.006) 的透明 Fresnel 輪廓光外殼
          const fresnelShellMat = createFresnelRimShaderMaterial();
          for (const srcMesh of meshesToCloneForFresnel) {
            if (!srcMesh.parent) continue;
            const rimShell = new THREE.Mesh(srcMesh.geometry, fresnelShellMat);
            rimShell.position.copy(srcMesh.position);
            rimShell.quaternion.copy(srcMesh.quaternion);
            rimShell.scale.copy(srcMesh.scale).multiplyScalar(1.006);
            rimShell.renderOrder = 2;
            srcMesh.parent.add(rimShell);
          }

          const normalizedContainer = new THREE.Group();
          rawScene.scale.setScalar(uniformScale);
          rawScene.position.set(
            -center.x * uniformScale,
            TARGET_BOTTOM_Y - box.min.y * uniformScale,
            -center.z * uniformScale
          );
          normalizedContainer.add(rawScene);

          cachedNormalizedGlbGroup = normalizedContainer;
          cachedGlbAttemptFinished = true;
          cachedGlbFound = true;

          if (isMounted) {
            setExternalGlbGroup(normalizedContainer);
            setIsLoadingGlb(false);
            setLoadingPct(100);
            onModelStatusChange?.({
              isLoading: false,
              progressPct: 100,
              usingFallback: false,
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
          cachedGlbAttemptFinished = true;
          cachedGlbFound = false;
          if (isMounted) {
            setIsLoadingGlb(false);
            onModelStatusChange?.({
              isLoading: false,
              progressPct: 100,
              usingFallback: true,
            });
          }
          dracoLoader.dispose();
        }
      );
    }

    tryLoadGlb();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 內建平滑備援視覺底層：頭顱 + 頸部 + 斜方肌肩膀 + 胸廓 + 腰身曲線 + 骨盆 (LatheGeometry)
  const torsoHeadLatheGeo = useMemo(() => {
    const rawProfile: [number, number][] = [
      [0.01, 0.12],  // 骨盆底閉合
      [0.26, 0.18],  // 骨盆下緣
      [0.37, 0.34],  // 髖骨最寬處
      [0.34, 0.54],  // 下腹骨盆上緣
      [0.285, 0.78], // 腰身自然內收曲線
      [0.33, 1.05],  // 下肋弓外展
      [0.39, 1.36],  // 胸廓中段
      [0.43, 1.58],  // 上胸與背闊肌最寬處
      [0.45, 1.74],  // 肩峰與鎖骨高度
      [0.23, 1.88],  // 斜方肌平滑收束至頸根
      [0.13, 1.98],  // 頸部中段
      [0.125, 2.13], // 上頸與下顎底
      [0.19, 2.24],  // 下巴與下頷骨弧度
      [0.23, 2.42],  // 顴骨與太陽穴
      [0.24, 2.56],  // 顱骨最寬處
      [0.17, 2.70],  // 頭頂圓弧
      [0.01, 2.77],  // 頭頂閉合
    ];
    const v2 = rawProfile.map(([r, y]) => new THREE.Vector2(r, y));
    const spline = new THREE.SplineCurve(v2);
    const geo = new THREE.LatheGeometry(spline.getPoints(68), 52);
    geo.scale(1.06, 1.0, 0.64);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 下肢平滑解剖曲面
  const legLatheGeo = useMemo(() => {
    const legProfile: [number, number][] = [
      [0.01, -1.75],
      [0.09, -1.70],
      [0.066, -1.52],
      [0.085, -1.28],
      [0.134, -0.96],
      [0.116, -0.74],
      [0.110, -0.58],
      [0.140, -0.35],
      [0.174, -0.05],
      [0.184, 0.18],
      [0.01, 0.26],
    ];
    const v2 = legProfile.map(([r, y]) => new THREE.Vector2(r, y));
    const spline = new THREE.SplineCurve(v2);
    const geo = new THREE.LatheGeometry(spline.getPoints(52), 40);
    geo.scale(1.0, 1.0, 0.94);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 上肢平滑解剖曲面
  const armLatheGeo = useMemo(() => {
    const armProfile: [number, number][] = [
      [0.01, 0.0],
      [0.068, 0.12],
      [0.052, 0.26],
      [0.085, 0.56],
      [0.075, 0.78],
      [0.104, 1.06],
      [0.130, 1.38],
      [0.01, 1.52],
    ];
    const v2 = armProfile.map(([r, y]) => new THREE.Vector2(r, y));
    const spline = new THREE.SplineCurve(v2);
    const geo = new THREE.LatheGeometry(spline.getPoints(48), 36);
    geo.scale(0.95, 1.0, 0.88);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 低反光霧面肌肉/皮膚基礎材質 (Matte Clinical Anatomical Base Material)
  const matteAnatomicalMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1e293b',
        emissive: '#0369a1',
        emissiveIntensity: 0.12,
        roughness: 0.62,
        metalness: 0.08,
        transmission: 0.22,
        thickness: 0.5,
        clearcoat: 0.18,
        clearcoatRoughness: 0.55,
        transparent: true,
        opacity: 0.86,
      }),
    []
  );

  // 元件卸載時釋放內建備援 Geometry 與 Material 記憶體
  useEffect(() => {
    return () => {
      torsoHeadLatheGeo.dispose();
      legLatheGeo.dispose();
      armLatheGeo.dispose();
      matteAnatomicalMaterial.dispose();
    };
  }, [torsoHeadLatheGeo, legLatheGeo, armLatheGeo, matteAnatomicalMaterial]);

  return (
    <group position={[0, yOffset, 0]} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
      {/* 載入進度條 (Suspense / Progress Overlay) */}
      {isLoadingGlb && (
        <Html center position={[0, 1.1, 0]}>
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
          {/* 1. 頭頸軀幹：霧面底層 + 1.006x Fresnel 邊緣輪廓光外殼 */}
          <mesh geometry={torsoHeadLatheGeo} material={matteAnatomicalMaterial} />
          <mesh
            geometry={torsoHeadLatheGeo}
            material={fresnelMaterial}
            scale={[1.006, 1.006, 1.006]}
          />

          {/* 2. 右下肢與左下肢：霧面底層 + 1.006x Fresnel 邊緣輪廓光外殼 */}
          <group position={[-0.22, 0, 0]} rotation={[0, 0, -0.025]}>
            <mesh geometry={legLatheGeo} material={matteAnatomicalMaterial} />
            <mesh
              geometry={legLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
            />
          </group>
          <group position={[0.22, 0, 0]} rotation={[0, 0, 0.025]}>
            <mesh geometry={legLatheGeo} material={matteAnatomicalMaterial} />
            <mesh
              geometry={legLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
            />
          </group>

          {/* 3. 右上肢與左上肢：霧面底層 + 1.006x Fresnel 邊緣輪廓光外殼 */}
          <group position={[-0.86, 0.34, 0.02]} rotation={[0, 0, -0.24]}>
            <mesh geometry={armLatheGeo} material={matteAnatomicalMaterial} />
            <mesh
              geometry={armLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
            />
          </group>
          <group position={[0.86, 0.34, 0.02]} rotation={[0, 0, 0.24]}>
            <mesh geometry={armLatheGeo} material={matteAnatomicalMaterial} />
            <mesh
              geometry={armLatheGeo}
              material={fresnelMaterial}
              scale={[1.006, 1.006, 1.006]}
            />
          </group>

          {/* 腹部五分區細微解剖定位線 */}
          <mesh position={[0, 0.87, 0.245]}>
            <boxGeometry args={[0.58, 0.006, 0.006]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
          </mesh>
          <mesh position={[0, 0.87, 0.245]}>
            <boxGeometry args={[0.006, 0.60, 0.006]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * 【第二層：32 個獨立透明 3D 感應熱區層 (Invisible Hitbox & Glow Overlay Layer)】
 * - 平時完全透明 (opacity: 0.015)，不遮擋底層模型肌肉紋理與 Fresnel 輪廓光
 * - 當網址帶有 `?debug=hitbox` 時，自動渲染為半透明彩色線框供對齊校準
 * - 當滑鼠懸停 (Hover) 或點選 (Selected / Active) 時，以半透明發光罩 (Glow Overlay) 高亮該解剖部位
 */
const HITBOX_SPATIAL_COORDS: Record<
  BodyRegionId,
  {
    pos: [number, number, number];
    radii: [number, number, number];
    rot?: [number, number, number];
  }
> = {
  // 1. 頭頸與五官細分區 (8 區)
  head_cranial: { pos: [0, 2.60, -0.03], radii: [0.23, 0.18, 0.23] },
  eye_orbital: { pos: [0, 2.47, 0.19], radii: [0.16, 0.055, 0.075] },
  ear_auditory: { pos: [0, 2.43, 0.0], radii: [0.26, 0.07, 0.08] },
  nose_sinus: { pos: [0, 2.38, 0.22], radii: [0.075, 0.06, 0.075] },
  oral_dental_jaw: { pos: [0, 2.26, 0.19], radii: [0.135, 0.065, 0.09] },
  neck_throat: { pos: [0, 2.08, 0.11], radii: [0.10, 0.085, 0.08] },
  face_sensory: { pos: [0, 2.36, 0.15], radii: [0.185, 0.105, 0.08] },
  neck_cervical_thyroid: { pos: [0, 1.98, -0.02], radii: [0.145, 0.125, 0.135] },

  // 2. 胸部、乳房與上背 (4 區)
  chest_right: { pos: [-0.22, 1.54, 0.13], radii: [0.21, 0.25, 0.13] },
  chest_left: { pos: [0.22, 1.54, 0.13], radii: [0.21, 0.25, 0.13] },
  breast_mammary: { pos: [0, 1.44, 0.22], radii: [0.32, 0.125, 0.08] },
  upper_back: { pos: [0, 1.48, -0.15], radii: [0.405, 0.295, 0.135] },

  // 3. 腹部精細五分區 (5 區)
  abd_ruq: { pos: [-0.20, 1.06, 0.15], radii: [0.175, 0.175, 0.125] },
  abd_luq: { pos: [0.20, 1.06, 0.15], radii: [0.175, 0.175, 0.125] },
  abd_epigastric: { pos: [0, 0.88, 0.18], radii: [0.18, 0.205, 0.13] },
  abd_rlq: { pos: [-0.20, 0.66, 0.15], radii: [0.175, 0.18, 0.125] },
  abd_llq: { pos: [0.20, 0.66, 0.15], radii: [0.175, 0.18, 0.125] },

  // 4. 下背、骨盆與私密排泄區 (5 區)
  lower_back: { pos: [0, 0.86, -0.14], radii: [0.345, 0.285, 0.125] },
  pelvis_groin: { pos: [0, 0.38, 0.15], radii: [0.28, 0.145, 0.125] },
  buttocks_hip: { pos: [0, 0.36, -0.15], radii: [0.365, 0.19, 0.14] },
  urogenital_perineal: { pos: [0, 0.18, 0.15], radii: [0.135, 0.095, 0.095] },
  anal_rectal: { pos: [0, 0.18, -0.15], radii: [0.125, 0.095, 0.095] },

  // 5. 上肢左右區 (6 區)
  shoulder_r: { pos: [-0.52, 1.66, 0.01], radii: [0.165, 0.175, 0.155] },
  shoulder_l: { pos: [0.52, 1.66, 0.01], radii: [0.165, 0.175, 0.155] },
  upper_arm_elbow_r: {
    pos: [-0.66, 1.20, 0.02],
    radii: [0.12, 0.315, 0.12],
    rot: [0, 0, -0.24],
  },
  upper_arm_elbow_l: {
    pos: [0.66, 1.20, 0.02],
    radii: [0.12, 0.315, 0.12],
    rot: [0, 0, 0.24],
  },
  forearm_wrist_hand_r: {
    pos: [-0.82, 0.56, 0.04],
    radii: [0.105, 0.375, 0.105],
    rot: [0, 0, -0.24],
  },
  forearm_wrist_hand_l: {
    pos: [0.82, 0.56, 0.04],
    radii: [0.105, 0.375, 0.105],
    rot: [0, 0, 0.24],
  },

  // 6. 下肢左右區 (4 區)
  thigh_knee_r: {
    pos: [-0.23, -0.32, 0.01],
    radii: [0.175, 0.525, 0.175],
    rot: [0, 0, -0.025],
  },
  thigh_knee_l: {
    pos: [0.23, -0.32, 0.01],
    radii: [0.175, 0.525, 0.175],
    rot: [0, 0, 0.025],
  },
  calf_ankle_foot_r: {
    pos: [-0.21, -1.24, 0.03],
    radii: [0.145, 0.545, 0.165],
    rot: [0, 0, -0.025],
  },
  calf_ankle_foot_l: {
    pos: [0.21, -1.24, 0.03],
    radii: [0.145, 0.545, 0.165],
    rot: [0, 0, 0.025],
  },
};

function InvisibleHitboxGlowNode({
  region,
  isSelected,
  isActive,
  isHovered,
  selectedSymptomCount,
  debugHitbox,
  onSelect,
  onHover,
}: {
  region: BodyRegionDefinition;
  isSelected: boolean;
  isActive: boolean;
  isHovered: boolean;
  selectedSymptomCount: number;
  debugHitbox: boolean;
  onSelect: (id: BodyRegionId) => void;
  onHover: (id: BodyRegionId | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coord = HITBOX_SPATIAL_COORDS[region.id as BodyRegionId];
  const isIlluminated = isSelected || isActive || isHovered || debugHitbox;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    if (!mat) return;

    if (isSelected) {
      const pulse = 0.65 + Math.sin(clock.getElapsedTime() * 4.0) * 0.25;
      mat.emissiveIntensity = pulse;
      mat.opacity = 0.48;
    } else if (isActive) {
      mat.emissiveIntensity = 0.72;
      mat.opacity = 0.42;
    } else if (isHovered) {
      mat.emissiveIntensity = 0.55;
      mat.opacity = 0.34;
    } else if (debugHitbox) {
      mat.emissiveIntensity = 0.45;
      mat.opacity = 0.38;
    } else {
      mat.emissiveIntensity = 0;
      mat.opacity = 0.015;
    }
  });

  const glowColor = useMemo(() => {
    if (isSelected) return '#f43f5e';
    if (isActive) return '#22d3ee';
    if (isHovered) return '#38bdf8';
    if (debugHitbox) return region.meshConfig.colorAccent || '#38bdf8';
    return '#0f172a';
  }, [
    isSelected,
    isActive,
    isHovered,
    debugHitbox,
    region.meshConfig.colorAccent,
  ]);

  if (!coord) return null;

  return (
    <group
      position={coord.pos}
      rotation={
        coord.rot
          ? [coord.rot[0], coord.rot[1], coord.rot[2]]
          : [0, 0, 0]
      }
    >
      <mesh
        ref={meshRef}
        scale={coord.radii}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(region.id as BodyRegionId);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(region.id as BodyRegionId);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          onHover(null);
        }}
      >
        <sphereGeometry args={[1, 24, 20]} />
        <meshPhysicalMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isIlluminated ? 0.6 : 0}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={isIlluminated ? 0.38 : 0.015}
          depthWrite={false}
          wireframe={debugHitbox && !isSelected && !isActive && !isHovered}
        />
      </mesh>

      {/* 當部位被懸停或選取時，顯示清晰暗黑玻璃解剖標籤 */}
      {(isSelected || isActive || isHovered) && (
        <Html
          position={[0, 0, 0.25]}
          center
          distanceFactor={5.8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shadow-xl border backdrop-blur-md flex items-center gap-1.5 transition-all ${
              isSelected
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/70'
                : isActive
                ? 'bg-cyan-950/95 text-cyan-100 border-cyan-400/80'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            <span>{region.shortNameZh}</span>
            {selectedSymptomCount > 0 && (
              <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {selectedSymptomCount}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function AnatomicalHumanModel3D({
  debugHitbox = false,
  yOffset = 0,
  scaleMultiplier = 1,
  onModelStatusChange,
}: Partial<ModelCalibrationParams>) {
  const {
    selectedRegions,
    activeRegionId,
    hoveredRegionId,
    setActiveRegion,
    setHoveredRegion,
  } = useDiagnosisStore();

  return (
    <group position={[0, -0.48, 0]}>
      {/* 第一層：支援外部 .glb + DRACO + 自動 Box3 正規化 + Fresnel 輪廓光外殼之單一視覺模型層 */}
      <UnifiedVisualBodyMeshLayer
        yOffset={yOffset}
        scaleMultiplier={scaleMultiplier}
        onModelStatusChange={onModelStatusChange}
      />

      {/* 第二層：32 個獨立透明 3D 感應熱區 (Hitbox & Glow Overlay Layer) */}
      {BODY_REGIONS.map((region) => {
        const rId = region.id as BodyRegionId;
        const record = selectedRegions[rId];
        const isSelected = Boolean(record);
        const count = record
          ? record.qualityIds.length + record.specificSymptomIds.length
          : 0;

        return (
          <InvisibleHitboxGlowNode
            key={rId}
            region={region}
            isSelected={isSelected}
            isActive={activeRegionId === rId}
            isHovered={hoveredRegionId === rId}
            selectedSymptomCount={count}
            debugHitbox={debugHitbox}
            onSelect={setActiveRegion}
            onHover={setHoveredRegion}
          />
        );
      })}

      {/* 底部醫療雷射掃描環形底座 */}
      <mesh position={[0, -1.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.56, 0.68, 64]} />
        <meshBasicMaterial
          color="#0ea5e9"
          side={THREE.DoubleSide}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh position={[0, -1.825, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.56, 64]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.14} />
      </mesh>
    </group>
  );
}
