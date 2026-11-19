'use client';

import React from 'react';
import { BodyRegionId } from '@/types/cdss';

interface MiniAnatomicalSvgProps {
  regionId: BodyRegionId;
  isSelected?: boolean;
  isActive?: boolean;
}

/**
 * 微型人體輪廓 SVG 示意圖 (Mini Anatomical SVG)
 * - 為 2D 列表中的每一個解剖部位(共 32 區)提供乾淨、直覺的視覺化人體縮圖
 * - 在人體輪廓上以高對比發光色塊精準標示該部位的解剖位置（注意：正面視角下畫面左方為身體右側，畫面右方為身體左側）
 */
export const MiniAnatomicalSvg: React.FC<MiniAnatomicalSvgProps> = ({
  regionId,
  isSelected = false,
  isActive = false,
}) => {
  const highlightColor = isSelected
    ? '#f43f5e' // Rose-500 for marked symptoms
    : isActive
    ? '#22d3ee' // Cyan-400 for active focus
    : '#38bdf8'; // Sky-400 default locator glow

  const renderHighlightOverlay = () => {
    switch (regionId) {
      // ==================== 1. 頭頸與五官 (8 區) ====================
      case 'head_cranial':
        return (
          <path
            d="M17 6.5 C17 3.8, 23 3.8, 23 6.5 L23 8.2 L17 8.2 Z"
            fill={highlightColor}
          />
        );
      case 'eye_orbital':
        return (
          <g fill={highlightColor}>
            <circle cx="18.6" cy="8.2" r="1.2" />
            <circle cx="21.4" cy="8.2" r="1.2" />
          </g>
        );
      case 'ear_auditory':
        return (
          <g fill={highlightColor}>
            <ellipse cx="16.1" cy="8.7" rx="1.1" ry="1.8" />
            <ellipse cx="23.9" cy="8.7" rx="1.1" ry="1.8" />
          </g>
        );
      case 'nose_sinus':
        return <polygon points="20,7.8 18.7,10.2 21.3,10.2" fill={highlightColor} />;
      case 'oral_dental_jaw':
        return (
          <rect x="18.1" y="10.4" width="3.8" height="2.2" rx="1" fill={highlightColor} />
        );
      case 'neck_throat':
        return (
          <rect x="18.5" y="12.9" width="3.0" height="2.6" rx="0.8" fill={highlightColor} />
        );
      case 'face_sensory':
        return (
          <ellipse cx="20" cy="9.4" rx="2.9" ry="2.6" fill={highlightColor} fillOpacity="0.85" />
        );
      case 'neck_cervical_thyroid':
        return (
          <rect x="17.8" y="13.2" width="4.4" height="3.2" rx="1" fill={highlightColor} />
        );

      // ==================== 2. 胸部、乳房與上背 (4 區) ====================
      case 'chest_right':
        return (
          <rect x="15.2" y="16.5" width="4.5" height="6.2" rx="1.2" fill={highlightColor} />
        );
      case 'chest_left':
        return (
          <rect x="20.3" y="16.5" width="4.5" height="6.2" rx="1.2" fill={highlightColor} />
        );
      case 'breast_mammary':
        return (
          <g fill={highlightColor}>
            <circle cx="17.6" cy="19.8" r="2.1" />
            <circle cx="22.4" cy="19.8" r="2.1" />
          </g>
        );
      case 'upper_back':
        return (
          <rect x="15.2" y="16.4" width="9.6" height="6.4" rx="1.5" fill={highlightColor} />
        );

      // ==================== 3. 腹部精細五分區 (5 區) ====================
      case 'abd_ruq':
        return (
          <rect x="15.4" y="23.0" width="4.2" height="3.8" rx="0.9" fill={highlightColor} />
        );
      case 'abd_luq':
        return (
          <rect x="20.4" y="23.0" width="4.2" height="3.8" rx="0.9" fill={highlightColor} />
        );
      case 'abd_epigastric':
        return (
          <circle cx="20" cy="25.6" r="2.4" fill={highlightColor} />
        );
      case 'abd_rlq':
        return (
          <rect x="15.4" y="27.2" width="4.2" height="3.8" rx="0.9" fill={highlightColor} />
        );
      case 'abd_llq':
        return (
          <rect x="20.4" y="27.2" width="4.2" height="3.8" rx="0.9" fill={highlightColor} />
        );

      // ==================== 4. 下背、骨盆與私密排泄區 (5 區) ====================
      case 'lower_back':
        return (
          <rect x="15.6" y="23.8" width="8.8" height="6.2" rx="1.4" fill={highlightColor} />
        );
      case 'pelvis_groin':
        return (
          <path d="M15.5 30.8 L24.5 30.8 L23.2 34.4 L16.8 34.4 Z" fill={highlightColor} />
        );
      case 'buttocks_hip':
        return (
          <g fill={highlightColor}>
            <ellipse cx="17.8" cy="33.0" rx="2.4" ry="2.2" />
            <ellipse cx="22.2" cy="33.0" rx="2.4" ry="2.2" />
          </g>
        );
      case 'urogenital_perineal':
        return <circle cx="20" cy="34.2" r="2.0" fill={highlightColor} />;
      case 'anal_rectal':
        return (
          <g>
            <circle cx="20" cy="34.4" r="1.9" fill={highlightColor} />
            <circle cx="20" cy="34.4" r="0.7" fill="#0f172a" />
          </g>
        );

      // ==================== 5. 上肢 (6 區) ====================
      case 'shoulder_r':
        return <circle cx="13.6" cy="17.6" r="2.2" fill={highlightColor} />;
      case 'shoulder_l':
        return <circle cx="26.4" cy="17.6" r="2.2" fill={highlightColor} />;
      case 'upper_arm_elbow_r':
        return (
          <rect
            x="11.2"
            y="19.5"
            width="2.7"
            height="6.5"
            rx="1.2"
            transform="rotate(10 12.5 22.5)"
            fill={highlightColor}
          />
        );
      case 'upper_arm_elbow_l':
        return (
          <rect
            x="26.1"
            y="19.5"
            width="2.7"
            height="6.5"
            rx="1.2"
            transform="rotate(-10 27.5 22.5)"
            fill={highlightColor}
          />
        );
      case 'forearm_wrist_hand_r':
        return (
          <rect
            x="9.6"
            y="25.8"
            width="2.5"
            height="7.4"
            rx="1.2"
            transform="rotate(12 10.8 29.5)"
            fill={highlightColor}
          />
        );
      case 'forearm_wrist_hand_l':
        return (
          <rect
            x="27.9"
            y="25.8"
            width="2.5"
            height="7.4"
            rx="1.2"
            transform="rotate(-12 29.2 29.5)"
            fill={highlightColor}
          />
        );

      // ==================== 6. 下肢 (4 區) ====================
      case 'thigh_knee_r':
        return (
          <rect x="15.6" y="34.8" width="3.6" height="9.2" rx="1.5" fill={highlightColor} />
        );
      case 'thigh_knee_l':
        return (
          <rect x="20.8" y="34.8" width="3.6" height="9.2" rx="1.5" fill={highlightColor} />
        );
      case 'calf_ankle_foot_r':
        return (
          <rect x="15.8" y="44.2" width="3.3" height="9.8" rx="1.4" fill={highlightColor} />
        );
      case 'calf_ankle_foot_l':
        return (
          <rect x="20.9" y="44.2" width="3.3" height="9.8" rx="1.4" fill={highlightColor} />
        );
      default:
        return <circle cx="20" cy="24" r="3" fill={highlightColor} />;
    }
  };

  return (
    <div
      className={`w-10 h-14 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
        isSelected
          ? 'bg-rose-950/60 border-rose-500/60 shadow-sm shadow-rose-950'
          : isActive
          ? 'bg-cyan-950/60 border-cyan-400/60 shadow-sm shadow-cyan-950'
          : 'bg-slate-950/90 border-slate-800'
      }`}
      title="解剖部位位置示意圖"
    >
      <svg
        viewBox="0 0 40 58"
        className="w-8 h-12 overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 基礎人體輪廓底圖 (Human Silhouette Base) */}
        <g
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="0.9"
          strokeLinejoin="round"
        >
          {/* 頭顱 */}
          <ellipse cx="20" cy="8.5" rx="3.5" ry="4.2" />
          {/* 頸部 */}
          <rect x="18.3" y="12.5" width="3.4" height="3.4" rx="0.8" />
          {/* 軀幹（胸＋腹＋骨盆） */}
          <path d="M14.5 16.2 C14.5 15.5, 25.5 15.5, 25.5 16.2 L24.6 34.5 L15.4 34.5 Z" />
          {/* 右上肢 (畫面左) */}
          <path d="M14.3 16.6 L10.2 32.2 L12.4 32.8 L15.2 19.5 Z" />
          {/* 左上肢 (畫面右) */}
          <path d="M25.7 16.6 L29.8 32.2 L27.6 32.8 L24.8 19.5 Z" />
          {/* 右下肢 (畫面左) */}
          <rect x="15.7" y="34.5" width="3.5" height="19.2" rx="1.5" />
          {/* 左下肢 (畫面右) */}
          <rect x="20.8" y="34.5" width="3.5" height="19.2" rx="1.5" />
        </g>

        {/* 腹部十字參考細線 */}
        <line
          x1="15.5"
          y1="26.8"
          x2="24.5"
          y2="26.8"
          stroke="#334155"
          strokeWidth="0.5"
        />
        <line
          x1="20"
          y1="22.8"
          x2="20"
          y2="31.2"
          stroke="#334155"
          strokeWidth="0.5"
        />

        {/* 高亮解剖部位色塊 */}
        <g className="drop-shadow-[0_0_4px_rgba(34,211,238,0.65)]">
          {renderHighlightOverlay()}
        </g>
      </svg>
    </div>
  );
};
