/** 归一化：全角转半角、货币符号统一、拆行。金额提取只认这一步的输出。 */

export interface NormText {
  lines: string[];
  /** lines.join('\n')，供关键词匹配 */
  full: string;
}

/** 逐字符映射：全角标点/数字/字母 → 半角，货币与负号统一（其中 U+FF01–FF5E 段由通配规则整体折叠） */
const CHAR_MAP: Record<string, string> = {
  '　': ' ',
  '￥': '¥',
  '圆': '元',
  '−': '-',
  '–': '-',
  '—': '-',
};

const FULLWIDTH_DIGITS = '０１２３４５６７８９';

export function normText(raw: string): NormText {
  if (!raw) return { lines: [], full: '' };
  let s = raw.replace(/\r\n?/g, '\n');
  s = s.replace(/[ \t\u3000]+/g, ' ');
  s = s.replace(/[０-９]/g, (c) => String(FULLWIDTH_DIGITS.indexOf(c)));
  // 全角标点/字母 → 半角（含 ，．：；％ 等）
  s = s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  s = s.replace(/[　￥圆−–—]/g, (c) => CHAR_MAP[c]);
  // 「¥」与数字之间的空格去掉，便于紧邻判定；同时清理 OCR 常见的裸分隔线
  s = s.replace(/¥\s+/g, '¥');
  const lines = s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^[-—=·•*]+$/.test(l))
    .slice(0, 400);
  return { lines, full: lines.join('\n') };
}
