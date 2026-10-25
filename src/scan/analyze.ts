import { extractAmount } from './amount';
import { extractDate, extractMerchant } from './category';
import type { NormText } from './normalize';
import type { ScanEngineId, ScanResult } from './types';

/** 所有 provider 的下游共用：文本 → 金额 / 日期 / 商户。分类与账户需要本机数据，留给 preset。 */
export function analyzeText(
  n: NormText,
  engine: ScanEngineId,
  t0: number,
  over: Partial<ScanResult> = {},
): ScanResult {
  const amount = extractAmount(n);
  return {
    ok: true,
    engine,
    text: n.full,
    amount: amount ?? undefined,
    date: extractDate(n.full),
    merchant: extractMerchant(n.lines, amount?.candidates[0]?.line ?? -1),
    ms: Date.now() - t0,
    ...over,
  };
}
