import { geminiProvider } from './gemini';
import { localProvider } from './local';
import { openaiProvider } from './openai';
import { textProvider } from './text';
import type { ScanEngineId, ScanProvider, ScanSettings } from '../types';

/** 新增识别引擎只需在此登记一项，下游（analyze / merge / preset / ScanModal）无需改动 */
export const PROVIDERS: ScanProvider[] = [textProvider, localProvider, openaiProvider, geminiProvider];

export function getProvider(id: ScanEngineId): ScanProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function availableProviders(s: ScanSettings, hasKey: boolean): ScanProvider[] {
  return PROVIDERS.filter((p) => p.available(s, hasKey));
}

/** 默认引擎：能用零网络的粘贴路就不擅自联网 */
export function defaultEngine(s: ScanSettings, hasKey: boolean): ScanEngineId {
  return availableProviders(s, hasKey).some((p) => p.id === s.engine) ? s.engine : 'text';
}
