/** 所有视觉 provider 共用的指令：只回 JSON，且必须回原文，方便本地规则交叉校验 */
export const SCAN_PROMPT = [
  '你是支付截图识别器。看图后只输出一个 JSON 对象，不要任何解释、不要 markdown 代码块。',
  '字段：',
  'amount: 本次实际支付/收入的金额数字（元，不含千分位与货币符号；无法判断填 null）',
  'type: "expense" | "income" | "transfer" 三选一',
  'date: 交易日期，格式 YYYY-MM-DD（无法判断填 null）',
  'merchant: 商户或对方名称，照抄图里的字（无法判断填 null）',
  'category: 从「餐饮 交通 购物 居住 娱乐 医疗 通讯 旅行 工资 理财收益 红包 兼职」里选一个最贴近的词，否则填 null',
  'raw_text: 图中所有可见文字，按从上到下、从左到顺序用换行拼接',
  '注意：amount 必须是「实付/支付/收款/退款」那一笔，不是余额、积分、原价、优惠、订单号里的数字。',
].join('\n');

export interface ModelJson {
  amount?: number | string | null;
  type?: string | null;
  date?: string | null;
  merchant?: string | null;
  /** 分类「名字」建议，id 由本机解析 */
  category?: string | null;
  raw_text?: string | null;
}

/** 容错解析：模型常把 JSON 包在 ```json 里或前后带一句废话 */
export function parseModelJson(content: string): ModelJson | null {
  if (!content) return null;
  const cleaned = content.replace(/```(?:json)?/gi, '').trim();
  const a = cleaned.indexOf('{');
  const b = cleaned.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    const obj = JSON.parse(cleaned.slice(a, b + 1)) as ModelJson;
    return typeof obj === 'object' && obj !== null ? obj : null;
  } catch {
    return null;
  }
}

/** baseUrl 允许写成 https://x/v1 或直接给完整 chat/completions 地址 */
export function chatUrl(baseUrl: string): string {
  const s = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/.test(s)) return s;
  return `${s}/chat/completions`;
}

export const DEFAULT_VISION_MODEL = 'gpt-4o-mini';
