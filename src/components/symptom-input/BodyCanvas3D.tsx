'use client';

import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  FlipHorizontal2,
  RotateCcw,
  Hand,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ProceduralHumanMesh } from './ProceduralHumanMesh';
import { useHealthStore } from '@/store/useHealthStore';
import { BODY_REGION_MAP } from '@/data/bodyRegions';

function CameraController() {
  const { cameraOrientation, cameraResetTrigger } = useHealthStore();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  useEffect(() => {
    const zPos = cameraOrientation === 'anterior' ? 4.4 : -4.4;
    camera.position.set(0, 0.85, zPos);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.75, 0);
      controlsRef.current.update();
    }
  }, [cameraOrientation, cameraResetTrigger, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2.2}
      maxDistance={6.8}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
    />
  );
}

export function BodyCanvas3D() {
  const {
    cameraOrientation,
    toggleCameraOrientation,
    triggerCameraReset,
    activeRegionId,
    hoveredRegionId,
    selectedRegions,
    setActiveRegion,
  } = useHealthStore();

  const isAnterior = cameraOrientation === 'anterior';
  const inspectRegion =
    (hoveredRegionId && BODY_REGION_MAP[hoveredRegionId]) ||
    (activeRegionId && BODY_REGION_MAP[activeRegionId]) ||
    null;

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between select-none">
      {/* 頂部控制列：正背面一鍵翻轉 + 重置視角 */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 backdrop-blur-sm">
            目前視角：{isAnterior ? '正面 (Anterior)' : '背面 (Posterior)'}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <Hand className="w-3 h-3 text-sky-400" />
            單指拖曳旋轉・雙指縮放・點擊部位標記症狀
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleCameraOrientation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            <span>一鍵翻轉至{isAnterior ? '背面' : '正面'}</span>
          </button>
          <button
            type="button"
            onClick={triggerCameraReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="重置 3D 視角"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重置視角</span>
          </button>
        </div>
      </div>

      {/* 左右側別防呆浮水印 (病人視角 Laterality Safeguard) */}
      <div className="pointer-events-none absolute inset-y-16 left-3 flex items-center z-10">
        <div className="bg-slate-900/85 border border-sky-500/40 text-sky-200 px-2.5 py-2 rounded-xl backdrop-blur-sm shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">
            畫面左方
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white">
            {isAnterior ? '← 身體右側' : '← 身體左側'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAnterior ? '(如：右上腹肝膽／右下腹闌尾)' : '(背面視角左肩／左腰)'}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-16 right-3 flex items-center z-10">
        <div className="bg-slate-900/85 border border-sky-500/40 text-sky-200 px-2.5 py-2 rounded-xl backdrop-blur-sm shadow-lg text-right">
          <div className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">
            畫面右方
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white">
            {isAnterior ? '身體左側 →' : '身體右側 →'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAnterior ? '(如：左胸心臟／左上腹／左下腹)' : '(背面視角右肩／右腰)'}
          </div>
        </div>
      </div>

      {/* Three.js R3F 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0.85, 4.4], fov: 42 }}
          onPointerMissed={() => setActiveRegion(null)}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[4, 6, 5]} intensity={1.1} />
          <directionalLight position={[-4, 3, -5]} intensity={0.7} />
          <pointLight position={[0, 2, 3]} intensity={0.5} color="#38bdf8" />

          <ProceduralHumanMesh />
          <ContactShadows
            position={[0, -2.25, 0]}
            opacity={0.45}
            scale={5}
            blur={2.4}
            far={4}
          />
          <CameraController />
        </Canvas>
      </div>

      {/* 底部狀態提示與腹部五分區快捷按鈕列 */}
      <div className="relative z-10 p-3 bg-slate-950/90 border-t border-slate-800/90 backdrop-blur-md space-y-2">
        {/* 腹部五區快捷定位列（方便手指直接點擊或檢視） */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-emerald-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            腹部五區快選：
          </span>
          {(
            [
              { id: 'abd_ruq', label: '右上腹(肝膽)' },
              { id: 'abd_epigastric', label: '中上腹/肚臍(胃胰)' },
              { id: 'abd_luq', label: '左上腹(脾胃)' },
              { id: 'abd_rlq', label: '右下腹(闌尾區)' },
              { id: 'abd_llq', label: '左下腹(結腸區)' },
            ] as const
          ).map((abd) => {
            const isSel = Boolean(selectedRegions[abd.id]);
            const isAct = activeRegionId === abd.id;
            return (
              <button
                key={abd.id}
                type="button"
                onClick={() => setActiveRegion(abd.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 border transition-all ${
                  isSel
                    ? 'bg-rose-600 text-white border-rose-400'
                    : isAct
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isSel ? '✓ ' : ''}
                {abd.label}
              </button>
            );
          })}
        </div>

        {/* 即時部位解剖說明列 */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {inspectRegion ? (
            <div className="flex items-center gap-2 text-sky-200 truncate">
              <span className="font-bold text-white">
                {inspectRegion.nameZh}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                ｜{inspectRegion.clinicalFocusZh}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                請點擊 3D 模型上的任一部位（共 24 區，含腹部五分區），即可在右側設定「表層／肌肉關節／深層」與症狀。
              </span>
            </div>
          )}
          <span className="text-[11px] text-slate-400 shrink-0">
            已標記部位：{Object.keys(selectedRegions).length} 處
          </span>
        </div>
      </div>
    </div>
  );
}
