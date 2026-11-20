import { BodyRegionId } from '@/types/cdss';

/**
 * 32 個解剖分區與 Shader 整數索引 (0 ~ 31) 對照表
 * - 0..7   : 頭頸與五官 (Theme 0: Cyan #06b6d4)
 * - 8..11  : 胸部、乳房與上背 (Theme 1: Blue #3b82f6)
 * - 12..16 : 腹部精細五分區 (Theme 2: Amber #fbbf24)
 * - 17..21 : 下背、骨盆與私密排泄 (Theme 3: Rose #f43f5e)
 * - 22..31 : 上肢與下肢左右對稱區 (Theme 4: Emerald #10b981)
 */
export const REGION_INDEX_ORDER: BodyRegionId[] = [
  // 0..7 頭頸五官
  'head_cranial',          // 0
  'eye_orbital',           // 1
  'ear_auditory',          // 2
  'nose_sinus',            // 3
  'oral_dental_jaw',       // 4
  'face_sensory',          // 5
  'neck_throat',           // 6
  'neck_cervical_thyroid', // 7
  // 8..11 胸背乳房
  'chest_right',           // 8
  'chest_left',            // 9
  'breast_mammary',        // 10
  'upper_back',            // 11
  // 12..16 腹部五區
  'abd_ruq',               // 12
  'abd_epigastric',        // 13
  'abd_luq',               // 14
  'abd_rlq',               // 15
  'abd_llq',               // 16
  // 17..21 下背、骨盆與私密排泄
  'lower_back',            // 17
  'pelvis_groin',          // 18
  'urogenital_perineal',   // 19
  'buttocks_hip',          // 20
  'anal_rectal',           // 21
  // 22..31 上肢與下肢
  'shoulder_r',            // 22
  'shoulder_l',            // 23
  'upper_arm_elbow_r',     // 24
  'upper_arm_elbow_l',     // 25
  'forearm_wrist_hand_r',  // 26
  'forearm_wrist_hand_l',  // 27
  'thigh_knee_r',          // 28
  'thigh_knee_l',          // 29
  'calf_ankle_foot_r',     // 30
  'calf_ankle_foot_l',     // 31
];

export const REGION_TO_SHADER_INDEX: Record<BodyRegionId, number> =
  REGION_INDEX_ORDER.reduce((acc, id, idx) => {
    acc[id] = idx;
    return acc;
  }, {} as Record<BodyRegionId, number>);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * TypeScript 端與 GLSL Shader 完全一致的「有機解剖曲線 (Organic SDF)」32 區座標分類器
 * @param nx 相對於身高之 X 座標（-X 為解剖學右側，+X 為解剖學左側）
 * @param ny 正規化高度（0.0 = 腳底，1.0 = 頭頂）
 * @param nz 相對於身高之 Z 座標（+Z 為正面，-Z 為背面）
 * @param nrmZ 表面法線 Z 分量（> 0 屬正面朝向，<= 0 屬背面朝向）
 */
export function classifyBodyPointToRegion(
  nx: number,
  ny: number,
  nz: number,
  nrmZ: number
): BodyRegionId {
  const ax = Math.abs(nx);

  // 1. 頭頸與五官細分區 (ny >= 0.825) — 全面採用平滑橢圓、水滴與弧線 SDF
  if (ny >= 0.825) {
    // 雙側耳廓：貼合耳部的直立平滑橢圓
    const dEar = Math.hypot((ax - 0.044) / 0.0135, (ny - 0.922) / 0.022);
    if (ax > 0.034 && dEar <= 1.0) {
      return 'ear_auditory';
    }

    // 髮際線弧度：前額中央較高，向兩側太陽穴與頭頂平滑彎曲
    const hairlineY = 0.955 + 0.011 * Math.cos(Math.min(ax * 38.0, Math.PI)) - Math.max(0, 0.015 - nz) * 0.65;
    if (ny >= hairlineY || (nrmZ < -0.15 && ny >= 0.888)) {
      return 'head_cranial';
    }

    // 下顎弧線：下巴中央較低，向耳下弧形上揚
    const jawCurveY = 0.885 + 1.85 * nx * nx;
    if (ny < jawCurveY) {
      // 前頸咽喉：平滑倒水滴 / 垂直橢圓
      const dThroat = Math.hypot(nx / 0.021, (ny - 0.854) / 0.032);
      if (nrmZ > 0.08 && dThroat <= 1.0) {
        return 'neck_throat';
      }
      return 'neck_cervical_thyroid';
    }

    // 顏面正面五官有機輪廓
    if (nrmZ > 0.12) {
      // 眼眶：左右對稱水平杏仁 / 橢圓形
      const dEye = Math.hypot((ax - 0.0195) / 0.0135, (ny - 0.935) / 0.0085);
      if (dEye <= 1.0) {
        return 'eye_orbital';
      }

      // 鼻與鼻竇：眉心至鼻翼的柔和垂直水滴 / 圓角梯形
      const noseT = clamp01((0.938 - ny) / 0.025);
      const noseHalfW = 0.0085 + 0.006 * noseT;
      const dNoseY = Math.abs(ny - 0.929) / 0.0175;
      const dNoseX = ax / noseHalfW;
      if (Math.pow(dNoseX, 2.2) + Math.pow(dNoseY, 2.6) <= 1.0) {
        return 'nose_sinus';
      }

      // 口腔與下顎：順應嘴唇與下巴的柔和弧形橢圓
      const dOral = Math.hypot(nx / 0.0245, (ny - 0.899) / 0.0135);
      if (dOral <= 1.0) {
        return 'oral_dental_jaw';
      }
    }

    return 'face_sensory';
  }

  // 2. 上肢（依 A-pose 斜向肩線弧度與寬度區分）
  const shoulderBoundaryX =
    0.095 + 0.032 * clamp01((ny - 0.66) / 0.15);
  if (ax > shoulderBoundaryX && ny >= 0.455) {
    const isRight = nx < 0;
    const armDiag = ny - 0.72 * (ax - 0.1);
    if (armDiag >= 0.56) {
      return isRight ? 'shoulder_r' : 'shoulder_l';
    }
    if (armDiag >= 0.39) {
      return isRight ? 'upper_arm_elbow_r' : 'upper_arm_elbow_l';
    }
    return isRight ? 'forearm_wrist_hand_r' : 'forearm_wrist_hand_l';
  }

  // 3. 軀幹與骨盆（有機肋弓弧線、盾形中上腹、倒三角會陰）
  if (ny >= 0.455) {
    const isRight = nx < 0;
    // 肋弓下緣弧線（劍突最高 0.692，向兩側肋緣弧形下降）
    const ribArchY = 0.692 - 2.6 * nx * nx;
    // 骨盆髂嵴 V 型弧線（恥骨聯合處較低，向兩側髂嵴上揚）
    const pelvicCrestY = 0.562 + 3.1 * nx * nx;

    if (nrmZ >= -0.05) {
      if (ny >= ribArchY) {
        // 雙側乳房與乳暈：平滑橢圓輪廓
        const dBreast = Math.hypot((ax - 0.044) / 0.029, (ny - 0.742) / 0.031);
        if (dBreast <= 1.0) {
          return 'breast_mammary';
        }
        return isRight ? 'chest_right' : 'chest_left';
      }

      if (ny >= pelvicCrestY) {
        // 中上腹與肚臍：柔和盾形／垂直橢圓
        const dEpi = Math.hypot(nx / 0.033, (ny - 0.642) / 0.045);
        if (dEpi <= 1.0) {
          return 'abd_epigastric';
        }
        // 上下腹分界弧線
        const midAbdY = 0.62 + 0.65 * nx * nx;
        if (ny >= midAbdY) {
          return isRight ? 'abd_ruq' : 'abd_luq';
        }
        return isRight ? 'abd_rlq' : 'abd_llq';
      }

      // 骨盆與會陰：符合解剖的倒三角形／柔和 V 型弧線
      const perinealVTop = 0.525 - 1.55 * ax;
      if ((ny <= perinealVTop && ax <= 0.036) || (ny <= 0.482 && ax <= 0.030)) {
        return 'urogenital_perineal';
      }
      return 'pelvis_groin';
    } else {
      // 背面軀幹：順應肩胛下角與腰椎弧線
      const backMidY = 0.692 - 1.4 * nx * nx;
      const gluteTopY = 0.562 + 0.85 * nx * nx;
      if (ny >= backMidY) {
        return 'upper_back';
      }
      if (ny >= gluteTopY) {
        return 'lower_back';
      }
      const dAnal = Math.hypot(nx / 0.021, (ny - 0.495) / 0.033);
      if (nrmZ < -0.2 && dAnal <= 1.0) {
        return 'anal_rectal';
      }
      return 'buttocks_hip';
    }
  }

  // 4. 下肢 (ny < 0.455)：順應膝關節弧線分界
  const isRightLeg = nx < 0;
  const kneeArchY = 0.275 + 0.45 * Math.pow(ax - 0.05, 2);
  if (ny >= kneeArchY) {
    return isRightLeg ? 'thigh_knee_r' : 'thigh_knee_l';
  }
  return isRightLeg ? 'calf_ankle_foot_r' : 'calf_ankle_foot_l';
}

/**
 * 取得 32 個分區在世界空間（已包含 rootGroupRef y = -0.48 位移）的標準中心點，
 * 供鏡頭動態焦點追蹤與懸停浮動標籤定位。
 */
export function getCanonicalRegionWorldCenter(
  regionId: BodyRegionId
): [number, number, number] {
  const map: Record<BodyRegionId, [number, number, number]> = {
    head_cranial: [0, 2.15, 0.0],
    eye_orbital: [0, 1.99, 0.24],
    ear_auditory: [-0.21, 1.94, 0.0],
    nose_sinus: [0, 1.96, 0.29],
    oral_dental_jaw: [0, 1.84, 0.25],
    face_sensory: [0.11, 1.93, 0.22],
    neck_throat: [0, 1.65, 0.12],
    neck_cervical_thyroid: [0, 1.66, -0.14],

    chest_right: [-0.25, 1.18, 0.26],
    chest_left: [0.25, 1.18, 0.26],
    breast_mammary: [0.18, 1.11, 0.3],
    upper_back: [0, 1.24, -0.26],

    abd_ruq: [-0.2, 0.72, 0.26],
    abd_epigastric: [0, 0.66, 0.3],
    abd_luq: [0.2, 0.72, 0.26],
    abd_rlq: [-0.18, 0.44, 0.26],
    abd_llq: [0.18, 0.44, 0.26],

    lower_back: [0, 0.62, -0.24],
    pelvis_groin: [0, 0.16, 0.26],
    urogenital_perineal: [0, -0.02, 0.2],
    buttocks_hip: [0, 0.05, -0.32],
    anal_rectal: [0, -0.02, -0.24],

    shoulder_r: [-0.72, 1.08, 0.04],
    shoulder_l: [0.72, 1.08, 0.04],
    upper_arm_elbow_r: [-1.02, 0.62, 0.1],
    upper_arm_elbow_l: [1.02, 0.62, 0.1],
    forearm_wrist_hand_r: [-1.26, 0.12, 0.12],
    forearm_wrist_hand_l: [1.26, 0.12, 0.12],

    thigh_knee_r: [-0.24, -0.58, 0.08],
    thigh_knee_l: [0.24, -0.58, 0.08],
    calf_ankle_foot_r: [-0.28, -1.52, 0.04],
    calf_ankle_foot_l: [0.28, -1.52, 0.04],
  };
  return map[regionId] || [0, 0.5, 0];
}

/**
 * 與 `classifyBodyPointToRegion` 100% 數學等價的 GLSL Fragment Shader 分類器
 * - 全部採用有機解剖曲線與 SDF 距離場（完全無直角矩形）
 * - 同時輸出 `borderDist`，用於在所有曲線交界處繪製平滑銳利的分界線
 */
export const GLSL_REGION_CLASSIFIER_CHUNK = /* glsl */ `
void evalBodyRegion(vec3 normCoord, float nrmZ, out int regionId, out int themeId, out float borderDist) {
  float nx = normCoord.x;
  float ny = normCoord.y;
  float nz = normCoord.z;
  float ax = abs(nx);
  borderDist = 1.0;

  // 1. 頭頸與五官 (ny >= 0.825)
  if (ny >= 0.825) {
    themeId = 0;
    borderDist = min(borderDist, abs(ny - 0.825));

    float dEar = length(vec2((ax - 0.044) / 0.0135, (ny - 0.922) / 0.022));
    if (ax > 0.034 && dEar <= 1.0) {
      regionId = 2; // ear_auditory
      borderDist = min(borderDist, (1.0 - dEar) * 0.013);
      return;
    }

    float hairlineY = 0.955 + 0.011 * cos(min(ax * 38.0, 3.14159)) - max(0.0, 0.015 - nz) * 0.65;
    if (ny >= hairlineY || (nrmZ < -0.15 && ny >= 0.888)) {
      regionId = 0; // head_cranial
      if (ny >= hairlineY) {
        borderDist = min(borderDist, abs(ny - hairlineY));
      } else {
        borderDist = min(borderDist, abs(ny - 0.888));
      }
      return;
    }

    float jawCurveY = 0.885 + 1.85 * nx * nx;
    if (ny < jawCurveY) {
      borderDist = min(borderDist, abs(jawCurveY - ny));
      float dThroat = length(vec2(nx / 0.021, (ny - 0.854) / 0.032));
      if (nrmZ > 0.08 && dThroat <= 1.0) {
        regionId = 6; // neck_throat
        borderDist = min(borderDist, (1.0 - dThroat) * 0.020);
        return;
      }
      regionId = 7; // neck_cervical_thyroid
      if (nrmZ > 0.08) {
        borderDist = min(borderDist, max(0.0, dThroat - 1.0) * 0.020);
      }
      return;
    }

    borderDist = min(borderDist, abs(ny - jawCurveY));
    borderDist = min(borderDist, abs(hairlineY - ny));

    if (nrmZ > 0.12) {
      float dEye = length(vec2((ax - 0.0195) / 0.0135, (ny - 0.935) / 0.0085));
      if (dEye <= 1.0) {
        regionId = 1; // eye_orbital
        borderDist = min(borderDist, (1.0 - dEye) * 0.0085);
        return;
      }

      float noseT = clamp((0.938 - ny) / 0.025, 0.0, 1.0);
      float noseHalfW = 0.0085 + 0.006 * noseT;
      float dNoseY = abs(ny - 0.929) / 0.0175;
      float dNoseX = ax / noseHalfW;
      float dNose = pow(dNoseX, 2.2) + pow(dNoseY, 2.6);
      if (dNose <= 1.0) {
        regionId = 3; // nose_sinus
        borderDist = min(borderDist, (1.0 - sqrt(dNose)) * 0.011);
        return;
      }

      float dOral = length(vec2(nx / 0.0245, (ny - 0.899) / 0.0135));
      if (dOral <= 1.0) {
        regionId = 4; // oral_dental_jaw
        borderDist = min(borderDist, (1.0 - dOral) * 0.0135);
        return;
      }

      borderDist = min(borderDist, max(0.0, dEye - 1.0) * 0.0085);
      borderDist = min(borderDist, max(0.0, sqrt(dNose) - 1.0) * 0.011);
      borderDist = min(borderDist, max(0.0, dOral - 1.0) * 0.0135);
    }

    if (ax > 0.028) {
      borderDist = min(borderDist, max(0.0, dEar - 1.0) * 0.013);
    }
    regionId = 5; // face_sensory
    return;
  }

  // 2. 上肢 (主題 4: Emerald)
  float shoulderBoundaryX = 0.095 + 0.032 * clamp((ny - 0.66) / 0.15, 0.0, 1.0);
  if (ax > shoulderBoundaryX && ny >= 0.455) {
    themeId = 4;
    borderDist = min(borderDist, ax - shoulderBoundaryX);
    float armDiag = ny - 0.72 * (ax - 0.1);
    if (armDiag >= 0.56) {
      regionId = (nx < 0.0) ? 22 : 23;
      borderDist = min(borderDist, armDiag - 0.56);
    } else if (armDiag >= 0.39) {
      regionId = (nx < 0.0) ? 24 : 25;
      borderDist = min(borderDist, min(0.56 - armDiag, armDiag - 0.39));
    } else {
      regionId = (nx < 0.0) ? 26 : 27;
      borderDist = min(borderDist, 0.39 - armDiag);
    }
    return;
  }

  // 3. 軀幹與骨盆 (有機肋弓、盾形中上腹、倒三角會陰)
  if (ny >= 0.455) {
    float ribArchY = 0.692 - 2.6 * nx * nx;
    float pelvicCrestY = 0.562 + 3.1 * nx * nx;
    borderDist = min(borderDist, abs(ny - 0.455));
    if (ny > 0.52) {
      borderDist = min(borderDist, shoulderBoundaryX - ax);
    }

    if (nrmZ >= -0.05) {
      if (ny >= ribArchY) {
        themeId = 1;
        borderDist = min(borderDist, abs(ny - ribArchY));
        borderDist = min(borderDist, abs(0.825 - ny));
        float dBreast = length(vec2((ax - 0.044) / 0.029, (ny - 0.742) / 0.031));
        if (dBreast <= 1.0) {
          regionId = 10; // breast_mammary
          borderDist = min(borderDist, (1.0 - dBreast) * 0.029);
          return;
        }
        borderDist = min(borderDist, max(0.0, dBreast - 1.0) * 0.029);
        borderDist = min(borderDist, ax);
        regionId = (nx < 0.0) ? 8 : 9;
        return;
      }

      if (ny >= pelvicCrestY) {
        themeId = 2;
        borderDist = min(borderDist, abs(ribArchY - ny));
        borderDist = min(borderDist, abs(ny - pelvicCrestY));
        float dEpi = length(vec2(nx / 0.033, (ny - 0.642) / 0.045));
        if (dEpi <= 1.0) {
          regionId = 13; // abd_epigastric
          borderDist = min(borderDist, (1.0 - dEpi) * 0.033);
          return;
        }
        borderDist = min(borderDist, max(0.0, dEpi - 1.0) * 0.033);
        borderDist = min(borderDist, ax);
        float midAbdY = 0.62 + 0.65 * nx * nx;
        borderDist = min(borderDist, abs(ny - midAbdY));
        if (ny >= midAbdY) {
          regionId = (nx < 0.0) ? 12 : 14;
        } else {
          regionId = (nx < 0.0) ? 15 : 16;
        }
        return;
      }

      themeId = 3;
      borderDist = min(borderDist, abs(pelvicCrestY - ny));
      float perinealVTop = 0.525 - 1.55 * ax;
      bool inPerineal = ((ny <= perinealVTop && ax <= 0.036) || (ny <= 0.482 && ax <= 0.030));
      if (inPerineal) {
        regionId = 19; // genital_perineal
        borderDist = min(borderDist, abs(perinealVTop - ny));
        return;
      }
      if (ax <= 0.042) {
        borderDist = min(borderDist, abs(ny - perinealVTop));
      }
      regionId = 18; // pelvis_groin
      return;
    } else {
      float backMidY = 0.692 - 1.4 * nx * nx;
      float gluteTopY = 0.562 + 0.85 * nx * nx;
      if (ny >= backMidY) {
        themeId = 1;
        regionId = 11; // upper_back
        borderDist = min(borderDist, abs(ny - backMidY));
        return;
      }
      themeId = 3;
      if (ny >= gluteTopY) {
        regionId = 17; // lower_back
        borderDist = min(borderDist, min(abs(backMidY - ny), abs(ny - gluteTopY)));
        return;
      }
      float dAnal = length(vec2(nx / 0.021, (ny - 0.495) / 0.033));
      if (nrmZ < -0.20 && dAnal <= 1.0) {
        regionId = 21; // anal_rectal
        borderDist = min(borderDist, (1.0 - dAnal) * 0.021);
        return;
      }
      regionId = 20; // buttocks_hip
      borderDist = min(borderDist, abs(gluteTopY - ny));
      if (nrmZ < -0.20) {
        borderDist = min(borderDist, max(0.0, dAnal - 1.0) * 0.021);
      }
      return;
    }
  }

  // 4. 下肢 (ny < 0.455)
  themeId = 4;
  borderDist = min(borderDist, 0.455 - ny);
  float kneeArchY = 0.275 + 0.45 * pow(ax - 0.05, 2.0);
  if (ny >= kneeArchY) {
    regionId = (nx < 0.0) ? 28 : 29;
    borderDist = min(borderDist, ny - kneeArchY);
  } else {
    regionId = (nx < 0.0) ? 30 : 31;
    borderDist = min(borderDist, kneeArchY - ny);
  }
}

void classifyBodySurface(vec3 normCoord, float nrmZ, out int regionId, out int themeId, out float borderDist) {
  evalBodyRegion(normCoord, nrmZ, regionId, themeId, borderDist);

  // 僅於正面與背面實際交界處補細線，不干擾既有曲線
  if (abs(nrmZ + 0.05) < 0.04 && normCoord.y >= 0.455 && normCoord.y < 0.825) {
    borderDist = min(borderDist, abs(nrmZ + 0.05) * 0.04);
  }
}
`;
