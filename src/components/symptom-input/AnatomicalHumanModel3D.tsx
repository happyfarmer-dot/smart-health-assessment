'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BODY_REGIONS } from '@/data/bodyRegions';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BodyRegionDefinition, BodyRegionId } from '@/types/cdss';

/**
 * 【第一層：單一完整視覺模型層 (Visual Mesh Layer)】
 * - 優先嘗試載入 `/models/human_body.glb`
 * - 當 `/models/human_body.glb` 尚未放入時，自動渲染以 LatheGeometry（車床平滑解剖曲線）
 *   與 CapsuleGeometry / 平滑車床四肢無縫融合而成的「單一統一低調人類輪廓模型」作為視覺底層。
 * - 未來放入真實 `.glb` 檔案時，無須修改任何互動與熱區程式碼。
 */
function UnifiedVisualBodyMeshLayer() {
  const [externalGlbScene, setExternalGlbScene] =
    useState<THREE.Group | null>(null);

  useEffect(() => {
    let isMounted = true;
    // 檢查 /models/human_body.glb 是否存在
    fetch('/models/human_body.glb', { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) return;
        const loader = new GLTFLoader();
        loader.load(
          '/models/human_body.glb',
          (gltf) => {
            if (!isMounted || !gltf?.scene) return;
            gltf.scene.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = new THREE.MeshPhysicalMaterial({
                  color: '#1e293b',
                  emissive: '#0ea5e9',
                  emissiveIntensity: 0.12,
                  roughness: 0.24,
                  metalness: 0.15,
                  transmission: 0.35,
                  clearcoat: 0.85,
                  transparent: true,
                  opacity: 0.82,
                });
              }
            });
            setExternalGlbScene(gltf.scene);
          },
          undefined,
          () => {
            // 無外部 .glb 時靜默使用內建平滑備援模型
          }
        );
      })
      .catch(() => {
        // 靜默 fallback
      });

    return () => {
      isMounted = false;
    };
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

  // 下肢平滑解剖曲面 (大腿股四頭肌 ➔ 膝蓋 ➔ 小腿肚腓腸肌 ➔ 腳踝 ➔ 足部)
  const legLatheGeo = useMemo(() => {
    const legProfile: [number, number][] = [
      [0.01, -1.75],
      [0.09, -1.70],
      [0.066, -1.52], // 腳踝收細
      [0.085, -1.28],
      [0.134, -0.96], // 小腿肚腓腸肌飽滿弧度
      [0.116, -0.74],
      [0.110, -0.58], // 膝關節
      [0.140, -0.35],
      [0.174, -0.05], // 大腿上段
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

  // 上肢平滑解剖曲面 (肩三角肌 ➔ 上臂二頭肌 ➔ 手肘 ➔ 前臂 ➔ 手腕手掌)
  const armLatheGeo = useMemo(() => {
    const armProfile: [number, number][] = [
      [0.01, 0.0],
      [0.068, 0.12],
      [0.052, 0.26],  // 手腕收細
      [0.085, 0.56],  // 前臂肌群
      [0.075, 0.78],  // 手肘關節
      [0.104, 1.06],  // 上臂二頭肌/三頭肌
      [0.130, 1.38],  // 肩三角肌弧度
      [0.01, 1.52],
    ];
    const v2 = armProfile.map(([r, y]) => new THREE.Vector2(r, y));
    const spline = new THREE.SplineCurve(v2);
    const geo = new THREE.LatheGeometry(spline.getPoints(48), 36);
    geo.scale(0.95, 1.0, 0.88);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 統一醫療級半透明磨砂材質 (Unified Low-Key Frosted Clinical Material)
  const unifiedBodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1e293b',
        emissive: '#0284c7',
        emissiveIntensity: 0.14,
        roughness: 0.24,
        metalness: 0.15,
        transmission: 0.38,
        thickness: 0.7,
        clearcoat: 0.85,
        clearcoatRoughness: 0.18,
        reflectivity: 0.9,
        transparent: true,
        opacity: 0.78,
      }),
    []
  );

  if (externalGlbScene) {
    return <primitive object={externalGlbScene} />;
  }

  return (
    <group>
      {/* 單一統一視覺底層：頭頸軀幹 */}
      <mesh geometry={torsoHeadLatheGeo} material={unifiedBodyMaterial} />

      {/* 單一統一視覺底層：右下肢與左下肢 */}
      <mesh
        geometry={legLatheGeo}
        material={unifiedBodyMaterial}
        position={[-0.22, 0, 0]}
        rotation={[0, 0, -0.025]}
      />
      <mesh
        geometry={legLatheGeo}
        material={unifiedBodyMaterial}
        position={[0.22, 0, 0]}
        rotation={[0, 0, 0.025]}
      />

      {/* 單一統一視覺底層：右上肢與左上肢 */}
      <mesh
        geometry={armLatheGeo}
        material={unifiedBodyMaterial}
        position={[-0.86, 0.34, 0.02]}
        rotation={[0, 0, -0.24]}
      />
      <mesh
        geometry={armLatheGeo}
        material={unifiedBodyMaterial}
        position={[0.86, 0.34, 0.02]}
        rotation={[0, 0, 0.24]}
      />

      {/* 腹部五分區極細微解剖定位格線 (協助精準辨識右上/左上/中上/右下/左下五區) */}
      <mesh position={[0, 0.87, 0.245]}>
        <boxGeometry args={[0.58, 0.006, 0.006]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0.87, 0.245]}>
        <boxGeometry args={[0.006, 0.60, 0.006]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/**
 * 【第二層：24 個獨立透明 3D 感應熱區層 (Invisible Hitbox & Glow Overlay Layer)】
 * - 平時完全透明 (opacity: 0.02)，不破壞底層單一人體模型的平滑連續美感
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
  // 1. 頭頸與五官 (3 區)
  head_cranial: { pos: [0, 2.53, -0.02], radii: [0.245, 0.255, 0.235] },
  face_sensory: { pos: [0, 2.38, 0.14], radii: [0.195, 0.175, 0.125] },
  neck_throat: { pos: [0, 2.04, 0.01], radii: [0.15, 0.165, 0.14] },

  // 2. 胸部與上背 (3 區)
  chest_right: { pos: [-0.21, 1.52, 0.14], radii: [0.225, 0.265, 0.145] },
  chest_left: { pos: [0.21, 1.52, 0.14], radii: [0.225, 0.265, 0.145] },
  upper_back: { pos: [0, 1.48, -0.15], radii: [0.405, 0.295, 0.135] },

  // 3. 腹部精細五分區 (5 區)
  abd_ruq: { pos: [-0.20, 1.06, 0.15], radii: [0.175, 0.175, 0.125] },
  abd_luq: { pos: [0.20, 1.06, 0.15], radii: [0.175, 0.175, 0.125] },
  abd_epigastric: { pos: [0, 0.88, 0.18], radii: [0.18, 0.205, 0.13] },
  abd_rlq: { pos: [-0.20, 0.66, 0.15], radii: [0.175, 0.18, 0.125] },
  abd_llq: { pos: [0.20, 0.66, 0.15], radii: [0.175, 0.18, 0.125] },

  // 4. 下背與骨盆 (3 區)
  lower_back: { pos: [0, 0.86, -0.14], radii: [0.345, 0.285, 0.125] },
  pelvis_groin: { pos: [0, 0.34, 0.15], radii: [0.295, 0.165, 0.135] },
  buttocks_hip: { pos: [0, 0.34, -0.15], radii: [0.365, 0.205, 0.145] },

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
    pos: [-0.81, 0.60, 0.03],
    radii: [0.11, 0.335, 0.105],
    rot: [0, 0, -0.24],
  },
  forearm_wrist_hand_l: {
    pos: [0.81, 0.60, 0.03],
    radii: [0.11, 0.335, 0.105],
    rot: [0, 0, 0.24],
  },

  // 6. 下肢左右區 (4 區)
  thigh_knee_r: {
    pos: [-0.22, -0.26, 0.01],
    radii: [0.17, 0.445, 0.165],
    rot: [0, 0, -0.025],
  },
  thigh_knee_l: {
    pos: [0.22, -0.26, 0.01],
    radii: [0.17, 0.445, 0.165],
    rot: [0, 0, 0.025],
  },
  calf_ankle_foot_r: {
    pos: [-0.23, -1.16, 0.01],
    radii: [0.14, 0.485, 0.14],
    rot: [0, 0, -0.025],
  },
  calf_ankle_foot_l: {
    pos: [0.23, -1.16, 0.01],
    radii: [0.14, 0.485, 0.14],
    rot: [0, 0, 0.025],
  },
};

function InvisibleHitboxGlowNode({
  region,
  isSelected,
  isActive,
  isHovered,
  onSelect,
  onHoverChange,
}: {
  region: BodyRegionDefinition;
  isSelected: boolean;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coord = HITBOX_SPATIAL_COORDS[region.id as BodyRegionId];

  useFrame((state) => {
    if (!meshRef.current || !coord) return;
    const [rx, ry, rz] = coord.radii;
    if (isActive || isSelected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4.2) * 0.04;
      meshRef.current.scale.set(rx * pulse, ry * pulse, rz * pulse);
    } else if (isHovered) {
      meshRef.current.scale.set(rx * 1.04, ry * 1.04, rz * 1.04);
    } else {
      meshRef.current.scale.set(rx, ry, rz);
    }
  });

  if (!coord) return null;

  const isHighlighted = isSelected || isActive || isHovered;

  // 平時完全透明 (Invisible Hitbox)，僅在 Hover 或 Selected 時亮起半透明發光罩 (Glow Overlay)
  const glowColor = isSelected
    ? '#f43f5e' // 已標記症狀：珊瑚紅發光罩
    : isActive
    ? '#06b6d4' // 當前檢視中：醫療青色發光罩
    : '#38bdf8'; // 滑鼠懸停：天藍發光罩

  const glowOpacity = isSelected
    ? 0.72
    : isActive
    ? 0.58
    : isHovered
    ? 0.44
    : 0.015; // 未觸發時幾近完全透明，僅負責接收 Raycaster 點擊與懸停判定

  return (
    <group
      position={coord.pos}
      rotation={coord.rot ? coord.rot : [0, 0, 0]}
    >
      <mesh
        ref={meshRef}
        scale={coord.radii}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHoverChange(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          onHoverChange(false);
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isHighlighted ? 0.75 : 0}
          roughness={0.18}
          metalness={0.05}
          clearcoat={1}
          transparent
          opacity={glowOpacity}
          depthWrite={false}
        />
      </mesh>

      {isHighlighted && (
        <Html
          position={[0, 0, 0.18]}
          center
          distanceFactor={5.4}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap shadow-2xl border backdrop-blur-md ${
              isSelected
                ? 'bg-rose-600/95 text-white border-rose-300'
                : isActive
                ? 'bg-cyan-600/95 text-slate-950 border-cyan-200'
                : 'bg-slate-900/95 text-cyan-200 border-cyan-400/60'
            }`}
          >
            {region.shortNameZh}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * 模組 B 核心組件：單一完整視覺模型層 ＋ 24 個透明 3D 感應熱區發光層
 */
export function AnatomicalHumanModel3D() {
  const {
    activeRegionId,
    hoveredRegionId,
    selectedRegions,
    setActiveRegion,
    setHoveredRegion,
  } = useDiagnosisStore();

  return (
    <group position={[0, -0.52, 0]}>
      {/* 第一層：單一完整視覺模型 (/models/human_body.glb 或 Lathe+Capsule 平滑備援) */}
      <UnifiedVisualBodyMeshLayer />

      {/* 第二層：24 個獨立透明 3D 感應熱區 (Hover / Selected Glow Overlays) */}
      {BODY_REGIONS.map((region) => {
        const isSelected = Boolean(selectedRegions[region.id]);
        const isActive = activeRegionId === region.id;
        const isHovered = hoveredRegionId === region.id;

        return (
          <InvisibleHitboxGlowNode
            key={region.id}
            region={region}
            isSelected={isSelected}
            isActive={isActive}
            isHovered={isHovered}
            onSelect={() => setActiveRegion(region.id as BodyRegionId)}
            onHoverChange={(hov) =>
              setHoveredRegion(hov ? (region.id as BodyRegionId) : null)
            }
          />
        );
      })}
    </group>
  );
}
