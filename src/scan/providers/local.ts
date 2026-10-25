import { analyzeText } from '../analyze';
import { normText } from '../normalize';
import type { ScanProvider } from '../types';

/**
 * 本机 OCR：图片不出设备，不需要任何密钥。
 *
 * 引擎与语言包一律走 CDN 动态加载，绝不进 `dist` —— 整套约 5.0MB（core 1.44 + chi_sim 1.69 + eng 1.94 + 胶水），
 * 而应用本身只有约 116KB gz，打进来会让首屏膨胀数十倍。首次识别时下载，之后走浏览器缓存。
 *
 * 语言包必须同时带 eng：实测只用 chi_sim 时 8 张截图里有 2 张把数字读错（个位与末位小数），
 * 而数字恰恰是记账最不能错的一位；chi_sim+eng 在同一批截图上金额 8/8。
 */
const CDN_ENTRY = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.esm.min.js';
const CDN_WORKER = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js';
const CDN_CORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.1.2/tesseract-core-simd-lstm.wasm.js';
const CDN_LANG = 'https://tessdata.projectnaptha.com/4.0.0_fast';
const LANGS = ['chi_sim', 'eng'];

export interface TessWorkerLike {
  setParameters(p: Record<string, string>): Promise<unknown>;
  recognize(img: string): Promise<{ data: { text?: string } }>;
  terminate(): Promise<unknown>;
}

export interface TessModule {
  createWorker(langs: string[], oem: number, opts: Record<string, unknown>): Promise<TessWorkerLike>;
}

export type TessLoader = () => Promise<TessModule>;

/**
 * CDN 上的 ESM 产物只导出 default（`export { tesseract_min as default }`），没有具名 createWorker；
 * 而本地打包/测试注入时又可能是具名导出。两种形状都吃，否则要等运行时才炸。
 */
export function pickTessModule(mod: unknown): TessModule {
  const m = mod as Partial<TessModule> & { default?: Partial<TessModule> };
  const picked = m?.createWorker ? m : m?.default;
  if (!picked?.createWorker) throw new Error('识别引擎包格式不符合预期');
  return picked as TessModule;
}

export const cdnLoader: TessLoader = () =>
  import(/* @vite-ignore */ CDN_ENTRY).then(pickTessModule);

const STATUS: Record<string, string> = {
  'loading tesseract core': '加载识别引擎…',
  'initializing tesseract': '初始化引擎…',
  'loading language traineddata': '下载离线文字包（首次约 5MB）…',
  'initializing api': '准备识别…',
  'recognizing text': '识别中…',
};

let workerP: Promise<TessWorkerLike> | null = null;

/** 引擎常驻复用：每次识别都重建 worker 要重新加载 5MB，代价不可接受 */
export function terminateLocalOcr() {
  const p = workerP;
  workerP = null;
  void p?.then((w) => w.terminate()).catch(() => undefined);
}

async function getWorker(load: TessLoader, onStatus?: (s: string) => void): Promise<TessWorkerLike> {
  if (!workerP) {
    workerP = (async () => {
      const mod = await load();
      const w = await mod.createWorker(LANGS, 1, {
        workerPath: CDN_WORKER,
        corePath: CDN_CORE,
        langPath: CDN_LANG,
        logger: (m: { status?: string }) => {
          if (m?.status) onStatus?.(STATUS[m.status] ?? '准备识别…');
        },
      });
      // psm 3 是实测硬要求：默认的 psm 6 会把账单里最大最粗的主金额整行漏掉
      await w.setParameters({ tessedit_pageseg_mode: '3' });
      return w;
    })().catch((e) => {
      workerP = null;
      throw e;
    });
  }
  return workerP;
}

const abortErr = () => {
  try {
    return new DOMException('aborted', 'AbortError');
  } catch {
    return Object.assign(new Error('aborted'), { name: 'AbortError' });
  }
};

export function createLocalProvider(load: TessLoader = cdnLoader): ScanProvider {
  return {
    id: 'local',
    label: '本机识别',
    needsKey: false,
    readsImage: true,
    uploadsImage: false,
    available: () => true,
    async run(q, ctx) {
      const t0 = Date.now();
      if (!q.image) {
        const n = normText(q.text ?? '');
        if (!n.lines.length) {
          return { ok: false, engine: 'local', text: '', error: '没有可识别的内容', ms: Date.now() - t0 };
        }
        return analyzeText(n, 'local', t0);
      }
      let w: TessWorkerLike;
      try {
        w = await getWorker(load, ctx.onStatus);
      } catch (e) {
        if (ctx.signal.aborted) throw abortErr();
        throw new Error(
          `识别引擎加载失败（${(e as Error).message || '未知原因'}）：首次识别需联网下载离线文字包约 5MB，请检查网络后重试`,
        );
      }
      if (ctx.signal.aborted) {
        terminateLocalOcr();
        throw abortErr();
      }
      const onAbort = () => terminateLocalOcr();
      ctx.signal.addEventListener('abort', onAbort, { once: true });
      try {
        const { data } = await w.recognize(`data:${q.image.mime};base64,${q.image.base64}`);
        const n = normText(data?.text ?? '');
        if (!n.lines.length) {
          return {
            ok: false, engine: 'local', text: '',
            error: '没读出任何文字：建议拍账单详情页（文字更密），或改用粘贴文字',
            ms: Date.now() - t0,
          };
        }
        return analyzeText(n, 'local', t0);
      } finally {
        ctx.signal.removeEventListener('abort', onAbort);
      }
    },
  };
}

export const localProvider = createLocalProvider();
