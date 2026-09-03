export type CategoryType = 'expense' | 'income';
export type TxnType = 'expense' | 'income' | 'transfer';
export type AccountType = 'asset' | 'liability';

export interface Book {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  emoji: string;
  type: 'asset' | 'liability';
  initialBalance: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  type: CategoryType;
}

export const TRANSFER_CATEGORY_ID = '__transfer__';

export interface Txn {
  id: string;
  bookId: string;
  accountId: string;
  /** 转账时的转入账户 */
  toAccountId?: string;
  categoryId: string;
  type: TxnType;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  createdAt: string;
  /** 由周期规则生成时冗余规则 id */
  recurrenceId?: string;
}

/** 模板快捷记账 */
export interface Template {
  id: string;
  name: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string;
  accountId: string;
  bookId: string;
  note: string;
}

export type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const FREQ_LABEL: Record<Freq, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
};

/** 周期记账规则 */
export interface Recurring {
  id: string;
  bookId: string;
  accountId: string;
  categoryId: string;
  type: 'expense' | 'income';
  amount: number;
  note: string;
  freq: Freq;
  /** 开始日期 YYYY-MM-DD */
  startDate: string;
  /** 已生成的最后一次日期 */
  lastGenerated: string | null;
  enabled: boolean;
}
