'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BODY_REGIONS } from '@/data/bodyRegions';
import { useHealthStore } from '@/store/useHealthStore';
import { BodyRegionDefinition } from '@/types/medical';

interface RegionHitboxNodeProps {
  region: BodyRegionDefinition;
  isSelected: boolean;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHoverChange: (hovered: boolean) => void;
}

function RegionHitboxNode({
  region,
  isSelected,
  isActive,
  isHovered,
  onSelect,
  onHoverChange,
}: RegionHitboxNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { position, scale, shape, rotation, colorAccent } = region.meshConfig;

  useFrame((state) => {
    if (!meshRef.current) return;
    // 選中或啟用時給予微幅呼吸脈動動畫，提升視覺辨識度
    if (isActive || isSelected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.035;
      meshRef.current.scale.set(
        scale[0] * pulse,
        scale[1] * pulse,
        scale[2] * pulse
      );
    } else {
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  });

  // 色彩層級：已選取症狀 (玫瑰紅/橘紅高亮) > 當前點開檢視 (亮天藍) > 滑鼠懸停 (青色) > 預設解剖半透明色
  const fillColor = isSelected
    ? '#f43f5e'
    : isActive
    ? '#0284c7'
    : isHovered
    ? '#38bdf8'
    : '#cbd5e1';

  const emissiveColor = isSelected
    ? '#be123c'
    : isActive
    ? '#0369a1'
    : isHovered
    ? colorAccent
    : '#0f172a';

  const opacity = isSelected || isActive ? 0.92 : isHovered ? 0.85 : 0.68;

  return (
    <group position={position} rotation={rotation ? rotation : [0, 0, 0]}>
      <mesh
        ref={meshRef}
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
        {shape === 'sphere' ? (
          <sphereGeometry args={[0.5, 28, 28]} />
        ) : shape === 'cylinder' ? (
          <cylinderGeometry args={[0.45, 0.4, 1, 24]} />
        ) : (
          <boxGeometry args={[0.92, 0.92, 0.92]} />
        )}
        <meshStandardMaterial
          color={fillColor}
          emissive={emissiveColor}
          emissiveIntensity={isSelected || isActive ? 0.45 : isHovered ? 0.25 : 0.05}
          roughness={0.35}
          metalness={0.1}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 當滑鼠懸停、點開或已勾選症狀時，在 3D 空間顯示清晰解剖標籤 */}
      {(isHovered || isActive || isSelected) && (
        <Html
          position={[0, 0, 0.25]}
          center
          distanceFactor={6}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow-md border ${
              isSelected
                ? 'bg-rose-600 text-white border-rose-400'
                : isActive
                ? 'bg-sky-700 text-white border-sky-300'
                : 'bg-slate-900/90 text-sky-200 border-sky-500/50'
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
 * 模組化 3D 解剖人體模型（24 區高靈敏 Hitbox）
 * 備註：已預留 customGlbUrl 參數，未來若放入高精度 `/models/human_anatomy.glb`，
 * 可直接透過 useGLTF 載入並綁定相同 24 個 RegionId。
 */
export function ProceduralHumanMesh() {
  const {
    activeRegionId,
    hoveredRegionId,
    selectedRegions,
    setActiveRegion,
    setHoveredRegion,
  } = useHealthStore();

  return (
    <group position={[0, -0.45, 0]}>
      {/* 中軸軀幹內層骨架參考線（半透明襯底，讓 24 個分區呈現完整人形結構） */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.38, 0.34, 1.45, 20]} />
        <meshStandardMaterial
          color="#475569"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* 腹部五分區十字解剖導引線 (正面視覺輔助) */}
      <mesh position={[0, 0.85, 0.29]}>
        <boxGeometry args={[0.85, 0.012, 0.01]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 0.85, 0.29]}>
        <boxGeometry args={[0.012, 0.78, 0.01]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} />
      </mesh>

      {/* 渲染全部 24 個可點擊解剖區域 */}
      {BODY_REGIONS.map((region) => {
        const isSelected = Boolean(selectedRegions[region.id]);
        const isActive = activeRegionId === region.id;
        const isHovered = hoveredRegionId === region.id;

        return (
          <RegionHitboxNode
            key={region.id}
            region={region}
            isSelected={isSelected}
            isActive={isActive}
            isHovered={isHovered}
            onSelect={() => setActiveRegion(region.id)}
            onHoverChange={(hov) => setHoveredRegion(hov ? region.id : null)}
          />
        );
      })}
    </group>
  );
}
