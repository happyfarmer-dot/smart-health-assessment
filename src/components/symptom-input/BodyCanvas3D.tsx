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
  Crosshair,
} from 'lucide-react';
import { AnatomicalHumanModel3D } from './AnatomicalHumanModel3D';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import { BodyRegionId } from '@/types/cdss';

function CameraController() {
  const { cameraOrientation, cameraResetCount } = useDiagnosisStore();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  useEffect(() => {
    const zPos = cameraOrientation === 'anterior' ? 4.35 : -4.35;
    camera.position.set(0, 0.72, zPos);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.55, 0);
      controlsRef.current.update();
    }
  }, [cameraOrientation, cameraResetCount, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2.1}
      maxDistance={6.6}
      maxPolarAngle={Math.PI * 0.86}
      minPolarAngle={Math.PI * 0.14}
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
  } = useDiagnosisStore();

  const isAnterior = cameraOrientation === 'anterior';
  const inspectRegion =
    (hoveredRegionId && BODY_REGION_MAP[hoveredRegionId]) ||
    (activeRegionId && BODY_REGION_MAP[activeRegionId]) ||
    null;

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      {/* 頂部控制列：正背面一鍵翻轉 + 重置視角 */}
      <div className="relative z-10 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
            解剖視角：{isAnterior ? '正面 (Anterior)' : '背面 (Posterior)'}
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-800">
            <Hand className="w-3 h-3 text-cyan-400" />
            拖曳旋轉・滾輪縮放・點擊部位標記深度與感受性質
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleCameraOrientation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/50 transition-all"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            <span>翻轉至{isAnterior ? '背面' : '正面'}</span>
          </button>
          <button
            type="button"
            onClick={triggerCameraReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
            title="重置 3D 視角"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重置視角</span>
          </button>
        </div>
      </div>

      {/* 左右側別防呆標示 (病人自身視角 Laterality Safeguard) */}
      <div className="pointer-events-none absolute inset-y-20 left-3.5 flex items-center z-10">
        <div className="bg-slate-950/85 border border-cyan-500/30 text-cyan-200 px-3 py-2.5 rounded-xl backdrop-blur-md shadow-xl">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
            畫面左方
          </div>
          <div className="text-xs sm:text-sm font-black text-white mt-0.5">
            {isAnterior ? '← 身體右側' : '← 身體左側'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAnterior ? '(右上腹肝膽／右下腹闌尾)' : '(背面左肩／左後腰)'}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-20 right-3.5 flex items-center z-10">
        <div className="bg-slate-950/85 border border-cyan-500/30 text-cyan-200 px-3 py-2.5 rounded-xl backdrop-blur-md shadow-xl text-right">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
            畫面右方
          </div>
          <div className="text-xs sm:text-sm font-black text-white mt-0.5">
            {isAnterior ? '身體左側 →' : '身體右側 →'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAnterior ? '(左胸心前區／左上腹／左下腹)' : '(背面右肩／右後腰)'}
          </div>
        </div>
      </div>

      {/* Three.js R3F 醫療級柔和三點打光畫布 */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0.72, 4.35], fov: 40 }}
          onPointerMissed={() => setActiveRegion(null)}
        >
          {/* 柔和醫療三點照明：環境底光 + 主光 (Key Light) + 冷色補光 (Fill Light) + 背向輪廓邊緣光 (Rim Light) */}
          <ambientLight intensity={0.75} />
          <directionalLight position={[3.5, 5.5, 4.5]} intensity={1.35} color="#f8fafc" />
          <directionalLight position={[-4.0, 2.5, 3.0]} intensity={0.85} color="#38bdf8" />
          <directionalLight position={[0, 3.5, -5.0]} intensity={1.1} color="#22d3ee" />
          <pointLight position={[0, 1.4, 2.6]} intensity={0.6} color="#06b6d4" />

          <AnatomicalHumanModel3D />

          <ContactShadows
            position={[0, -2.32, 0]}
            opacity={0.55}
            scale={4.8}
            blur={2.5}
            far={4}
            color="#0284c7"
          />
          <CameraController />
        </Canvas>
      </div>

      {/* 底部腹部五分區快捷定位與解剖器官提示列 */}
      <div className="relative z-10 p-3.5 bg-slate-950/90 border-t border-slate-800/90 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-cyan-400 shrink-0 flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5" />
            腹部五區精準定位：
          </span>
          {(
            [
              { id: 'abd_ruq', label: '右上腹 (肝膽區)' },
              { id: 'abd_epigastric', label: '中上腹/肚臍 (胃十二指腸胰)' },
              { id: 'abd_luq', label: '左上腹 (脾胃胰尾)' },
              { id: 'abd_rlq', label: '右下腹 (闌尾迴盲區)' },
              { id: 'abd_llq', label: '左下腹 (乙狀結腸區)' },
            ] as const
          ).map((abd) => {
            const isSel = Boolean(selectedRegions[abd.id]);
            const isAct = activeRegionId === abd.id;
            return (
              <button
                key={abd.id}
                type="button"
                onClick={() => setActiveRegion(abd.id as BodyRegionId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 border transition-all ${
                  isSel
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-950'
                    : isAct
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isSel ? '● ' : ''}
                {abd.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          {inspectRegion ? (
            <div className="flex items-center gap-2 text-cyan-300 truncate">
              <span className="font-bold text-white">
                {inspectRegion.nameZh}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                ｜解剖對應：{inspectRegion.clinicalFocusZh}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                請點選 3D 人體分區（共 24 區，含腹部五分區），於右側標記「深度層級」與「疼痛／不適感受性質」。
              </span>
            </div>
          )}
          <span className="text-[11px] text-slate-400 shrink-0">
            已標記部位：{Object.keys(selectedRegions).length} 區
          </span>
        </div>
      </div>
    </div>
  );
}
