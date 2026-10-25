import { chatUrl, DEFAULT_VISION_MODEL } from '../prompt';
import type { ScanSettings } from '../types';

/** 设置页「测试连接」：发一条最小文本请求，只验链路、模型名与密钥是否可用 */
export async function probeEndpoint(settings: ScanSettings, key: string): Promise<string> {
  if (!/^https?:\/\/.+/.test(settings.baseUrl)) throw new Error('端点地址需以 https:// 开头');
  if (!key) throw new Error('请先填写密钥');
  let res: Response;
  try {
    res = await fetch(chatUrl(settings.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: settings.model || DEFAULT_VISION_MODEL,
        max_tokens: 4,
        messages: [{ role: 'user', content: '回复 OK' }],
      }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
    });
  } catch (e) {
    const err = e as Error;
    if (err?.name === 'TimeoutError') throw new Error('连接超时（15 秒）');
    throw new Error('连不上该端点：可能是网络不通，或端点不允许浏览器直连（CORS）');
  }
  if (!res.ok) {
    throw new Error(res.status === 401 || res.status === 403 ? `密钥或模型被拒绝（${res.status}）` : `端点返回 ${res.status}`);
  }
  const j = (await res.json().catch(() => null)) as { choices?: unknown } | null;
  if (!Array.isArray(j?.choices)) throw new Error('返回内容不是 OpenAI 兼容格式');
  return '连接成功 ✓';
}
