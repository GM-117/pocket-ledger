import { fmtISO, round2 } from '../utils';
import type { Account, Category, Txn } from '../types';
import { extractDate, extractMerchant, inferAccountId, matchCategoryByName } from './category';
import type { ScanResult } from './types';

export interface ScanPresetContext {
  categories: Category[];
  accounts: Account[];
  activeBookId: string;
  now?: Date;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ScanResult → TransactionForm 的 preset。
 * 形状与 DetailPage 的 templateToPreset 一致：id / createdAt 留空，由表单落库时补。
 * 推断出的 id 一律回到本机数据校验，宁可留空让表单走默认值，也不凭空造 id。
 */
export function scanResultToPreset(r: ScanResult, ctx: ScanPresetContext): Txn {
  const now = ctx.now ?? new Date();
  const lines = r.text ? r.text.split('\n') : [];
  const kind = r.amount?.kind ?? 'expense';
  const catType = kind === 'income' ? 'income' : 'expense';
  // 模型自报的分类名并入检索文本
  const haystack = r.categoryName ? `${r.text}\n${r.categoryName}` : r.text;
  const cat = kind === 'transfer' ? null : matchCategoryByName(ctx.categories, haystack, catType);
  const accountId = inferAccountId(ctx.accounts, haystack, ctx.activeBookId);

  // 模型给的商户名必须真的出现在原文里，否则当作幻觉丢弃
  const modelMerchant = r.merchant && r.text.includes(r.merchant) ? r.merchant : '';
  const merchant = (modelMerchant || extractMerchant(lines, r.amount?.candidates[0]?.line ?? -1)).slice(0, 30);

  const todayISO = fmtISO(now);
  const date = r.date && ISO.test(r.date) && r.date <= todayISO ? r.date : extractDate(r.text, now);

  return {
    id: '',
    bookId: ctx.activeBookId,
    accountId,
    categoryId: cat?.id ?? '',
    type: kind,
    amount: round2(r.amount?.value ?? 0),
    date,
    note: merchant,
    createdAt: '',
  };
}
