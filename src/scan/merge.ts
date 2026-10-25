import { extractAmount } from './amount';
import { normText } from './normalize';
import type { ModelJson } from './prompt';
import { CONFIDENCE_GATE, type AmountKind, type ScanEngineId, type ScanResult } from './types';

const MODEL_TYPES: AmountKind[] = ['expense', 'income', 'transfer'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 模型结果与本地规则双跑，供所有视觉 provider 共用。
 * 金额以本地规则为准（可复现、可单测）；两者对不上时压到闸门之下，交回用户点选。
 */
export function mergeModelResult(j: ModelJson, engine: ScanEngineId, t0: number): ScanResult {
  const n = normText(j.raw_text || '');
  const local = n.lines.length ? extractAmount(n) : null;
  const raw = typeof j.amount === 'string' ? Number(j.amount) : (j.amount ?? null);
  const modelAmount = typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
  const merchant = typeof j.merchant === 'string' && j.merchant ? j.merchant : undefined;
  const date = typeof j.date === 'string' && ISO.test(j.date) ? j.date : undefined;
  const base: ScanResult = { ok: true, engine, text: n.full, ms: Date.now() - t0 };

  if (local) {
    const agree = modelAmount === null || Math.abs(modelAmount - local.value) < 0.005;
    return {
      ...base,
      amount: {
        ...local,
        confidence: agree ? local.confidence : Math.min(local.confidence, CONFIDENCE_GATE - 0.05),
      },
      crossCheckFailed: !agree,
      // 模型报的商户名必须真的出现在原文里，否则按幻觉丢弃
      merchant: merchant && n.full.includes(merchant) ? merchant : undefined,
      date,
      categoryName: typeof j.category === 'string' && j.category ? j.category : undefined,
    };
  }
  if (modelAmount !== null) {
    // 只有模型给了金额（原文为空或本地读不出数字）：一律要求用户确认
    return {
      ...base,
      amount: {
        value: modelAmount,
        kind: MODEL_TYPES.includes(j.type as AmountKind) ? (j.type as AmountKind) : 'expense',
        confidence: 0.4,
        candidates: [{ value: modelAmount, raw: String(modelAmount), line: -1, col: 0, score: 0, anchor: '模型' }],
        ambiguous: false,
        flags: ['model-only'],
        anchor: '模型',
      },
      merchant,
      date,
      categoryName: typeof j.category === 'string' && j.category ? j.category : undefined,
    };
  }
  return {
    ...base,
    ok: !!n.full,
    merchant,
    date,
    error: n.full ? '没找到金额，请手动填写' : '端点没有读出任何文字',
  };
}
