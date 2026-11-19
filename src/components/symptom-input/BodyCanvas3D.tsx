'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  FlipHorizontal2,
  RotateCcw,
  Hand,
  ShieldCheck,
  Crosshair,
  Sliders,
  Info,
  ZoomIn,
  Layers,
} from 'lucide-react';
import {
  AnatomicalHumanModel3D,
  ModelBoundsInfo,
} from './AnatomicalHumanModel3D';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { BODY_REGION_MAP } from '@/data/bodyRegions';
import { BodyRegionId } from '@/types/cdss';

function CameraController({ bounds }: { bounds: ModelBoundsInfo }) {
  const { cameraOrientation, cameraFocusPreset, cameraResetCount } =
    useDiagnosisStore();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();

  useEffect(() => {
    if (cameraFocusPreset === 'head_neck') {
      const zPos = cameraOrientation === 'anterior' ? 2.35 : -2.35;
      camera.position.set(0, 1.88, zPos);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 1.82, 0);
        controlsRef.current.update();
      }
      return;
    }

    const vFov = THREE.MathUtils.degToRad(40);
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.45);
    // 預留上下至少 10% 空間（總高乘以 1.25），並確保左右手臂在窄螢幕不裁切
    const fitHeight = bounds.height * 1.25;
    const fitWidth = bounds.width * 1.15;
    const distV = fitHeight / 2 / Math.tan(vFov / 2);
    const distH = fitWidth / 2 / (Math.tan(vFov / 2) * aspect);
    const dist = Math.max(distV, distH);

    const zPos = cameraOrientation === 'anterior' ? dist : -dist;
    camera.position.set(0, bounds.centerY + 0.06, zPos);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, bounds.centerY, 0);
      controlsRef.current.update();
    }
  }, [
    cameraOrientation,
    cameraFocusPreset,
    cameraResetCount,
    camera,
    bounds.centerY,
    bounds.height,
    bounds.width,
    size.width,
    size.height,
  ]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.06}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2.2}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
    />
  );
}

/**
 * 錯誤邊界 (Error Boundary)：確保任何 WebGL 或外部 .glb 異常都不會導致白畫面崩潰
 */
class ThreeCanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center space-y-2">
          <div className="text-sm font-bold text-rose-300">
            3D WebGL 渲染器初始化受限，建議使用上方「2D 快速列表模式」繼續標記症狀
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function BodyCanvas3D({
  extraModalOpen = false,
}: {
  extraModalOpen?: boolean;
}) {
  const {
    cameraOrientation,
    cameraFocusPreset,
    toggleCameraOrientation,
    setCameraFocusPreset,
    triggerCameraReset,
    activeRegionId,
    hoveredRegionId,
    selectedRegions,
    isFollowUpModalOpen,
    isApiModalOpen,
    setActiveRegion,
  } = useDiagnosisStore();

  // 規格 2：支援網址參數 `?debug=hitbox` 觸發熱區線框與微調滑桿（模型 Y 軸偏移與整體縮放倍率）
  const [debugHitbox, setDebugHitbox] = useState(false);
  const [showRegionBoundaries, setShowRegionBoundaries] = useState(true);
  const [calibYOffset, setCalibYOffset] = useState(0);
  const [calibScale, setCalibScale] = useState(1.0);
  const [modelBounds, setModelBounds] = useState<ModelBoundsInfo>({
    centerY: 0.03,
    height: 4.52,
    width: 2.7,
  });
  const [modelStatus, setModelStatus] = useState<{
    isLoading: boolean;
    progressPct: number;
    usingFallback: boolean;
  }>({
    isLoading: false,
    progressPct: 100,
    usingFallback: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'hitbox') {
        setDebugHitbox(true);
      }
    }
  }, []);

  const isAnterior = cameraOrientation === 'anterior';
  const isHeadNeckZoom = cameraFocusPreset === 'head_neck';
  const hideHtmlLabels = Boolean(
    activeRegionId || isFollowUpModalOpen || isApiModalOpen || extraModalOpen
  );
  const inspectRegion =
    (hoveredRegionId && BODY_REGION_MAP[hoveredRegionId]) ||
    (activeRegionId && BODY_REGION_MAP[activeRegionId]) ||
    null;

  return (
    <div className="relative w-full min-h-[560px] sm:min-h-[650px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* 頂部控制列：正背面翻轉 + 放大頭頸五官 + 分區邊界開關 + 重置視角 */}
      <div className="relative z-10 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-800/70 bg-slate-950/75 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            視角：{isAnterior ? '正面' : '背面'}
          </span>
          <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <Hand className="w-3 h-3 text-cyan-400" />
            拖曳旋轉・滾輪縮放・點擊部位標記
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setCameraFocusPreset(isHeadNeckZoom ? 'full_body' : 'head_neck')
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all ${
              isHeadNeckZoom
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-200 border-cyan-500/40'
            }`}
            title="拉近鏡頭精準點選頭顱、眼、耳、鼻、口、喉等 8 個五官分區"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{isHeadNeckZoom ? '返回全身' : '放大頭頸五官'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRegionBoundaries((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all ${
              showRegionBoundaries
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60'
                : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="切換顯示各部位半透明分區邊界"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">分區邊界</span>
          </button>

          <button
            type="button"
            onClick={toggleCameraOrientation}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/50 transition-all"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            <span>翻轉{isAnterior ? '背面' : '正面'}</span>
          </button>

          <button
            type="button"
            onClick={triggerCameraReset}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
            title="重置 3D 視角"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 規格 2：當網址帶有 ?debug=hitbox 時顯示的開發校準工具列 */}
      {debugHitbox && (
        <div className="relative z-20 mx-3 mt-2 rounded-xl border border-amber-500/50 bg-slate-950/90 p-3 text-xs text-slate-200 backdrop-blur-md shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              3D 熱區對齊校準模式 (?debug=hitbox) — 32 區彩色線框已開啟
            </span>
            <button
              type="button"
              onClick={() => {
                setCalibYOffset(0);
                setCalibScale(1.0);
              }}
              className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-cyan-300 hover:bg-slate-700"
            >
              重置參數
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>模型 Y 軸偏移 (Y-Offset)</span>
                <span className="font-mono text-cyan-300">
                  {calibYOffset.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={-1.0}
                max={1.0}
                step={0.02}
                value={calibYOffset}
                onChange={(e) => setCalibYOffset(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>模型整體縮放倍率 (Scale)</span>
                <span className="font-mono text-cyan-300">
                  {calibScale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.4}
                step={0.02}
                value={calibScale}
                onChange={(e) => setCalibScale(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* 中央獨立 3D 畫布區：確保頭頂至腳底完整置中且不被上下工具列遮擋 */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[450px]">
        {/* 極簡、無厚重底色的半透明單行角落標籤（絕不壓在人體模型上） */}
        <div className="pointer-events-none absolute top-2.5 left-3 z-10 text-[11px] font-bold text-cyan-300/80">
          {isAnterior ? '← 身體右側' : '← 身體左側'}
        </div>
        <div className="pointer-events-none absolute top-2.5 right-3 z-10 text-[11px] font-bold text-cyan-300/80">
          {isAnterior ? '身體左側 →' : '身體右側 →'}
        </div>

        {!modelStatus.isLoading && modelStatus.usingFallback && (
          <div className="pointer-events-none absolute bottom-2 left-3 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400/90">
              <Info className="w-3 h-3 text-cyan-400/80" />
              使用預設輪廓
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-2 right-3 z-10">
          <span className="text-[10px] text-slate-500/80">
            3D Model: MakeHuman base mesh (CC0)
          </span>
        </div>

        <div className="absolute inset-0">
          <ThreeCanvasErrorBoundary>
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [0, 0.03, 7.8], fov: 40 }}
              onPointerMissed={() => setActiveRegion(null)}
            >
            {/* 1. 主光 (Key Light) */}
            <directionalLight
              position={[3.8, 5.2, 4.2]}
              intensity={1.3}
              color="#f8fafc"
            />

            {/* 2. 補光 (Fill Light) */}
            <directionalLight
              position={[-3.6, 2.4, 3.2]}
              intensity={0.62}
              color="#bae6fd"
            />
            <hemisphereLight args={['#e0f2fe', '#0f172a', 0.5]} />

            {/* 3. 輪廓背光 (Rim / Back Light) */}
            <directionalLight
              position={[0, 4.2, -5.0]}
              intensity={1.6}
              color="#38bdf8"
            />
            <spotLight
              position={[0, 3.8, -4.2]}
              angle={0.55}
              penumbra={0.85}
              intensity={1.25}
              color="#22d3ee"
            />

            <AnatomicalHumanModel3D
              debugHitbox={debugHitbox}
              showRegionBoundaries={showRegionBoundaries}
              hideHtmlLabels={hideHtmlLabels}
              yOffset={calibYOffset}
              scaleMultiplier={calibScale}
              onModelStatusChange={setModelStatus}
              onBoundsComputed={setModelBounds}
            />

            <ContactShadows
              position={[0, -2.32, 0]}
              opacity={0.5}
              scale={4.8}
              blur={2.5}
              far={4}
              color="#0284c7"
            />
            <CameraController bounds={modelBounds} />
            </Canvas>
          </ThreeCanvasErrorBoundary>
        </div>
      </div>

      {/* 底部腹部五分區快捷定位（改為 flex-wrap 自動換行，不截斷文字） */}
      <div className="relative z-10 p-3 sm:p-3.5 bg-slate-950/90 border-t border-slate-800/90 backdrop-blur-md space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 mr-1">
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
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
              <span className="text-[11px]">
                點選 3D 人體分區（共 32 區），標記深度與不適性質。
              </span>
            </div>
          )}
          <span className="text-[11px] text-slate-400 shrink-0">
            已標記：{Object.keys(selectedRegions).length} 區
          </span>
        </div>
      </div>
    </div>
  );
}
