import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractAmount } from '../amount';
import {
  clearScanStorage,
  hostOf,
  loadApiKey,
  loadSettings,
  saveApiKey,
  saveSettings,
} from '../keyStore';
import { mergeModelResult } from '../merge';
import { chatUrl, parseModelJson } from '../prompt';
import { normText } from '../normalize';
import { openaiProvider } from '../providers/openai';
import { geminiProvider } from '../providers/gemini';
import { probeEndpoint } from '../providers/probe';
import { defaultEngine, getProvider, availableProviders, parsePaymentImage } from '../index';
import { createLocalProvider, localProvider, pickTessModule, terminateLocalOcr } from '../providers/local';
import { CONFIDENCE_GATE, type ScanSettings } from '../types';

const SETTINGS: ScanSettings = { engine: 'openai', baseUrl: 'https://relay.example/v1', model: 'vision-mini' };

/** 最小 localStorage 替身：keyStore 全部在函数内取用，可以直接挂 global */
function stubStorage() {
  const map = new Map<string, string>();
  const api = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    _map: map,
  };
  (globalThis as unknown as { localStorage: unknown }).localStorage = api;
  return api;
}

function fakeFetch(init: { ok?: boolean; status?: number; json?: unknown; text?: string; throwWith?: Error }) {
  const fn = vi.fn(async (_url: string, _opts: RequestInit) => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => {
      if (init.json === undefined) throw new Error('not json');
      return init.json;
    },
    text: async () => init.text ?? '',
  }));
  if (init.throwWith) fn.mockImplementation(async () => { throw init.throwWith; });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const openaiBody = (content: string) => ({ choices: [{ message: { content } }] });

/* ------------------------------------------------------------------ 端点地址 */

describe('chatUrl', () => {
  it('补全 /chat/completions，且不重复拼接', () => {
    expect(chatUrl('https://a.com/v1')).toBe('https://a.com/v1/chat/completions');
    expect(chatUrl('https://a.com/v1/')).toBe('https://a.com/v1/chat/completions');
    expect(chatUrl('https://a.com/v1/chat/completions')).toBe('https://a.com/v1/chat/completions');
  });
});

describe('parseModelJson', () => {
  it('容忍代码块与前后废话', () => {
    const j = parseModelJson('好的：\n```json\n{"amount": 12.5, "type": "expense"}\n```\n以上');
    expect(j?.amount).toBe(12.5);
  });
  it('非 JSON 返回 null', () => {
    expect(parseModelJson('我看不懂这张图')).toBeNull();
    expect(parseModelJson('')).toBeNull();
  });
});

/* ------------------------------------------------------------------ 交叉校验 */

describe('mergeModelResult', () => {
  const raw = ['支付成功', '实付款 ¥68.00', '余额 1,024.00'].join('\n');

  it('模型与本地规则一致时沿用本地置信度', () => {
    const r = mergeModelResult({ amount: 68, raw_text: raw }, 'openai', Date.now());
    expect(r.amount!.value).toBe(68);
    expect(r.crossCheckFailed).toBeFalsy();
    expect(r.amount!.confidence).toBeGreaterThanOrEqual(CONFIDENCE_GATE);
  });

  it('两者不一致：标记 crossCheckFailed 并压到闸门以下', () => {
    const r = mergeModelResult({ amount: 999, raw_text: raw }, 'openai', Date.now());
    expect(r.crossCheckFailed).toBe(true);
    expect(r.amount!.confidence).toBeLessThan(CONFIDENCE_GATE);
  });

  it('模型幻觉出的商户名被丢弃', () => {
    const r = mergeModelResult({ amount: 68, merchant: '不存在的店', raw_text: raw }, 'openai', Date.now());
    expect(r.merchant).toBeUndefined();
  });

  it('原文里的商户名保留', () => {
    const withShop = raw + '\n星巴克咖啡';
    const r = mergeModelResult({ amount: 68, merchant: '星巴克咖啡', raw_text: withShop }, 'openai', Date.now());
    expect(r.merchant).toBe('星巴克咖啡');
  });

  it('没有原文时只信模型，但强制人工确认', () => {
    const r = mergeModelResult({ amount: '42.00', type: 'income' }, 'gemini', Date.now());
    expect(r.amount!.value).toBe(42);
    expect(r.amount!.kind).toBe('income');
    expect(r.amount!.confidence).toBeLessThan(CONFIDENCE_GATE);
    expect(r.amount!.flags).toContain('model-only');
  });

  it('模型type 非法时退回 expense', () => {
    const r = mergeModelResult({ amount: 5, type: 'adjust' }, 'openai', Date.now());
    expect(r.amount!.kind).toBe('expense');
  });

  it('读不出任何文字时 ok=false', () => {
    const r = mergeModelResult({}, 'openai', Date.now());
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('合并后的金额仍可被本地规则复现', () => {
    const r = mergeModelResult({ amount: 68, raw_text: raw }, 'openai', Date.now());
    expect(extractAmount(normText(r.text))!.value).toBe(r.amount!.value);
  });
});

/* ------------------------------------------------------------------ openai 适配 */

describe('openaiProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('未配 baseUrl 或密钥时不可用', () => {
    expect(openaiProvider.available({ ...SETTINGS, baseUrl: '' }, true)).toBe(false);
    expect(openaiProvider.available(SETTINGS, false)).toBe(false);
    expect(openaiProvider.available(SETTINGS, true)).toBe(true);
  });

  it('把图片压成 data URL 走 image_url，并带上 Bearer 头', async () => {
    const fetchMock = fakeFetch({ json: openaiBody('{"amount":68,"raw_text":"实付款 ¥68.00"}') });
    const r = await openaiProvider.run(
      { image: { base64: 'AAA', mime: 'image/jpeg' } },
      { settings: SETTINGS, key: 'k1', signal: new AbortController().signal },
    );
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://relay.example/v1/chat/completions');
    const body = JSON.parse(String((opts as RequestInit).body));
    expect(body.model).toBe('vision-mini');
    expect(body.messages[0].content[1].image_url.url).toBe('data:image/jpeg;base64,AAA');
    expect((opts as RequestInit).headers).toMatchObject({ authorization: 'Bearer k1' });
    expect(r.amount!.value).toBe(68);
  });

  it('只有文字时不发网络请求', async () => {
    const fetchMock = fakeFetch({ json: openaiBody('{}') });
    const r = await openaiProvider.run({ text: '实付款 ¥12.00' }, { settings: SETTINGS, key: 'k1', signal: new AbortController().signal });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.amount!.value).toBe(12);
  });

  it('401 与 500 给出不同文案', async () => {
    fakeFetch({ ok: false, status: 401 });
    await expect(openaiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', signal: new AbortController().signal }))
      .rejects.toThrow(/401/);
    fakeFetch({ ok: false, status: 500 });
    await expect(openaiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', signal: new AbortController().signal }))
      .rejects.toThrow(/500/);
  });

  it('网络/CORS 失败时点名两种可能', async () => {
    fakeFetch({ throwWith: Object.assign(new Error('Failed to fetch'), { name: 'TypeError' }) });
    await expect(openaiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', signal: new AbortController().signal }))
      .rejects.toThrow(/CORS/);
  });

  it('返回体不是 JSON 时报错而非静默', async () => {
    fakeFetch({});
    await expect(openaiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', signal: new AbortController().signal }))
      .rejects.toThrow(/空内容|JSON/);
  });

  it('abort 原样抛出，由上层翻译成「已取消」', async () => {
    fakeFetch({ throwWith: Object.assign(new Error('aborted'), { name: 'AbortError' }) });
    await expect(openaiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', signal: new AbortController().signal }))
      .rejects.toThrow();
  });
});

/* ------------------------------------------------------------------ gemini 适配 */

describe('geminiProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('密钥走查询串而不是 x-goog-api-key 头（避开预检）', async () => {
    const fetchMock = fakeFetch({ json: { candidates: [{ content: { parts: [{ text: '{"amount":12,"raw_text":"实付款 ¥12.00"}' }] } }] } });
    await geminiProvider.run({ image: { base64: 'AAA', mime: 'image/png' } }, {
      settings: { engine: 'gemini', baseUrl: '', model: 'gemini-2.5-flash' },
      key: 'secret-key',
      signal: new AbortController().signal,
    });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(':generateContent?key=secret-key');
    expect((opts as RequestInit).headers).not.toHaveProperty('x-goog-api-key');
    const body = JSON.parse(String((opts as RequestInit).body));
    expect(body.contents[0].parts[1].inline_data.data).toBe('AAA');
  });

  it('地区被拒时给出可执行的解释', async () => {
    fakeFetch({ ok: false, status: 400, text: '{"error":{"message":"User location is not supported for the API use."}}' });
    await expect(geminiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, {
      settings: { engine: 'gemini', baseUrl: '', model: '' }, key: 'k', signal: new AbortController().signal,
    })).rejects.toThrow(/地区/);
  });

  it('模型名 404 提示改模型', async () => {
    fakeFetch({ ok: false, status: 404, text: 'model not found' });
    await expect(geminiProvider.run({ image: { base64: 'A', mime: 'image/jpeg' } }, {
      settings: { engine: 'gemini', baseUrl: '', model: 'nope' }, key: 'k', signal: new AbortController().signal,
    })).rejects.toThrow(/模型名/);
  });
});

/* ------------------------------------------------------------------ probe */

describe('probeEndpoint', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('端点为空时直接报错，不发请求', async () => {
    const fetchMock = fakeFetch({ json: { choices: [] } });
    await expect(probeEndpoint({ engine: 'openai', baseUrl: '', model: '' }, 'k')).rejects.toThrow(/https/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('非 OpenAI 兼容返回体被识别', async () => {
    fakeFetch({ json: { weird: true } });
    await expect(probeEndpoint(SETTINGS, 'k')).rejects.toThrow(/OpenAI/);
  });

  it('成功返回提示', async () => {
    fakeFetch({ json: { choices: [] } });
    await expect(probeEndpoint(SETTINGS, 'k')).resolves.toContain('成功');
  });
});

/* ------------------------------------------------------------------ 引擎路由 */

describe('parsePaymentImage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('只有图片但选了粘贴引擎时不联网', async () => {
    const fetchMock = fakeFetch({ json: openaiBody('{}') });
    const r = await parsePaymentImage({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: { ...SETTINGS, engine: 'text' }, key: 'k' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/图片/);
  });

  it('引擎未配置完成时报错', async () => {
    const r = await parsePaymentImage({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: { ...SETTINGS, baseUrl: '' }, key: '' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/配置/);
  });

  it('超时与主动取消文案不同', async () => {
    fakeFetch({ throwWith: Object.assign(new Error('timeout'), { name: 'TimeoutError' }) });
    const t = await parsePaymentImage({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', engine: 'openai' });
    expect(t.error).toMatch(/超时/);
    fakeFetch({ throwWith: Object.assign(new Error('aborted'), { name: 'AbortError' }) });
    const c = await parsePaymentImage({ image: { base64: 'A', mime: 'image/jpeg' } }, { settings: SETTINGS, key: 'k', engine: 'openai' });
    expect(c.error).toMatch(/取消/);
  });

  it('粘贴路永远可用，且不产生任何 fetch', async () => {
    const fetchMock = fakeFetch({ json: openaiBody('{}') });
    const r = await parsePaymentImage({ text: '支付成功\n¥28.50' }, { settings: { engine: 'text', baseUrl: '', model: '' } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.amount!.value).toBe(28.5);
    expect(r.engine).toBe('text');
  });

  it('默认引擎在配置不全时退回 text', () => {
    expect(defaultEngine(SETTINGS, false)).toBe('text');
    expect(defaultEngine(SETTINGS, true)).toBe('openai');
    expect(defaultEngine({ ...SETTINGS, baseUrl: '' }, true)).toBe('text');
  });

  it('未配置任何云端服务时，仍有两条不出设备的引擎', () => {
    expect(availableProviders({ engine: 'text', baseUrl: '', model: '' }, false).map((p) => p.id))
      .toEqual(['text', 'local']);
    expect(getProvider('gemini')!.uploadsImage).toBe(true);
    expect(getProvider('text')!.uploadsImage).toBe(false);
  });
});

/* ------------------------------------------------------------------ 本机 OCR */

describe('localProvider（本机识别）', () => {
  const OCR_TEXT = [
    '14:00', '85分', '<1', '账单详情', '管理免密支付', '支付时间',
    '某某旅行网', '-96.50', '自动扣款成功', '2026-01-13 09:45:23',
    '付款方式 花呗', '商品说明 机票', '立即领取96积分', '账单分类', '交通出行〉',
  ].join('\n');

  function fakeEngine(text = OCR_TEXT) {
    const calls: { createWorker: unknown[]; recognize: string[]; params: Record<string, string>[] } = {
      createWorker: [],
      recognize: [],
      params: [],
    };
    const worker = {
      setParameters: vi.fn(async (p: Record<string, string>) => void calls.params.push(p)),
      recognize: vi.fn(async (img: string) => {
        calls.recognize.push(img);
        return { data: { text } };
      }),
      terminate: vi.fn(async () => undefined),
    };
    const mod = { createWorker: vi.fn(async (...a: unknown[]) => { calls.createWorker.push(a); return worker; }) };
    return { calls, worker, loader: async () => mod as never };
  }

  const ctx = (signal = new AbortController().signal, onStatus?: (s: string) => void) => ({
    settings: { engine: 'local' as const, baseUrl: '', model: '' },
    key: '',
    signal,
    onStatus,
  });

  beforeEach(() => terminateLocalOcr());
  afterEach(() => terminateLocalOcr());

  it('图片不出设备：读图但不上传、不需要密钥、永远可用', () => {
    expect(localProvider.readsImage).toBe(true);
    expect(localProvider.uploadsImage).toBe(false);
    expect(localProvider.needsKey).toBe(false);
    expect(localProvider.available({ engine: 'local', baseUrl: '', model: '' }, false)).toBe(true);
  });

  it('psm 3 是实测硬约束（默认 psm 6 会整行漏掉主金额）', async () => {
    const { calls, loader } = fakeEngine();
    await createLocalProvider(loader).run({ image: { base64: 'AAA', mime: 'image/png' } }, ctx());
    expect(calls.params[0]).toEqual({ tessedit_pageseg_mode: '3' });
  });

  it('语言包必须 chi_sim + eng 且走固定 CDN 版本', async () => {
    const { calls, loader } = fakeEngine();
    await createLocalProvider(loader).run({ image: { base64: 'AAA', mime: 'image/png' } }, ctx());
    const [langs, oem, opts] = calls.createWorker[0] as [string[], number, Record<string, string>];
    expect(langs).toEqual(['chi_sim', 'eng']);
    expect(oem).toBe(1);
    expect(opts.langPath).toContain('tessdata');
    expect(opts.workerPath).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/tesseract\.js@7/);
    expect(opts.corePath).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/tesseract\.js-core@/);
  });

  it('CDN 产物只导出 default（无具名 createWorker），加载器要能拆开', async () => {
    const worker = {
      setParameters: vi.fn(async () => undefined),
      recognize: vi.fn(async () => ({ data: { text: OCR_TEXT } })),
      terminate: vi.fn(async () => undefined),
    };
    // jsdelivr 的真实形状：export { tesseract_min as default }
    expect(pickTessModule({ default: { createWorker: async () => worker } }).createWorker).toBeTypeOf('function');
    // 具名导出也要支持
    expect(pickTessModule({ createWorker: async () => worker }).createWorker).toBeTypeOf('function');
    expect(() => pickTessModule({})).toThrow(/包格式/);
    expect(() => pickTessModule(null)).toThrow(/包格式/);

    // 拆包发生在 loader 内（cdnLoader 即如此），provider 拿到的已是拆好的模块
    const r = await createLocalProvider(async () => pickTessModule({ default: { createWorker: async () => worker } })).run(
      { image: { base64: 'A', mime: 'image/png' } },
      ctx(),
    );
    expect(r.amount!.value).toBe(96.5);
  });

  it('两种导出形状都没有时给出明确错误，而不是 undefined is not a function', async () => {
    await expect(
      createLocalProvider(async () => ({}) as never).run({ image: { base64: 'A', mime: 'image/png' } }, ctx()),
    ).rejects.toThrow(/离线文字包|包格式/);
  });

  it('OCR 原文与粘贴文字走同一条下游链（金额 / 日期都对）', async () => {
    const { loader } = fakeEngine();
    const r = await createLocalProvider(loader).run({ image: { base64: 'AAA', mime: 'image/png' } }, ctx());
    expect(r.ok).toBe(true);
    expect(r.amount!.value).toBe(96.5);
    expect(r.amount!.kind).toBe('expense');
    expect(r.date).toBe('2026-01-13');
    expect(r.text).toContain('-96.50');
  });

  it('引擎常驻复用：连续两次识别只加载一次', async () => {
    const { calls, loader } = fakeEngine();
    const p = createLocalProvider(loader);
    await p.run({ image: { base64: 'A', mime: 'image/png' } }, ctx());
    await p.run({ image: { base64: 'B', mime: 'image/png' } }, ctx());
    expect(calls.createWorker).toHaveLength(1);
    expect(calls.recognize).toHaveLength(2);
  });

  it('只有文字时完全不碰引擎', async () => {
    const { calls, loader } = fakeEngine();
    const r = await createLocalProvider(loader).run({ text: '支付成功\n¥28.50' }, ctx());
    expect(calls.createWorker).toHaveLength(0);
    expect(r.amount!.value).toBe(28.5);
  });

  it('引擎加载失败时说明要下载文字包，而不是丢一句技术错误', async () => {
    const boom = async () => { throw new Error('Failed to fetch'); };
    await expect(
      createLocalProvider(boom as never).run({ image: { base64: 'A', mime: 'image/png' } }, ctx()),
    ).rejects.toThrow(/离线文字包/);
  });

  it('识别中途取消抛 AbortError，并释放引擎', async () => {
    const { worker, loader } = fakeEngine();
    const ctrl = new AbortController();
    worker.recognize.mockImplementationOnce(async () => {
      ctrl.abort();
      throw new Error('aborted');
    });
    await expect(
      createLocalProvider(loader).run({ image: { base64: 'A', mime: 'image/png' } }, ctx(ctrl.signal)),
    ).rejects.toThrow();
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('读不出文字时给出可执行建议', async () => {
    const { loader } = fakeEngine('   \n  \n');
    const r = await createLocalProvider(loader).run({ image: { base64: 'A', mime: 'image/png' } }, ctx());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/账单详情页|粘贴/);
  });

  it('默认引擎在只有本机识别可用时不会被退回 text 之外', async () => {
    expect(defaultEngine({ engine: 'local', baseUrl: '', model: '' }, false)).toBe('local');
    expect(availableProviders({ engine: 'local', baseUrl: '', model: '' }, false).map((p) => p.id))
      .toEqual(['text', 'local']);
  });
});

/* ------------------------------------------------------------------ 密钥隔离 */

describe('keyStore', () => {
  let store: ReturnType<typeof stubStorage>;
  beforeEach(() => { store = stubStorage(); });

  it('配置与密钥写在裸键上，不进账本 store', () => {
    saveSettings({ engine: 'openai', baseUrl: 'https://relay.example/v1', model: 'vision-mini' });
    saveApiKey('topsecret');
    expect([...store._map.keys()].sort()).toEqual(['pl.scan.apikey', 'pl.scan.settings']);
    expect(loadApiKey()).toBe('topsecret');
    expect(loadSettings().baseUrl).toBe('https://relay.example/v1');
  });

  it('空值写入即删除该键', () => {
    saveApiKey('abc');
    saveApiKey('   ');
    expect(store._map.has('pl.scan.apikey')).toBe(false);
    expect(loadApiKey()).toBe('');
  });

  it('损坏的配置读回来是默认值，不抛异常', () => {
    store.setItem('pl.scan.settings', '{oops');
    expect(loadSettings()).toEqual({ engine: 'text', baseUrl: '', model: '' });
    store.setItem('pl.scan.settings', JSON.stringify({ engine: 'nope', baseUrl: 123 }));
    expect(loadSettings()).toEqual({ engine: 'text', baseUrl: '', model: '' });
  });

  it('clearScanStorage 一次清干净', () => {
    saveSettings({ engine: 'gemini' });
    saveApiKey('abc');
    clearScanStorage();
    expect(store._map.size).toBe(0);
    expect(loadSettings().engine).toBe('text');
  });

  it('同意门只展示域名，不泄露密钥', () => {
    expect(hostOf('https://relay.example/v1/chat/completions?key=abc')).toBe('relay.example');
    expect(hostOf('relay.example/v1')).toBe('relay.example');
    expect(hostOf('')).toBe('未配置的服务端点');
  });

  it('localStorage 抛错时静默降级', () => {
    (globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    };
    expect(loadApiKey()).toBe('');
    expect(loadSettings().engine).toBe('text');
    expect(() => saveApiKey('x')).not.toThrow();
  });
});
