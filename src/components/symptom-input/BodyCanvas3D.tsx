'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  FlipHorizontal2,
  RotateCcw,
  Hand,
  ShieldCheck,
  Crosshair,
  Sliders,
  Info,
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
      enableDamping={true}
      dampingFactor={0.06}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2.2}
      maxDistance={6.4}
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

  // 規格 2：支援網址參數 `?debug=hitbox` 觸發熱區線框與微調滑桿（模型 Y 軸偏移與整體縮放倍率）
  const [debugHitbox, setDebugHitbox] = useState(false);
  const [calibYOffset, setCalibYOffset] = useState(0);
  const [calibScale, setCalibScale] = useState(1.0);
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

      {/* 規格 2：當網址帶有 ?debug=hitbox 時顯示的開發校準工具列（平時不顯示在一般使用者畫面上） */}
      {debugHitbox && (
        <div className="relative z-20 mx-4 rounded-xl border border-amber-500/50 bg-slate-950/90 p-3 text-xs text-slate-200 backdrop-blur-md shadow-xl space-y-2">
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

      {/* 規格 1 & 6：畫布角落微小備援提示 + 最右下角 CC-BY 授權標示位 */}
      {!modelStatus.isLoading && modelStatus.usingFallback && (
        <div className="pointer-events-none absolute bottom-[86px] left-3.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-950/75 border border-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400 backdrop-blur-sm">
            <Info className="w-3 h-3 text-cyan-400/80" />
            尚未偵測到自訂模型 (/public/models/human_body.glb)，目前使用預設輪廓
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-[86px] right-3.5 z-10">
        <span className="rounded-md bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-500/90 backdrop-blur-sm">
          3D Model Attribution (CC-BY)
        </span>
      </div>

      {/* 規格 4 & 5：三點醫學打光 (Three-Point Medical Lighting) 與 dpr={[1, 2]} 行動端效能保護 */}
      <div className="absolute inset-0">
        <ThreeCanvasErrorBoundary>
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0.72, 4.35], fov: 40 }}
            onPointerMissed={() => setActiveRegion(null)}
          >
            {/* 1. 主光 (Key Light)：右前上方柔光 DirectionalLight（自然白 #f8fafc，勾勒肌肉與骨骼立體陰影） */}
            <directionalLight
              position={[3.8, 5.2, 4.2]}
              intensity={1.25}
              color="#f8fafc"
            />

            {/* 2. 補光 (Fill Light)：左前方低強度冷色調 DirectionalLight（淡青白 #bae6fd）搭配微弱 HemisphereLight */}
            <directionalLight
              position={[-3.6, 2.4, 3.2]}
              intensity={0.58}
              color="#bae6fd"
            />
            <hemisphereLight args={['#e0f2fe', '#0f172a', 0.48]} />

            {/* 3. 輪廓背光 (Rim / Back Light)：後方偏上方高對比 DirectionalLight 與 SpotLight（醫療青藍 #38bdf8） */}
            <directionalLight
              position={[0, 4.2, -5.0]}
              intensity={1.45}
              color="#38bdf8"
            />
            <spotLight
              position={[0, 3.8, -4.2]}
              angle={0.55}
              penumbra={0.85}
              intensity={1.15}
              color="#38bdf8"
            />

            <AnatomicalHumanModel3D
              debugHitbox={debugHitbox}
              yOffset={calibYOffset}
              scaleMultiplier={calibScale}
              onModelStatusChange={setModelStatus}
            />

            <ContactShadows
              position={[0, -2.32, 0]}
              opacity={0.5}
              scale={4.8}
              blur={2.5}
              far={4}
              color="#0284c7"
            />
            <CameraController />
          </Canvas>
        </ThreeCanvasErrorBoundary>
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
                請點選 3D 人體分區（共 32 區，含頭頸五官 8 區、乳房、腹部五區、生殖泌尿與肛門直腸），標記深度與不適性質。
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
