import { getProvider } from './providers';
import type { ScanEngineId, ScanImage, ScanResult, ScanSettings } from './types';

export interface ParseSource {
  text?: string;
  image?: ScanImage;
}

export interface ParseOptions {
  settings: ScanSettings;
  /** 由 keyStore 单独提供，刻意不塞进 settings，避免误入导出备份 */
  key?: string;
  engine?: ScanEngineId;
  signal?: AbortSignal;
  /** 引擎阶段回调（本机 OCR 首次要下载文字包，需要告诉用户在等什么） */
  onStatus?: (s: string) => void;
}

/** 图片 → 金额 / 日期 / 商户的唯一入口 */
export async function parsePaymentImage(src: ParseSource, opts: ParseOptions): Promise<ScanResult> {
  const t0 = Date.now();
  const engine = opts.engine ?? 'text';
  const fail = (error: string): ScanResult => ({ ok: false, engine, text: src.text ?? '', error, ms: Date.now() - t0 });

  const provider = getProvider(engine);
  if (!provider) return fail('未找到该识别方式');
  const key = opts.key ?? '';
  if (!provider.available(opts.settings, !!key)) return fail('该识别方式尚未配置完成，请到设置里检查');
  if (src.image && !provider.readsImage) return fail('当前识别方式读不了图片：请改选「本机识别」或配置云端服务，也可改用粘贴文字');

  const signal = opts.signal ?? (AbortSignal.timeout ? AbortSignal.timeout(30000) : new AbortController().signal);
  try {
    return await provider.run(
      { text: src.text, image: src.image },
      { settings: opts.settings, key, signal, onStatus: opts.onStatus },
    );
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err?.name === 'TimeoutError') return fail('识别超时，请重试或改用粘贴文字');
    if (err?.name === 'AbortError') return fail('已取消识别');
    return fail(err?.message || '识别失败，请稍后重试');
  }
}

export { availableProviders, defaultEngine, getProvider, PROVIDERS } from './providers';
export { cdnLoader, createLocalProvider, pickTessModule, terminateLocalOcr, type TessLoader, type TessModule } from './providers/local';
export { probeEndpoint } from './providers/probe';
export { normText } from './normalize';
export { extractAmount } from './amount';
export { scanResultToPreset } from './preset';
export * from './keyStore';
export type { ScanResult, ScanSettings, ScanImage, ScanEngineId, AmountGuess } from './types';
export { CONFIDENCE_GATE } from './types';
