import { analyzeText } from '../analyze';
import { mergeModelResult } from '../merge';
import { normText } from '../normalize';
import { chatUrl, DEFAULT_VISION_MODEL, parseModelJson, SCAN_PROMPT } from '../prompt';
import type { ScanProvider } from '../types';

/** OpenAI 兼容的 /chat/completions 视觉端点：baseUrl 与密钥都由用户自己填，本项目不代管 */
export const openaiProvider: ScanProvider = {
  id: 'openai',
  label: '图片识别',
  needsKey: true,
  readsImage: true,
  uploadsImage: true,
  available: (s, hasKey) => hasKey && /^https?:\/\/.+/.test(s.baseUrl || ''),
  async run(q, { settings, key, signal }) {
    const t0 = Date.now();
    // 没有图片就不必打扰远端，本地规则同样能处理粘贴文字
    if (!q.image) {
      const n = normText(q.text ?? '');
      if (!n.lines.length) {
        return { ok: false, engine: 'openai', text: '', error: '没有可识别的内容', ms: Date.now() - t0 };
      }
      return analyzeText(n, 'openai', t0);
    }
    let res: Response;
    try {
      res = await fetch(chatUrl(settings.baseUrl), {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: settings.model || DEFAULT_VISION_MODEL,
          temperature: 0,
          max_tokens: 700,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: SCAN_PROMPT },
                { type: 'image_url', image_url: { url: `data:${q.image.mime};base64,${q.image.base64}` } },
              ],
            },
          ],
        }),
        signal,
      });
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError' || err.name === 'TimeoutError') throw err;
      throw new Error('连不上该端点：可能是网络不通，或端点不允许浏览器直连（CORS）');
    }
    if (!res.ok) {
      throw new Error(
        res.status === 401 || res.status === 403
          ? `端点拒绝了密钥（${res.status}），请检查密钥与模型名`
          : `端点返回 ${res.status}`,
      );
    }
    const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('端点返回了空内容');
    const j = parseModelJson(content);
    if (!j) throw new Error('端点没有按约定返回 JSON，可换个工作稳定的视觉模型再试');
    return mergeModelResult(j, 'openai', t0);
  },
};
