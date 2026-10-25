import type { TxnType } from '../types';

/** 识别引擎：text = 粘贴账单文字（零网络）；local = 本机 tesseract（图片不出设备）；
 *  openai = OpenAI 兼容 /v1/chat/completions 视觉；gemini = Google generateContent */
export type ScanEngineId = 'text' | 'local' | 'openai' | 'gemini';

export interface OcrBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** OCR 词框：仅本地 OCR 路有；云端返回纯文本时省略 */
export interface OcrWord {
  text: string;
  box: OcrBox;
}

/** 转账与调整不会由截图识别自动定性，故只保留三种 */
export type AmountKind = Exclude<TxnType, 'adjust'>;

export interface AmountCandidate {
  /** 归一化后的数值（元），已处理千分位与「万」 */
  value: number;
  /** 原文片段，如 1,280.00 */
  raw: string;
  line: number;
  col: number;
  score: number;
  /** 命中的锚点词，未命中为空串 */
  anchor: string;
  /** 命中否决词，非空表示该候选已被剔除（保留用于调试与展示） */
  veto?: string;
  /** 原文带「万」字，value 已换算 */
  wan?: boolean;
  /** 紧邻 ¥ 前缀或「元」后缀 */
  currency?: boolean;
  /** 数字前有减号 —— 账单详情页主金额的硬约定，必然流出 */
  minus?: boolean;
  /** 恰好两位小数 */
  cents2?: boolean;
  /** 词框高度 / 页面中位词框高度（无 OCR 词框时为 0） */
  fontRatio?: number;
  /** 位于页面上部（截图金额通常靠上） */
  topArea?: boolean;
}

export interface AmountGuess {
  value: number;
  kind: 'expense' | 'income' | 'transfer';
  /** 0~1；低于 CONFIDENCE_GATE 时不得静默预填 */
  confidence: number;
  /** 按分数降序，含并列候选；UI 展示前 3 个 */
  candidates: AmountCandidate[];
  /** 最高分并列：金额抓错的概率高，UI 必须让用户点选 */
  ambiguous: boolean;
  /** 'wan' = 原文带「万」字换算；'out-of-range' = 超出合理区间 */
  flags: string[];
  anchor: string;
}

export interface ScanSettings {
  engine: ScanEngineId;
  /** OpenAI 兼容端点根，如 https://api.openai.com/v1 或自建中转 */
  baseUrl: string;
  model: string;
}

export interface ScanImage {
  base64: string;
  mime: string;
}

export interface ScanQuery {
  text?: string;
  image?: ScanImage;
}

export interface ScanResult {
  ok: boolean;
  engine: ScanEngineId;
  /** 归一化后的原文：核对区展示 + 供交叉校验 */
  text: string;
  words?: OcrWord[];
  amount?: AmountGuess;
  merchant?: string;
  /** YYYY-MM-DD */
  date?: string;
  /** 模型给出的分类「名字」—— id 跨设备不通用，解析回本机 id 由 preset 负责 */
  categoryName?: string;
  /** 模型自述值与本地规则提取不一致：降级为人工确认 */
  crossCheckFailed?: boolean;
  error?: string;
  ms: number;
}

export interface ScanProvider {
  id: ScanEngineId;
  label: string;
  needsKey: boolean;
  /** 该引擎能消费图片（决定是否在选图后自动识别） */
  readsImage: boolean;
  /** 是否需要把图片上传到外部服务器（决定同意门是否弹出） */
  uploadsImage: boolean;
  /** 该 provider 是否已具备运行条件（决定入口是否可选） */
  available(s: ScanSettings, hasKey: boolean): boolean;
  run(
    q: ScanQuery,
    ctx: { settings: ScanSettings; key: string; signal: AbortSignal; onStatus?: (s: string) => void },
  ): Promise<ScanResult>;
}

/** 低于此置信度只给候选、不预填 */
export const CONFIDENCE_GATE = 0.6;
