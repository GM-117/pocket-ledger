export type TxnType = 'expense' | 'income';
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
  type: AccountType;
  initialBalance: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  type: TxnType;
}

export interface Txn {
  id: string;
  bookId: string;
  accountId: string;
  categoryId: string;
  type: TxnType;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  createdAt: string;
}
