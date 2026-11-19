import { ObjectiveVitalSigns, SafetyCheckAlertItem } from '@/types/cdss';

export type VitalStatusLevel = 'normal' | 'warning' | 'critical';

export interface VitalFieldEvaluation {
  field: keyof ObjectiveVitalSigns;
  labelZh: string;
  valueText: string;
  status: VitalStatusLevel;
  clinicalNoteZh: string;
}

/**
 * 客觀生命徵象與居家量測值異常／危急閾值自動判讀器
 */
export function evaluateObjectiveVitalSigns(vitals?: ObjectiveVitalSigns): {
  fieldEvaluations: VitalFieldEvaluation[];
  abnormalSummaryListZh: string[];
  criticalAlerts: SafetyCheckAlertItem[];
} {
  const fieldEvaluations: VitalFieldEvaluation[] = [];
  const abnormalSummaryListZh: string[] = [];
  const criticalAlerts: SafetyCheckAlertItem[] = [];

  if (!vitals) {
    return { fieldEvaluations, abnormalSummaryListZh, criticalAlerts };
  }

  // 1. 體溫 (°C)
  if (typeof vitals.temperatureC === 'number' && !isNaN(vitals.temperatureC)) {
    const t = vitals.temperatureC;
    if (t >= 39.5 || t < 35.0) {
      const note =
        t >= 39.5
          ? `高熱危象 (${t}°C ≥ 39.5°C)，需高度警惕嚴重細菌感染、全身性發炎反應或中樞熱`
          : `低體溫警訊 (${t}°C < 35.0°C)，需警惕敗血症低體溫反應或循環灌流不足`;
      fieldEvaluations.push({
        field: 'temperatureC',
        labelZh: '體溫',
        valueText: `${t} °C`,
        status: 'critical',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
      criticalAlerts.push({
        ruleId: 'RF_VITAL_TEMP_CRITICAL',
        suspectedEmergencyConditionZh: '極端體溫異常（高熱危象或敗血性低體溫風險）',
        triggeringEvidenceZh: `客觀量測體溫 ${t}°C 已達臨床危急閾值`,
        immediateActionZh: '建議立即前往急診室進行血液培養、發炎指標與感染源評估。',
      });
    } else if (t >= 38.1) {
      const note = `明顯發燒 (${t}°C)，提示急性感染或全身性發炎反應`;
      fieldEvaluations.push({
        field: 'temperatureC',
        labelZh: '體溫',
        valueText: `${t} °C`,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else if (t >= 37.5) {
      const note = `低度發燒 (${t}°C)，可能為病毒感染前驅期或局部組織發炎`;
      fieldEvaluations.push({
        field: 'temperatureC',
        labelZh: '體溫',
        valueText: `${t} °C`,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else if (t < 36.0) {
      const note = `體溫偏低 (${t}°C)`;
      fieldEvaluations.push({
        field: 'temperatureC',
        labelZh: '體溫',
        valueText: `${t} °C`,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else {
      fieldEvaluations.push({
        field: 'temperatureC',
        labelZh: '體溫',
        valueText: `${t} °C`,
        status: 'normal',
        clinicalNoteZh: '正常體溫範圍 (36.0–37.4°C)',
      });
    }
  }

  // 2. 收縮壓 / 舒張壓 (mmHg)
  if (typeof vitals.systolicBp === 'number' && !isNaN(vitals.systolicBp)) {
    const sbp = vitals.systolicBp;
    const dbp = vitals.diastolicBp;
    const bpText = dbp ? `${sbp}/${dbp} mmHg` : `${sbp} mmHg`;

    if (sbp >= 180 || (dbp && dbp >= 120) || sbp < 90) {
      const isHigh = sbp >= 180 || (dbp && dbp >= 120);
      const note = isHigh
        ? `高血壓危象範圍 (${bpText})，若合併頭痛、胸痛、背痛或視力模糊，需立即排除靶器官受損（腦中風／主動脈剝離／急性心衰竭）`
        : `低血壓休克警訊 (${bpText}，收縮壓 < 90 mmHg)，需高度警惕脫水、出血或敗血性灌流不足`;
      fieldEvaluations.push({
        field: 'systolicBp',
        labelZh: '血壓',
        valueText: bpText,
        status: 'critical',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
      criticalAlerts.push({
        ruleId: 'RF_VITAL_BP_CRITICAL',
        suspectedEmergencyConditionZh: isHigh
          ? '高血壓危象（Hypertensive Crisis）或急性血管併發症風險'
          : '低血壓與組織灌流不足警訊（Hypotension / Shock Risk）',
        triggeringEvidenceZh: `客觀量測血壓 ${bpText} 超出安全邊界`,
        immediateActionZh:
          '請立即前往急診室監測血壓與器官功能，切勿自行服用過量短效降壓藥以免血壓驟降引發腦缺血。',
      });
    } else if (sbp >= 140 || (dbp && dbp >= 90)) {
      const note = `血壓明顯偏高 (${bpText})，可能與疼痛交感神經刺激或高血壓控制不佳有關`;
      fieldEvaluations.push({
        field: 'systolicBp',
        labelZh: '血壓',
        valueText: bpText,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else if (sbp >= 130 || (dbp && dbp >= 85)) {
      const note = `血壓輕度偏高 (${bpText})`;
      fieldEvaluations.push({
        field: 'systolicBp',
        labelZh: '血壓',
        valueText: bpText,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else {
      fieldEvaluations.push({
        field: 'systolicBp',
        labelZh: '血壓',
        valueText: bpText,
        status: 'normal',
        clinicalNoteZh: '正常血壓範圍',
      });
    }
  }

  // 3. 靜息心率 (bpm)
  if (typeof vitals.heartRateBpm === 'number' && !isNaN(vitals.heartRateBpm)) {
    const hr = vitals.heartRateBpm;
    if (hr >= 130 || hr < 45) {
      const note =
        hr >= 130
          ? `顯著心搏過速 (${hr} bpm ≥ 130 bpm)，需排除快速心律不整、嚴重脫水、敗血症、肺栓塞或甲狀腺風暴`
          : `顯著心搏過緩 (${hr} bpm < 45 bpm)，需排除房室傳導阻滯或病態竇房結症候群`;
      fieldEvaluations.push({
        field: 'heartRateBpm',
        labelZh: '靜息心率',
        valueText: `${hr} bpm`,
        status: 'critical',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
      criticalAlerts.push({
        ruleId: 'RF_VITAL_HR_CRITICAL',
        suspectedEmergencyConditionZh: '極端心率異常（急性心律不整或血流動力學不穩）',
        triggeringEvidenceZh: `客觀靜息心率 ${hr} bpm 達危急閾值`,
        immediateActionZh: '建議立即前往急診進行 12 導程心電圖 (ECG) 監測。',
      });
    } else if (hr > 100 || hr < 60) {
      const note =
        hr > 100
          ? `心率偏快 (${hr} bpm > 100 bpm)，常見於發燒代償、疼痛、焦慮、甲狀腺亢進或貧血`
          : `心率偏慢 (${hr} bpm < 60 bpm)`;
      fieldEvaluations.push({
        field: 'heartRateBpm',
        labelZh: '靜息心率',
        valueText: `${hr} bpm`,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else {
      fieldEvaluations.push({
        field: 'heartRateBpm',
        labelZh: '靜息心率',
        valueText: `${hr} bpm`,
        status: 'normal',
        clinicalNoteZh: '正常靜息心率 (60–100 bpm)',
      });
    }
  }

  // 4. 血氧飽和度 (SpO2 %)
  if (typeof vitals.spo2Pct === 'number' && !isNaN(vitals.spo2Pct)) {
    const spo2 = vitals.spo2Pct;
    if (spo2 < 92) {
      const note = `低血氧危象 (SpO2 ${spo2}% < 92%)，提示明顯氣體交換障礙（如肺炎、肺栓塞、氣胸、急性肺水腫或氣喘重度發作）`;
      fieldEvaluations.push({
        field: 'spo2Pct',
        labelZh: '血氧 SpO2',
        valueText: `${spo2} %`,
        status: 'critical',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
      criticalAlerts.push({
        ruleId: 'RF_VITAL_SPO2_CRITICAL',
        suspectedEmergencyConditionZh: '急性低血氧症（Acute Hypoxemia，SpO2 < 92%）',
        triggeringEvidenceZh: `客觀血氧飽和度 SpO2 僅 ${spo2}% (< 92% 危急紅線)`,
        immediateActionZh: '請立即前往急診室或撥打 119 接受氧氣治療、動脈血液氣體分析與胸部影像檢查。',
      });
    } else if (spo2 < 95) {
      const note = `血氧輕度偏低 (SpO2 ${spo2}%，正常應 ≥ 95%)，需密切注意呼吸頻率與胸腔症狀`;
      fieldEvaluations.push({
        field: 'spo2Pct',
        labelZh: '血氧 SpO2',
        valueText: `${spo2} %`,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else {
      fieldEvaluations.push({
        field: 'spo2Pct',
        labelZh: '血氧 SpO2',
        valueText: `${spo2} %`,
        status: 'normal',
        clinicalNoteZh: '血氧飽和度正常 (95–100%)',
      });
    }
  }

  // 5. 血糖值 (mg/dL)
  if (
    typeof vitals.bloodGlucoseMgDl === 'number' &&
    !isNaN(vitals.bloodGlucoseMgDl)
  ) {
    const bg = vitals.bloodGlucoseMgDl;
    const timingZh =
      vitals.glucoseTiming === 'fasting' ? '空腹' : '飯後/隨機';

    if (bg < 55 || bg >= 300) {
      const note =
        bg < 55
          ? `嚴重低血糖危象 (${timingZh} ${bg} mg/dL < 55 mg/dL)，可引發手抖、冒冷汗、心悸、意識混亂甚至昏迷`
          : `極端高血糖警訊 (${timingZh} ${bg} mg/dL ≥ 300 mg/dL)，若合併噁心嘔吐、腹痛或呼吸深快，需排除糖尿病酮酸中毒 (DKA) 或高滲透壓高血糖狀態 (HHS)`;
      fieldEvaluations.push({
        field: 'bloodGlucoseMgDl',
        labelZh: '血糖值',
        valueText: `${bg} mg/dL (${timingZh})`,
        status: 'critical',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
      criticalAlerts.push({
        ruleId: 'RF_VITAL_GLUCOSE_CRITICAL',
        suspectedEmergencyConditionZh:
          bg < 55
            ? '急性低血糖危象（Severe Hypoglycemia）'
            : '高血糖急症風險（疑似 DKA 或 HHS 風險）',
        triggeringEvidenceZh: `客觀血糖量測值 ${bg} mg/dL 已達危急閾值`,
        immediateActionZh:
          bg < 55
            ? '若意識清醒請立即補充 15 公克速效糖分（如含糖果汁或方糖）並於 15 分鐘後重測；若意識不清請勿強灌並立即撥打 119。'
            : '請立即補充水分並儘速前往急診檢驗血酮、電解質與酸鹼度。',
      });
    } else if (
      bg < 70 ||
      (vitals.glucoseTiming === 'fasting' && bg >= 126) ||
      bg >= 180
    ) {
      const note =
        bg < 70
          ? `輕度低血糖 (${timingZh} ${bg} mg/dL < 70 mg/dL)`
          : `血糖偏高 (${timingZh} ${bg} mg/dL)`;
      fieldEvaluations.push({
        field: 'bloodGlucoseMgDl',
        labelZh: '血糖值',
        valueText: `${bg} mg/dL (${timingZh})`,
        status: 'warning',
        clinicalNoteZh: note,
      });
      abnormalSummaryListZh.push(note);
    } else {
      fieldEvaluations.push({
        field: 'bloodGlucoseMgDl',
        labelZh: '血糖值',
        valueText: `${bg} mg/dL (${timingZh})`,
        status: 'normal',
        clinicalNoteZh: '血糖數值於一般參考範圍內',
      });
    }
  }

  return { fieldEvaluations, abnormalSummaryListZh, criticalAlerts };
}
