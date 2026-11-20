'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  Users,
} from 'lucide-react';
import {
  AnatomicalHumanModel3D,
  ModelBoundsInfo,
  ModelGenderVariant,
} from './AnatomicalHumanModel3D';
import { getCanonicalRegionWorldCenter } from '@/lib/bodyRegionSurfaceMap';
import {
  CameraFocusPreset,
  useDiagnosisStore,
} from '@/store/useDiagnosisStore';
import { BODY_REGION_MAP, BODY_GROUP_THEME } from '@/data/bodyRegions';
import { BodyRegionId } from '@/types/cdss';

const FOCUS_PRESET_BUTTONS: Array<{ id: CameraFocusPreset; label: string }> = [
  { id: 'full_body', label: '全身' },
  { id: 'head_neck', label: '頭頸五官' },
  { id: 'chest_abdomen', label: '胸腹軀幹' },
  { id: 'pelvis_legs', label: '骨盆下肢' },
];

const FIVE_THEME_LEGEND = [
  { key: 'head_neck' as const, label: '頭頸五官' },
  { key: 'chest_back' as const, label: '胸背乳房' },
  { key: 'abdomen_five' as const, label: '腹部五區' },
  { key: 'lower_back_pelvis' as const, label: '腰背骨盆' },
  { key: 'upper_limbs' as const, label: '上下肢體' },
];

function CameraController({
  bounds,
  flipCommandSeq,
  presetCommandSeq,
  zoomCommand,
}: {
  bounds: ModelBoundsInfo;
  flipCommandSeq: number;
  presetCommandSeq: number;
  zoomCommand: { seq: number; factor: number };
}) {
  const {
    cameraOrientation,
    cameraFocusPreset,
    cameraResetCount,
    focusedRegionId,
    activeRegionId,
    setCameraOrientation,
  } = useDiagnosisStore();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const orientationRef = useRef(cameraOrientation);

  useEffect(() => {
    orientationRef.current = cameraOrientation;
  }, [cameraOrientation]);

  const animRef = useRef<{
    active: boolean;
    goalPos: THREE.Vector3;
    goalTarget: THREE.Vector3;
  }>({
    active: false,
    goalPos: new THREE.Vector3(0, 0.03, 7.8),
    goalTarget: new THREE.Vector3(0, 0.03, 0),
  });

  // 1. 一鍵區域聚焦 (全身 / 頭頸五官 / 胸腹軀幹 / 骨盆下肢)：依實際 Box3 邊界動態計算焦點與距離，強制切回正面最佳視角
  useEffect(() => {
    const minY = bounds.minY;
    const maxY = bounds.maxY;
    const H = Math.max(0.5, maxY - minY);
    const vFov = THREE.MathUtils.degToRad(40);
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.45);
    const tanHalfFov = Math.tan(vFov / 2);

    if (cameraFocusPreset === 'head_neck') {
      const targetY = minY + H * 0.89;
      const fitH = H * 0.27;
      const dist = Math.max(1.35, fitH / 2 / tanHalfFov);
      animRef.current = {
        active: true,
        goalTarget: new THREE.Vector3(0, targetY, 0.02),
        goalPos: new THREE.Vector3(0, targetY + 0.02, dist),
      };
      return;
    }
    if (cameraFocusPreset === 'chest_abdomen') {
      const targetY = minY + H * 0.62;
      const fitH = H * 0.44;
      const dist = Math.max(2.0, fitH / 2 / tanHalfFov);
      animRef.current = {
        active: true,
        goalTarget: new THREE.Vector3(0, targetY, 0.02),
        goalPos: new THREE.Vector3(0, targetY + 0.03, dist),
      };
      return;
    }
    if (cameraFocusPreset === 'pelvis_legs') {
      const targetY = minY + H * 0.28;
      const fitH = H * 0.64;
      const dist = Math.max(3.2, fitH / 2 / tanHalfFov);
      animRef.current = {
        active: true,
        goalTarget: new THREE.Vector3(0, targetY, 0.0),
        goalPos: new THREE.Vector3(0, targetY + 0.04, dist),
      };
      return;
    }

    const fitHeight = H * 1.28; // 頭頂與腳底各留白約 12%
    const fitWidth = bounds.width * 1.15;
    const distV = fitHeight / 2 / tanHalfFov;
    const distH = fitWidth / 2 / (tanHalfFov * aspect);
    const dist = Math.max(distV, distH);
    const fullTargetY = minY + H * 0.51;

    animRef.current = {
      active: true,
      goalTarget: new THREE.Vector3(0, fullTargetY, 0),
      goalPos: new THREE.Vector3(0, fullTargetY + 0.04, dist),
    };
  }, [
    cameraFocusPreset,
    presetCommandSeq,
    cameraResetCount,
    bounds.minY,
    bounds.maxY,
    bounds.centerY,
    bounds.height,
    bounds.width,
    size.width,
    size.height,
  ]);

  // 1b. 明確點擊「轉背面 / 轉正面」按鈕時才平滑旋轉 180 度（並確保背面視角頭頂有完整留白）
  useEffect(() => {
    if (flipCommandSeq === 0 || !controlsRef.current) return;
    const minY = bounds.minY;
    const maxY = bounds.maxY;
    const H = Math.max(0.5, maxY - minY);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(40) / 2);
    const minFullDist = (H * 1.28) / 2 / tanHalfFov;

    const target = animRef.current.active
      ? animRef.current.goalTarget.clone()
      : controlsRef.current.target.clone();
    const pos = animRef.current.active
      ? animRef.current.goalPos.clone()
      : camera.position.clone();
    const offset = pos.sub(target);
    let horizDist = Math.max(0.45, Math.hypot(offset.x, offset.z));
    if (cameraFocusPreset === 'full_body') {
      target.y = minY + H * 0.51;
      horizDist = Math.max(horizDist, minFullDist);
    }
    const nextSign = orientationRef.current === 'anterior' ? -1 : 1;

    animRef.current = {
      active: true,
      goalTarget: target,
      goalPos: new THREE.Vector3(
        target.x,
        target.y + Math.min(0.15, Math.max(-0.15, offset.y)),
        target.z + nextSign * horizDist
      ),
    };
  }, [flipCommandSeq, camera, cameraFocusPreset, bounds.minY, bounds.maxY]);

  // 2. 動態焦點追蹤：鎖定或點選特定部位時，平滑移動 OrbitControls.target 至該部位中心
  const focusTrackId = focusedRegionId ?? activeRegionId;
  useEffect(() => {
    if (!focusTrackId || !controlsRef.current) return;
    const center = getCanonicalRegionWorldCenter(focusTrackId);
    if (!center) return;

    const targetVec = new THREE.Vector3(center[0], center[1], center[2]);
    const currentOffset = camera.position
      .clone()
      .sub(controlsRef.current.target);
    const clampedLen = Math.max(0.55, Math.min(currentOffset.length(), 4.2));
    currentOffset.normalize().multiplyScalar(clampedLen);

    animRef.current = {
      active: true,
      goalTarget: targetVec,
      goalPos: targetVec.clone().add(currentOffset),
    };
  }, [focusTrackId, camera]);

  // 3. 快捷「＋ 放大 / － 縮小」按鈕平滑縮放（保持對準當前目標焦點）
  useEffect(() => {
    if (zoomCommand.seq === 0 || !controlsRef.current) return;
    const target = animRef.current.active
      ? animRef.current.goalTarget.clone()
      : controlsRef.current.target.clone();
    const pos = animRef.current.active
      ? animRef.current.goalPos.clone()
      : camera.position.clone();
    const offset = pos.sub(target);
    const nextDist = THREE.MathUtils.clamp(
      offset.length() * zoomCommand.factor,
      0.32,
      11.5
    );
    offset.normalize().multiplyScalar(nextDist);
    animRef.current = {
      active: true,
      goalTarget: target,
      goalPos: target.clone().add(offset),
    };
  }, [zoomCommand, camera]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (animRef.current.active) {
      const alpha = Math.min(1, delta * 7.5);
      camera.position.lerp(animRef.current.goalPos, alpha);
      controlsRef.current.target.lerp(animRef.current.goalTarget, alpha);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(animRef.current.goalPos) < 0.012 &&
        controlsRef.current.target.distanceTo(animRef.current.goalTarget) < 0.012
      ) {
        camera.position.copy(animRef.current.goalPos);
        controlsRef.current.target.copy(animRef.current.goalTarget);
        controlsRef.current.update();
        animRef.current.active = false;
      }
    }

    // 即時依攝影機真實空間方位同步正背面標籤，不會觸發鏡頭回彈
    const dx = camera.position.x - controlsRef.current.target.x;
    const dz = camera.position.z - controlsRef.current.target.z;
    const horiz = Math.hypot(dx, dz);
    if (horiz > 0.05) {
      const cosFront = dz / horiz;
      if (cosFront > 0.12 && orientationRef.current !== 'anterior') {
        orientationRef.current = 'anterior';
        setCameraOrientation('anterior');
      } else if (cosFront < -0.12 && orientationRef.current !== 'posterior') {
        orientationRef.current = 'posterior';
        setCameraOrientation('posterior');
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.07}
      enablePan={true}
      screenSpacePanning={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={0.28}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.88}
      minPolarAngle={Math.PI * 0.12}
      onStart={() => {
        animRef.current.active = false;
      }}
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
    contextProfile,
    cameraOrientation,
    cameraFocusPreset,
    setCameraOrientation,
    setCameraFocusPreset,
    triggerCameraReset,
    focusedRegionId,
    activeRegionId,
    hoveredRegionId,
    selectedRegions,
    isFollowUpModalOpen,
    isApiModalOpen,
    setFocusedRegion,
    setActiveRegion,
  } = useDiagnosisStore();

  const [debugHitbox, setDebugHitbox] = useState(false);
  const [showRegionBoundaries, setShowRegionBoundaries] = useState(true);
  const [showOrganXray, setShowOrganXray] = useState(false);
  const [genderOverride, setGenderOverride] = useState<
    'auto' | ModelGenderVariant
  >('auto');
  const [flipCommandSeq, setFlipCommandSeq] = useState(0);
  const [presetCommandSeq, setPresetCommandSeq] = useState(0);
  const [zoomCommand, setZoomCommand] = useState<{
    seq: number;
    factor: number;
  }>({ seq: 0, factor: 1 });

  const [calibYOffset, setCalibYOffset] = useState(0);
  const [calibScale, setCalibScale] = useState(1.0);
  const [modelBounds, setModelBounds] = useState<ModelBoundsInfo>({
    minY: -2.23,
    maxY: 2.29,
    centerY: 0.03,
    height: 4.52,
    width: 2.7,
  });
  const [modelStatus, setModelStatus] = useState<{
    isLoading: boolean;
    progressPct: number;
    usingFallback: boolean;
    resolvedVariant?: 'male' | 'female' | 'default' | 'male_morphed' | 'fallback';
  }>({
    isLoading: false,
    progressPct: 100,
    usingFallback: true,
    resolvedVariant: 'default',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'hitbox') {
        setDebugHitbox(true);
      }
    }
  }, []);

  const effectiveGender: ModelGenderVariant =
    genderOverride === 'auto'
      ? contextProfile.biologicalSex === 'female'
        ? 'female'
        : 'male'
      : genderOverride;

  const cycleGenderOverride = () => {
    setGenderOverride((prev) =>
      prev === 'auto' ? 'male' : prev === 'male' ? 'female' : 'auto'
    );
  };

  const isAnterior = cameraOrientation === 'anterior';
  const hideHtmlLabels = Boolean(
    activeRegionId || isFollowUpModalOpen || isApiModalOpen || extraModalOpen
  );
  const inspectRegion =
    (hoveredRegionId && BODY_REGION_MAP[hoveredRegionId]) ||
    (activeRegionId && BODY_REGION_MAP[activeRegionId]) ||
    null;

  return (
    <div className="relative w-full min-h-[590px] sm:min-h-[670px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* 頂部控制列 1：視角聚焦預設 + 分區色塊 + 透視內臟 + 男女切換 + 正背面翻轉 */}
      <div className="relative z-10 px-3 py-2.5 border-b border-slate-800/80 bg-slate-950/85 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 一鍵區域聚焦列：全身 / 頭頸五官 / 胸腹軀幹 / 骨盆下肢 */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-800 p-1">
            {FOCUS_PRESET_BUTTONS.map((preset) => {
              const active = cameraFocusPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setCameraFocusPreset(preset.id);
                    setCameraOrientation('anterior');
                    setPresetCommandSeq((s) => s + 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* 透視內臟參考開關 */}
            <button
              type="button"
              onClick={() => setShowOrganXray((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                showOrganXray
                  ? 'bg-rose-950/80 text-rose-200 border-rose-400/70 shadow-sm'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
              title="半透明皮膚 X 光透視，顯示心、肺、肝膽、胃、脾、闌尾、腎、膀胱參考定位"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>透視內臟參考</span>
            </button>

            {/* 顯示／隱藏分區色塊開關 */}
            <button
              type="button"
              onClick={() => setShowRegionBoundaries((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                showRegionBoundaries
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60'
                  : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="切換顯示各部位五大主題分區色塊與邊界"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>分區色塊</span>
            </button>

            {/* 男 / 女模型手動預覽切換 */}
            <button
              type="button"
              onClick={cycleGenderOverride}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-slate-700 bg-slate-900/90 text-slate-200 hover:border-cyan-500/50 transition-all cursor-pointer"
              title="切換男／女模型預覽（預設依生理情境卡自動載入）"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {genderOverride === 'auto'
                  ? `模型:${effectiveGender === 'female' ? '女' : '男'}`
                  : genderOverride === 'female'
                  ? '預覽:女'
                  : '預覽:男'}
              </span>
            </button>

            {/* 正背面翻轉 */}
            <button
              type="button"
              onClick={() => setFlipCommandSeq((s) => s + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md transition-all cursor-pointer"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              <span>{isAnterior ? '轉背面' : '轉正面'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCameraFocusPreset('full_body');
                setCameraOrientation('anterior');
                triggerCameraReset();
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="重置全身視角"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 五大主題色塊圖例列 */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-slate-400 font-bold">分區主題配色：</span>
            {FIVE_THEME_LEGEND.map((item) => {
              const theme = BODY_GROUP_THEME[item.key];
              return (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1 text-slate-300 font-medium"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: theme.hex }}
                  />
                  <span>{item.label}</span>
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>已選部位</span>
            </span>
          </div>

          <span className="hidden lg:inline-flex items-center gap-1 text-slate-500">
            <Hand className="w-3 h-3 text-cyan-400" />
            左鍵旋轉・右鍵/雙指平移・滾輪或右側＋/−極限放大
          </span>
        </div>
      </div>

      {/* 開發校準工具列 (?debug=hitbox) */}
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

      {/* 中央獨立 3D 畫布區 */}
      <div className="relative flex-1 min-h-[390px] sm:min-h-[450px]">
        {/* 極簡、無厚重底色的半透明單行角落側別標籤 */}
        <div className="pointer-events-none absolute top-2.5 left-3 z-10 text-[11px] font-bold text-cyan-300/80">
          {isAnterior ? '← 身體右側' : '← 身體左側'} ({isAnterior ? '正面' : '背面'})
        </div>
        <div className="pointer-events-none absolute top-2.5 right-3 z-10 text-[11px] font-bold text-cyan-300/80">
          {isAnterior ? '身體左側 →' : '身體右側 →'}
        </div>

        {/* 右側快捷「＋ 放大 / － 縮小」控制按鈕 */}
        <div className="absolute right-3 bottom-9 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() =>
              setZoomCommand((prev) => ({ seq: prev.seq + 1, factor: 0.65 }))
            }
            className="flex items-center gap-1 rounded-xl border border-cyan-500/40 bg-slate-950/85 hover:bg-cyan-950 px-2.5 py-1.5 text-[11px] font-bold text-cyan-200 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
            title="拉近放大鏡頭（最近可達 0.28 單位）"
          >
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>＋ 放大</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setZoomCommand((prev) => ({ seq: prev.seq + 1, factor: 1.45 }))
            }
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/85 hover:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
            title="拉遠縮小鏡頭"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
            <span>－ 縮小</span>
          </button>
        </div>

        {!modelStatus.isLoading && modelStatus.usingFallback && (
          <div className="pointer-events-none absolute bottom-2 left-3 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400/90">
              <Info className="w-3 h-3 text-cyan-400/80" />
              使用預設輪廓
            </span>
          </div>
        )}

        {/* 兩段式點擊確認條（鎖定部位預覽 -> 再點一次或按按鈕開啟選單） */}
        {focusedRegionId && !activeRegionId && BODY_REGION_MAP[focusedRegionId] && (
          <div className="absolute bottom-2.5 left-3 right-28 sm:right-32 z-20 rounded-xl border border-cyan-400/70 bg-slate-950/92 px-3 py-2 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white truncate">
                已點選：【{BODY_REGION_MAP[focusedRegionId].nameZh}】
                <span className="text-[10px] font-semibold text-cyan-300 ml-1">
                  （{BODY_REGION_MAP[focusedRegionId].groupNameZh}）
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                確認部位無誤後，再點一次該部位即可開啟
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveRegion(focusedRegionId)}
              className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1.5 text-[11px] font-black shrink-0 shadow transition-colors cursor-pointer"
            >
              開啟症狀選單 →
            </button>
          </div>
        )}

        <div className="absolute inset-0">
          <ThreeCanvasErrorBoundary>
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [0, 0.03, 7.8], fov: 40 }}
              onPointerMissed={() => {
                setFocusedRegion(null);
                setActiveRegion(null);
              }}
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
                showOrganXray={showOrganXray}
                modelGender={effectiveGender}
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
              <CameraController
                bounds={modelBounds}
                flipCommandSeq={flipCommandSeq}
                presetCommandSeq={presetCommandSeq}
                zoomCommand={zoomCommand}
              />
            </Canvas>
          </ThreeCanvasErrorBoundary>
        </div>
      </div>

      {/* 底部腹部五分區快捷定位（自動換行） */}
      <div className="relative z-10 p-3 sm:p-3.5 bg-slate-950/90 border-t border-slate-800/90 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-500/90 border-b border-slate-800/60 pb-1.5">
          <span>
            3D Model: MakeHuman base mesh (CC0)
            {modelStatus.resolvedVariant === 'male_morphed' &&
              '・男性解剖變形模式（放入 human_body_male.glb 可替換獨立模型）'}
            {modelStatus.resolvedVariant === 'default' && '・標準女性體態'}
          </span>
          <span className="text-slate-400">
            點擊部位一次鎖定預覽，再點一次開啟選單
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mr-1">
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-950'
                    : isAct
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800'
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
                點選 3D 人體分區（共 32 區），支援放大檢視五官關節與透視內臟參考。
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
