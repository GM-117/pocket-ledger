export type CategoryType = 'expense' | 'income';
export type TxnType = 'expense' | 'income' | 'transfer';
export type AccountType = 'asset' | 'liability';

/** 账户大类：资金 / 信用 / 充值 / 理财 / 应收 / 应付（对齐 iCost） */
export type AccountKind = 'fund' | 'credit' | 'recharge' | 'invest' | 'receivable' | 'payable';

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
  /** 账户大类（资产/负债归属由 kind 推导） */
  kind: AccountKind;
  /** 子类型 id，见 accountCatalog.ts */
  subtype: string;
  /** 备注 */
  note?: string;
  /** 是否计入总资产/净资产（默认 true，关闭后显示「不计入」徽标） */
  includeInNet: boolean;
  /** 记账时是否出现在账户选择器（默认 true） */
  canSelect: boolean;
  /** 借款时间（借出 / 借入账户） */
  lendDate?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  type: CategoryType;
}

export const TRANSFER_CATEGORY_ID = '__transfer__';

/** 报销状态：无 / 待报销 / 已报销 */
export type ReimbStatus = 'none' | 'pending' | 'done';

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
  /** 标签（自由命名，如：出差、剁手） */
  tags?: string[];
  /** 报销状态（通常用于支出） */
  reimb?: ReimbStatus;
  /** 退款关联：本笔（收入）是对哪笔支出（id）的退款 */
  refundForId?: string;
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
