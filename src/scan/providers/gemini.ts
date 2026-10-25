import { analyzeText } from '../analyze';
import { mergeModelResult } from '../merge';
import { normText } from '../normalize';
import { parseModelJson, SCAN_PROMPT } from '../prompt';
import type { ScanProvider } from '../types';

const HOST = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Google 视觉模型。密钥走 ?key= 查询串：换成 x-goog-api-key 头会触发 CORS 预检，
 * 而该端点对预检并不友好。注意 Google 按落地 IP 信誉放行，国内网络与多数机场节点会被拒。
 */
export const geminiProvider: ScanProvider = {
  id: 'gemini',
  label: 'Gemini',
  needsKey: true,
  readsImage: true,
  uploadsImage: true,
  available: (_s, hasKey) => hasKey,
  async run(q, { settings, key, signal }) {
    const t0 = Date.now();
    if (!q.image) {
      const n = normText(q.text ?? '');
      if (!n.lines.length) {
        return { ok: false, engine: 'gemini', text: '', error: '没有可识别的内容', ms: Date.now() - t0 };
      }
      return analyzeText(n, 'gemini', t0);
    }
    const model = settings.model || DEFAULT_GEMINI_MODEL;
    let res: Response;
    try {
      res = await fetch(`${HOST}/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SCAN_PROMPT },
                { inline_data: { mime_type: q.image.mime, data: q.image.base64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 700 },
        }),
        signal,
      });
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError' || err.name === 'TimeoutError') throw err;
      throw new Error('连不上 Google 端点：该域名在当前网络环境下通常无法直连');
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (/User location is not supported/i.test(body)) {
        throw new Error('Google 判定当前网络所在地区不可用（出口 IP 信誉），请换网络或改用自定义端点');
      }
      throw new Error(
        res.status === 400 && /API key|key/i.test(body)
          ? '密钥无效（400），请检查 Gemini API Key'
          : res.status === 404 && /model/i.test(body)
            ? '模型名不存在，请在设置里改成可用的模型 ID'
            : `端点返回 ${res.status}`,
      );
    }
    const data = (await res.json().catch(() => null)) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    } | null;
    const content = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    if (!content) throw new Error('端点返回了空内容');
    const j = parseModelJson(content);
    if (!j) throw new Error('端点没有按约定返回 JSON');
    return mergeModelResult(j, 'gemini', t0);
  },
};
