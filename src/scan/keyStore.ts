import type { ScanSettings } from './types';

/**
 * 识别配置刻意存在 zustand 之外的裸 localStorage 键：
 * persist 每次 set() 都会把整个 store 序列化成一个大 JSON 字符串，
 * 而 exportJSON 只白名单 4 个键 —— 不入库就永远不会被写进用户分享出去的备份文件。
 * 代价是「清空账目」不会连带删除密钥，所以设置面板必须提供独立的清除入口。
 */
const SETTINGS_KEY = 'pl.scan.settings';
const KEY_KEY = 'pl.scan.apikey';

export const DEFAULT_SETTINGS: ScanSettings = { engine: 'text', baseUrl: '', model: '' };

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    // 隐私模式下 localStorage 会直接抛错，识别功能退化为「仅粘贴」即可
    return '';
  }
}

function write(key: string, val: string) {
  try {
    if (val) localStorage.setItem(key, val);
    else localStorage.removeItem(key);
  } catch {
    /* 配额或隐私模式：静默降级，UI 会以「未配置」呈现 */
  }
}

const ENGINES = ['text', 'local', 'openai', 'gemini'] as const;

export function loadSettings(): ScanSettings {
  try {
    const raw = read(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const p = JSON.parse(raw) as Partial<ScanSettings>;
    return {
      engine: (ENGINES as readonly string[]).includes(p.engine ?? '') ? (p.engine as ScanSettings['engine']) : 'text',
      baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl.trim() : '',
      model: typeof p.model === 'string' ? p.model.trim() : '',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch: Partial<ScanSettings>): ScanSettings {
  const next = { ...loadSettings(), ...patch };
  write(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function loadApiKey(): string {
  return read(KEY_KEY);
}

export function saveApiKey(key: string) {
  write(KEY_KEY, key.trim());
}

export function clearScanStorage() {
  write(SETTINGS_KEY, '');
  write(KEY_KEY, '');
}

/** 同意门上要展示的落地域名 */
export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, '').split(/[/?]/)[0] || '未配置的服务端点';
  }
}
