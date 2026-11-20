/**
 * 統一規範化 Gemini 模型 ID：
 * 去除可能重複的 `models/` 前綴與前後空白，徹底防止 `models/models/...` 導致 404。
 */
export function normalizeGeminiModelId(modelId?: string | null): string {
  const cleaned = (modelId || '').replace(/^models\//i, '').trim();
  return cleaned || 'gemini-2.5-flash';
}

export function buildGeminiGenerateContentUrl(
  modelId: string,
  apiKey: string
): string {
  const cleanModelId = normalizeGeminiModelId(modelId);
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cleanModelId
  )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
}

export interface DiscoveredGeminiModelsResult {
  models: string[];
  recommendedModel: string;
}

const EXCLUDED_MODEL_KEYWORDS = [
  'embedding',
  'aqa',
  'tts',
  'imagen',
  'veo',
  'bisheng',
  'audio',
  'live',
];

function scoreGeminiModelPriority(id: string): number {
  const lower = id.toLowerCase();
  let score = 0;
  if (lower.includes('2.5')) score += 300;
  else if (lower.includes('2.0')) score += 200;
  else if (lower.includes('1.5')) score += 100;

  if (lower.includes('flash') && !lower.includes('lite')) score += 60;
  else if (lower.includes('pro')) score += 45;
  else if (lower.includes('flash-lite')) score += 30;

  if (lower.includes('exp') || lower.includes('preview')) score -= 15;
  return score;
}

/**
 * 呼叫 Google Gemini ListModels API，自動過濾出支援 `generateContent` 的可用對話／多模態模型清單
 */
export async function fetchAvailableGeminiModels(
  apiKey: string
): Promise<DiscoveredGeminiModelsResult> {
  const trimmedKey = apiKey.trim();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      trimmedKey
    )}`,
    { method: 'GET' }
  );

  if (!res.ok) {
    let errReason = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      const msg = errJson?.error?.message || '';
      if (
        res.status === 400 ||
        res.status === 401 ||
        msg.toLowerCase().includes('api key')
      ) {
        errReason = `HTTP ${res.status}：API Key 無效或格式錯誤 (${msg})`;
      } else if (res.status === 403) {
        errReason = `HTTP 403：權限不足或 Generative Language API 未啟用`;
      } else if (res.status === 429) {
        errReason = `HTTP 429：API 額度已達上限 (${msg})`;
      } else if (msg) {
        errReason = `HTTP ${res.status}：${msg}`;
      }
    } catch {
      // keep HTTP status
    }
    throw new Error(errReason);
  }

  const data = await res.json();
  const rawList: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }> = Array.isArray(data?.models) ? data.models : [];

  const filtered = rawList
    .filter((m) => {
      const methods = Array.isArray(m.supportedGenerationMethods)
        ? m.supportedGenerationMethods
        : [];
      if (!methods.includes('generateContent')) return false;
      const cleanName = normalizeGeminiModelId(m.name);
      const lower = cleanName.toLowerCase();
      if (!lower.startsWith('gemini')) return false;
      if (EXCLUDED_MODEL_KEYWORDS.some((kw) => lower.includes(kw))) return false;
      return true;
    })
    .map((m) => normalizeGeminiModelId(m.name));

  const uniqueSorted = Array.from(new Set(filtered)).sort(
    (a, b) => scoreGeminiModelPriority(b) - scoreGeminiModelPriority(a)
  );

  const recommendedModel = uniqueSorted[0] || 'gemini-2.5-flash';
  return {
    models: uniqueSorted,
    recommendedModel,
  };
}
