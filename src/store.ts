import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Book, Category, Txn } from './types';
import { addDays, fmtISO, round2, uid } from './utils';

export interface StoreState {
  books: Book[];
  accounts: Account[];
  categories: Category[];
  txns: Txn[];
  activeBookId: string;
  /** 每本账本的月度总预算（bookId → 金额） */
  budgets: Record<string, number>;
  /** 隐藏金额（隐私模式） */
  hideAmounts: boolean;
  setActiveBook: (id: string) => void;
  setBudget: (bookId: string, amount: number | null) => void;
  toggleHideAmounts: () => void;
  saveBook: (b: Book) => void;
  removeBook: (id: string) => void;
  saveAccount: (a: Account) => void;
  removeAccount: (id: string) => void;
  saveTxn: (t: Txn) => void;
  removeTxn: (id: string) => void;
  exportJSON: () => string;
  /** 导入备份 JSON，成功返回 null，失败返回错误信息 */
  importJSON: (raw: string) => string | null;
  loadDemo: () => void;
}

const BOOK_COLORS = ['#5b7cfa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const BOOK_EMOJIS = ['🏠', '💼', '✈️', '🎓', '🎁', '🚗', '👶', '💌'];
export const ACCOUNT_EMOJIS = ['💵', '🏦', '💳', '📱', '🪙', '📈', '🐷', '🧾'];
export const CATEGORY_EMOJIS = [
  '🍜', '🚇', '🛍️', '🏠', '🎮', '💊', '📱', '✈️', '☕', '🎬',
  '📚', '🐶', '🎁', '💡', '💰', '📈', '🧧', '💼', '💸', '🪙',
];

/* ------------------------------------------------------------------ */
/* 演示数据：以「今天」为基准生成，保证首次打开图表即有内容               */
/* ------------------------------------------------------------------ */

function createDemoData() {
  const now = new Date();
  const iso = (d: Date) => fmtISO(d);

  const books: Book[] = [
    { id: uid(), name: '日常生活', emoji: '🏠', color: BOOK_COLORS[0], createdAt: iso(addDays(now, -90)) },
    { id: uid(), name: '工作差旅', emoji: '💼', color: BOOK_COLORS[2], createdAt: iso(addDays(now, -60)) },
  ];
  const [life, work] = books;

  const mkAcc = (name: string, emoji: string, type: Account['type'], initialBalance: number): Account => ({
    id: uid(), name, emoji, type, initialBalance, createdAt: iso(addDays(now, -120)),
  });
  const accounts: Account[] = [
    mkAcc('微信零钱', '📱', 'asset', 3200),
    mkAcc('支付宝', '💵', 'asset', 5800),
    mkAcc('招商银行卡', '🏦', 'asset', 46000),
    mkAcc('基金账户', '📈', 'asset', 30000),
    mkAcc('信用卡', '💳', 'liability', 8600),
  ];
  const [wx, ali, cmb, fund, credit] = accounts;

  const mkCat = (name: string, emoji: string, type: Category['type']): Category => ({
    id: uid(), name, emoji, type,
  });
  const expenseCats = [
    mkCat('餐饮', '🍜', 'expense'),
    mkCat('交通', '🚇', 'expense'),
    mkCat('购物', '🛍️', 'expense'),
    mkCat('居住', '🏠', 'expense'),
    mkCat('娱乐', '🎮', 'expense'),
    mkCat('医疗', '💊', 'expense'),
    mkCat('通讯', '📱', 'expense'),
    mkCat('旅行', '✈️', 'expense'),
  ];
  const incomeCats = [
    mkCat('工资', '💰', 'income'),
    mkCat('理财收益', '📈', 'income'),
    mkCat('红包', '🧧', 'income'),
    mkCat('兼职', '💼', 'income'),
  ];
  const categories = [...expenseCats, ...incomeCats];
  const [can, jiao, shop, house, fun, med, phone, trip] = expenseCats;
  const [salary, inv, hongbao, partTime] = incomeCats;

  const txns: Txn[] = [];
  const addTxn = (
    bookId: string, type: Txn['type'], cat: Category, acc: Account,
    amount: number, date: string, note = '',
  ) => {
    txns.push({
      id: uid(), bookId, type, categoryId: cat.id, accountId: acc.id,
      amount: round2(amount), date, note, createdAt: `${date} 12:00`,
    });
  };

  // 每日零星支出（近 56 天）
  const dailyPlan: { cat: Category; min: number; max: number }[] = [
    { cat: can, min: 12, max: 88 },
    { cat: jiao, min: 3, max: 36 },
    { cat: shop, min: 49, max: 599 },
    { cat: fun, min: 30, max: 199 },
    { cat: med, min: 15, max: 260 },
    { cat: phone, min: 25, max: 99 },
  ];
  for (let i = 55; i >= 0; i--) {
    const day = iso(addDays(now, -i));
    const count = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < count; k++) {
      const p = dailyPlan[Math.floor(Math.random() * dailyPlan.length)];
      const acc = Math.random() < 0.75 ? (Math.random() < 0.5 ? wx : ali) : credit;
      addTxn(life.id, 'expense', p.cat, acc,
        p.min + Math.random() * (p.max - p.min), day);
    }
  }
  // 每月固定收支（覆盖近 3 个月，固定在月初，保证任何日期打开都有当月数据）
  for (let m = 0; m < 3; m++) {
    const anchor = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y = anchor.getFullYear(), mo = anchor.getMonth();
    addTxn(life.id, 'income', salary, cmb, 12800, iso(new Date(y, mo, 1)), '月度工资');
    addTxn(life.id, 'expense', house, cmb, 3600, iso(new Date(y, mo, 2)), '房租');
    const invDay = m > 0 || now.getDate() >= 15 ? 15 : now.getDate();
    addTxn(life.id, 'income', inv, fund, 320 + Math.random() * 260, iso(new Date(y, mo, invDay)), '基金收益');
  }
  // 红包 / 兼职 / 差旅等点睛记录
  addTxn(life.id, 'income', hongbao, wx, 200, iso(addDays(now, -9)), '生日红包');
  addTxn(life.id, 'income', partTime, ali, 1500, iso(addDays(now, -18)), '设计外包');
  addTxn(life.id, 'income', hongbao, wx, 88, iso(addDays(now, -30)), '节日红包');
  const trips: [number, string, number][] = [
    [-6, '上海出差 · 高铁', 553],
    [-7, '酒店两晚', 836],
    [-8, '客户晚宴', 486],
    [-21, '深圳出差 · 机票', 1240],
    [-23, '酒店三晚', 1176],
    [-40, '杭州出差 · 高铁', 219],
  ];
  for (const [off, note, amt] of trips) {
    addTxn(work.id, 'expense', off === -8 ? can : trip, credit, amt, iso(addDays(now, off)), note);
  }
  addTxn(work.id, 'income', partTime, cmb, 3000, iso(addDays(now, -14)), '项目奖金');

  return { books, accounts, categories, txns, activeBookId: books[0].id };
}

/* ------------------------------------------------------------------ */

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createDemoData(),
      budgets: {},
      hideAmounts: false,

      setActiveBook: (id) => set({ activeBookId: id }),

      setBudget: (bookId, amount) =>
        set((s) => {
          const budgets = { ...s.budgets };
          if (amount === null || amount <= 0) delete budgets[bookId];
          else budgets[bookId] = round2(amount);
          return { budgets };
        }),

      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),

      saveBook: (b) =>
        set((s) => ({
          books: s.books.some((x) => x.id === b.id)
            ? s.books.map((x) => (x.id === b.id ? b : x))
            : [...s.books, b],
        })),

      removeBook: (id) =>
        set((s) => {
          const books = s.books.filter((b) => b.id !== id);
          return {
            books,
            txns: s.txns.filter((t) => t.bookId !== id),
            activeBookId: s.activeBookId === id ? books[0]?.id ?? '' : s.activeBookId,
          };
        }),

      saveAccount: (a) =>
        set((s) => ({
          accounts: s.accounts.some((x) => x.id === a.id)
            ? s.accounts.map((x) => (x.id === a.id ? a : x))
            : [...s.accounts, a],
        })),

      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          txns: s.txns.filter((t) => t.accountId !== id),
        })),

      saveTxn: (t) =>
        set((s) => ({
          txns: s.txns.some((x) => x.id === t.id)
            ? s.txns.map((x) => (x.id === t.id ? t : x))
            : [...s.txns, t],
        })),

      removeTxn: (id) => set((s) => ({ txns: s.txns.filter((t) => t.id !== id) })),

      exportJSON: () => {
        const { books, accounts, categories, txns } = get();
        return JSON.stringify({ app: 'pocket-ledger', version: 1, books, accounts, categories, txns }, null, 2);
      },

      importJSON: (raw) => {
        try {
          const d = JSON.parse(raw);
          if (!Array.isArray(d.books) || !Array.isArray(d.accounts) || !Array.isArray(d.txns)) {
            return '文件格式不对：缺少 books / accounts / txns 字段';
          }
          set({
            books: d.books,
            accounts: d.accounts,
            categories: Array.isArray(d.categories) ? d.categories : [],
            txns: d.txns,
            activeBookId: d.books[0]?.id ?? '',
          });
          return null;
        } catch {
          return '文件不是合法的 JSON';
        }
      },

      loadDemo: () => set(createDemoData()),
    }),
    { name: 'pocket-ledger', version: 1 },
  ),
);
