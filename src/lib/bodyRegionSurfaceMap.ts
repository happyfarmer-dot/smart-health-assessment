import { BodyRegionId } from '@/types/cdss';

/**
 * 32 個解剖分區與 Shader 整數索引 (0 ~ 31) 對照表
 * - 0..7   : 頭頸與五官 (Theme 0: Cyan #06b6d4)
 * - 8..11  : 胸部、乳房與上背 (Theme 1: Blue #3b82f6)
 * - 12..16 : 腹部精細五分區 (Theme 2: Amber #f59e0b)
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
  'abd_luq',               // 13
  'abd_epigastric',        // 14
  'abd_rlq',               // 15
  'abd_llq',               // 16
  // 17..21 下背骨盆私密
  'lower_back',            // 17
  'pelvis_groin',          // 18
  'buttocks_hip',          // 19
  'urogenital_perineal',   // 20
  'anal_rectal',           // 21
  // 22..31 上下肢體
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

/**
 * 依據正規化身體座標 (nx, ny, nz) 與表面法線 Z 分量 nrmZ 判定所屬解剖分區。
 * 座標基準（對應正規化後高 4.52 單位、腳底 y = -1.75、頭頂 y = +2.77 之模型）：
 * - ny = (localY + 1.75) / 4.52  ∈ [0.0, 1.0]
 * - nx = localX / 4.52           （右側為負、左側為正）
 * - nz = localZ / 4.52           （正面朝 +Z、背面朝 -Z）
 *
 * 注意：此函式與下方 GLSL_CLASSIFY_BODY_REGION 保持完全一致，確保「看到哪裡、點到哪裡」。
 */
export function classifyBodyPointToRegion(
  nx: number,
  ny: number,
  nz: number,
  nrmZ: number
): BodyRegionId {
  const ax = Math.abs(nx);

  // 1. 頭頸與五官 (ny >= 0.825)
  if (ny >= 0.878) {
    if (ny >= 0.955 || nrmZ < -0.05) {
      return 'head_cranial';
    }
    if (ax >= 0.041 && ny >= 0.905 && ny <= 0.955 && nz < 0.008) {
      return 'ear_auditory';
    }
    if (ny >= 0.922 && ny <= 0.947 && ax >= 0.009 && ax <= 0.039 && nz > 0.002) {
      return 'eye_orbital';
    }
    if (ny >= 0.905 && ny <= 0.938 && ax < 0.011 && nz > 0.005) {
      return 'nose_sinus';
    }
    if (ny < 0.906 && ax < 0.027 && nz > -0.012) {
      return 'oral_dental_jaw';
    }
    return 'face_sensory';
  }

  if (ny >= 0.825 && ax < 0.062) {
    if (nrmZ > 0.25 && ax < 0.025 && nz > -0.025) {
      return 'neck_throat';
    }
    return 'neck_cervical_thyroid';
  }

  // 2. 上肢（肩關節、上臂手肘、前臂手腕與手掌）
  const armThresh =
    ny >= 0.76
      ? 0.086
      : ny >= 0.72
      ? 0.086 + ((0.76 - ny) / 0.04) * 0.029
      : 0.115;

  if (ny >= 0.54 && ax >= armThresh) {
    if (ax < 0.145 || ny >= 0.775) {
      return nx < 0 ? 'shoulder_r' : 'shoulder_l';
    }
    if (ax < 0.215) {
      return nx < 0 ? 'upper_arm_elbow_r' : 'upper_arm_elbow_l';
    }
    return nx < 0 ? 'forearm_wrist_hand_r' : 'forearm_wrist_hand_l';
  }

  // 3. 軀幹背面與正面
  if (ny >= 0.455) {
    if (nrmZ < -0.08) {
      if (ny >= 0.68) return 'upper_back';
      if (ny >= 0.54) return 'lower_back';
      if (ny < 0.505 && ax < 0.028) return 'anal_rectal';
      return 'buttocks_hip';
    }

    // 胸部與乳房區
    if (ny >= 0.712) {
      if (ny < 0.762 && ax < 0.072) {
        return 'breast_mammary';
      }
      return nx < 0 ? 'chest_right' : 'chest_left';
    }

    // 腹部精細五分區
    if (ny >= 0.575) {
      if (ny >= 0.648) {
        if (nx < -0.024) return 'abd_ruq';
        if (nx > 0.024) return 'abd_luq';
        return 'abd_epigastric';
      }
      if (ny >= 0.616 && ax <= 0.028) {
        return 'abd_epigastric';
      }
      return nx < 0 ? 'abd_rlq' : 'abd_llq';
    }

    // 骨盆與生殖泌尿會陰
    if (ny < 0.515 && ax < 0.036) {
      return 'urogenital_perineal';
    }
    return 'pelvis_groin';
  }

  // 4. 下肢與臀部下緣
  if (ny >= 0.44 && nrmZ < -0.15) {
    return 'buttocks_hip';
  }
  if (ny >= 0.235) {
    return nx < 0 ? 'thigh_knee_r' : 'thigh_knee_l';
  }
  return nx < 0 ? 'calf_ankle_foot_r' : 'calf_ankle_foot_l';
}

/**
 * 對應上述 32 區在世界空間（含根節點 y = -0.48）之對焦中心點，供動態焦點追蹤使用
 */
const CANONICAL_REGION_NORM_CENTERS: Record<
  BodyRegionId,
  [number, number, number]
> = {
  head_cranial: [0, 0.96, -0.02],
  eye_orbital: [0, 0.935, 0.03],
  ear_auditory: [0, 0.93, -0.02],
  nose_sinus: [0, 0.92, 0.04],
  oral_dental_jaw: [0, 0.892, 0.03],
  face_sensory: [0, 0.918, 0.02],
  neck_throat: [0, 0.852, 0.01],
  neck_cervical_thyroid: [0, 0.85, -0.03],

  chest_right: [-0.045, 0.775, 0.02],
  chest_left: [0.045, 0.775, 0.02],
  breast_mammary: [0, 0.738, 0.03],
  upper_back: [0, 0.745, -0.07],

  abd_ruq: [-0.045, 0.68, 0.02],
  abd_luq: [0.045, 0.68, 0.02],
  abd_epigastric: [0, 0.665, 0.03],
  abd_rlq: [-0.045, 0.61, 0.02],
  abd_llq: [0.045, 0.61, 0.02],

  lower_back: [0, 0.61, -0.07],
  pelvis_groin: [0, 0.535, 0.01],
  buttocks_hip: [0, 0.49, -0.08],
  urogenital_perineal: [0, 0.485, 0.01],
  anal_rectal: [0, 0.48, -0.05],

  shoulder_r: [-0.115, 0.79, -0.03],
  shoulder_l: [0.115, 0.79, -0.03],
  upper_arm_elbow_r: [-0.18, 0.695, -0.04],
  upper_arm_elbow_l: [0.18, 0.695, -0.04],
  forearm_wrist_hand_r: [-0.255, 0.59, 0.01],
  forearm_wrist_hand_l: [0.255, 0.59, 0.01],

  thigh_knee_r: [-0.085, 0.35, -0.02],
  thigh_knee_l: [0.085, 0.35, -0.02],
  calf_ankle_foot_r: [-0.125, 0.12, -0.01],
  calf_ankle_foot_l: [0.125, 0.12, -0.01],
};

export function getCanonicalRegionWorldCenter(
  regionId: BodyRegionId
): [number, number, number] {
  const [nx, ny, nz] = CANONICAL_REGION_NORM_CENTERS[regionId] || [0, 0.5, 0];
  return [nx * 4.52, -1.75 + ny * 4.52 - 0.48, nz * 4.52];
}

/**
 * GLSL 逐像素 (Per-Fragment) 分區判定與相鄰交界描邊函式
 * 與 TypeScript classifyBodyPointToRegion 完全同步。
 */
export const GLSL_REGION_CLASSIFIER_CHUNK = /* glsl */ `
void classifyBodySurface(
  vec3 normCoord,
  float nrmZ,
  out int regionId,
  out int themeId,
  out float borderDist
) {
  float nx = normCoord.x;
  float ny = normCoord.y;
  float nz = normCoord.z;
  float ax = abs(nx);
  borderDist = 1.0;

  // 1. 頭頸與五官 (ny >= 0.825)
  if (ny >= 0.878) {
    themeId = 0;
    borderDist = min(borderDist, abs(ny - 0.878));
    if (ny >= 0.955 || nrmZ < -0.05) {
      regionId = 0; // head_cranial
      borderDist = min(borderDist, abs(ny - 0.955));
      borderDist = min(borderDist, abs(nrmZ + 0.05) * 0.12);
      return;
    }
    if (ax >= 0.041 && ny >= 0.905 && ny <= 0.955 && nz < 0.008) {
      regionId = 2; // ear_auditory
      borderDist = min(borderDist, abs(ax - 0.041));
      borderDist = min(borderDist, abs(ny - 0.905));
      borderDist = min(borderDist, abs(ny - 0.955));
      return;
    }
    if (ny >= 0.922 && ny <= 0.947 && ax >= 0.009 && ax <= 0.039 && nz > 0.002) {
      regionId = 1; // eye_orbital
      borderDist = min(borderDist, abs(ny - 0.922));
      borderDist = min(borderDist, abs(ny - 0.947));
      borderDist = min(borderDist, abs(ax - 0.009));
      borderDist = min(borderDist, abs(ax - 0.039));
      return;
    }
    if (ny >= 0.905 && ny <= 0.938 && ax < 0.011 && nz > 0.005) {
      regionId = 3; // nose_sinus
      borderDist = min(borderDist, abs(ny - 0.905));
      borderDist = min(borderDist, abs(ny - 0.938));
      borderDist = min(borderDist, abs(ax - 0.011));
      return;
    }
    if (ny < 0.906 && ax < 0.027 && nz > -0.012) {
      regionId = 4; // oral_dental_jaw
      borderDist = min(borderDist, abs(ny - 0.906));
      borderDist = min(borderDist, abs(ax - 0.027));
      return;
    }
    regionId = 5; // face_sensory (填補五官周圍所有臉部區域)
    borderDist = min(borderDist, abs(ny - 0.955));
    if (ny >= 0.922 && ny <= 0.947 && nz > 0.002) {
      borderDist = min(borderDist, min(abs(ax - 0.009), abs(ax - 0.039)));
    }
    if (ny >= 0.905 && ny <= 0.938 && nz > 0.005) {
      borderDist = min(borderDist, abs(ax - 0.011));
    }
    if (ny < 0.906 && nz > -0.012) {
      borderDist = min(borderDist, abs(ax - 0.027));
    }
    return;
  }

  if (ny >= 0.825 && ax < 0.062) {
    themeId = 0;
    borderDist = min(borderDist, abs(ny - 0.825));
    borderDist = min(borderDist, abs(ny - 0.878));
    borderDist = min(borderDist, abs(ax - 0.062));
    if (nrmZ > 0.25 && ax < 0.025 && nz > -0.025) {
      regionId = 6; // neck_throat
      borderDist = min(borderDist, abs(ax - 0.025));
      return;
    }
    regionId = 7; // neck_cervical_thyroid
    if (nrmZ > 0.25 && nz > -0.025) {
      borderDist = min(borderDist, abs(ax - 0.025));
    }
    return;
  }

  // 2. 上肢（肩關節、上臂手肘、前臂手腕與手掌）
  float armThresh = ny >= 0.76
    ? 0.086
    : (ny >= 0.72 ? 0.086 + ((0.76 - ny) / 0.04) * 0.029 : 0.115);

  if (ny >= 0.54 && ax >= armThresh) {
    themeId = 4;
    borderDist = min(borderDist, abs(ax - armThresh));
    if (ax < 0.145 || ny >= 0.775) {
      regionId = nx < 0.0 ? 22 : 23; // shoulder_r / l
      if (ny < 0.775) borderDist = min(borderDist, abs(ax - 0.145));
      return;
    }
    if (ax < 0.215) {
      regionId = nx < 0.0 ? 24 : 25; // upper_arm_elbow_r / l
      borderDist = min(borderDist, abs(ax - 0.145));
      borderDist = min(borderDist, abs(ax - 0.215));
      return;
    }
    regionId = nx < 0.0 ? 26 : 27; // forearm_wrist_hand_r / l
    borderDist = min(borderDist, abs(ax - 0.215));
    return;
  }

  // 3. 軀幹背面與正面
  if (ny >= 0.455) {
    borderDist = min(borderDist, abs(ax - armThresh));
    borderDist = min(borderDist, abs(ny - 0.455));

    if (nrmZ < -0.08) {
      borderDist = min(borderDist, abs(nrmZ + 0.08) * 0.12);
      if (ny >= 0.68) {
        regionId = 11; // upper_back
        themeId = 1;
        borderDist = min(borderDist, abs(ny - 0.68));
        borderDist = min(borderDist, abs(ny - 0.825));
        return;
      }
      if (ny >= 0.54) {
        regionId = 17; // lower_back
        themeId = 3;
        borderDist = min(borderDist, abs(ny - 0.68));
        borderDist = min(borderDist, abs(ny - 0.54));
        return;
      }
      themeId = 3;
      if (ny < 0.505 && ax < 0.028) {
        regionId = 21; // anal_rectal
        borderDist = min(borderDist, abs(ny - 0.505));
        borderDist = min(borderDist, abs(ax - 0.028));
        return;
      }
      regionId = 19; // buttocks_hip
      borderDist = min(borderDist, abs(ny - 0.54));
      if (ny < 0.505) borderDist = min(borderDist, abs(ax - 0.028));
      return;
    }

    // 胸部與乳房區
    if (ny >= 0.712) {
      themeId = 1;
      borderDist = min(borderDist, abs(ny - 0.712));
      if (ny < 0.762 && ax < 0.072) {
        regionId = 10; // breast_mammary
        borderDist = min(borderDist, abs(ny - 0.762));
        borderDist = min(borderDist, abs(ax - 0.072));
        return;
      }
      regionId = nx < 0.0 ? 8 : 9; // chest_right / chest_left
      borderDist = min(borderDist, ax);
      if (ny < 0.762) borderDist = min(borderDist, abs(ax - 0.072));
      if (ax < 0.072) borderDist = min(borderDist, abs(ny - 0.762));
      return;
    }

    // 腹部精細五分區
    if (ny >= 0.575) {
      themeId = 2;
      borderDist = min(borderDist, abs(ny - 0.712));
      borderDist = min(borderDist, abs(ny - 0.575));
      if (ny >= 0.648) {
        borderDist = min(borderDist, abs(ny - 0.648));
        if (nx < -0.024) {
          regionId = 12; // abd_ruq
          borderDist = min(borderDist, abs(nx + 0.024));
          return;
        }
        if (nx > 0.024) {
          regionId = 13; // abd_luq
          borderDist = min(borderDist, abs(nx - 0.024));
          return;
        }
        regionId = 14; // abd_epigastric
        borderDist = min(borderDist, abs(ax - 0.024));
        return;
      }
      if (ny >= 0.616 && ax <= 0.028) {
        regionId = 14; // abd_epigastric
        borderDist = min(borderDist, abs(ny - 0.616));
        borderDist = min(borderDist, abs(ax - 0.028));
        return;
      }
      regionId = nx < 0.0 ? 15 : 16; // abd_rlq / abd_llq
      borderDist = min(borderDist, abs(ny - 0.648));
      borderDist = min(borderDist, ax);
      if (ny >= 0.616) borderDist = min(borderDist, abs(ax - 0.028));
      return;
    }

    // 骨盆與生殖泌尿會陰
    themeId = 3;
    borderDist = min(borderDist, abs(ny - 0.575));
    if (ny < 0.515 && ax < 0.036) {
      regionId = 20; // urogenital_perineal
      borderDist = min(borderDist, abs(ny - 0.515));
      borderDist = min(borderDist, abs(ax - 0.036));
      return;
    }
    regionId = 18; // pelvis_groin
    if (ny < 0.515) borderDist = min(borderDist, abs(ax - 0.036));
    if (ax < 0.036) borderDist = min(borderDist, abs(ny - 0.515));
    return;
  }

  // 4. 下肢與臀部下緣
  if (ny >= 0.440 && nrmZ < -0.15) {
    regionId = 19; // buttocks_hip
    themeId = 3;
    borderDist = min(borderDist, abs(ny - 0.440));
    return;
  }

  themeId = 4;
  if (ny >= 0.235) {
    regionId = nx < 0.0 ? 28 : 29; // thigh_knee_r / l
    borderDist = min(borderDist, abs(ny - 0.455));
    borderDist = min(borderDist, abs(ny - 0.235));
    borderDist = min(borderDist, ax);
    return;
  }

  regionId = nx < 0.0 ? 30 : 31; // calf_ankle_foot_r / l
  borderDist = min(borderDist, abs(ny - 0.235));
  borderDist = min(borderDist, ax);
}
`;
