import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, AccountKind, Book, Category, Recurring, Template, Txn } from './types';
import { ADJUST_CATEGORY_IN, ADJUST_CATEGORY_OUT, TRANSFER_CATEGORY_ID } from './types';
import { kindToType, normalizeAccount } from './accountCatalog';
import { addDays, fmtISO, parseISO, round2, stepFreq, uid } from './utils';

/** 确保存在余额调整专用的隐藏「其他」分类（老数据 / 导入数据补齐） */
export function ensureAdjustCategories(categories: Category[]): Category[] {
  const need: Category[] = [];
  if (!categories.some((c) => c.id === ADJUST_CATEGORY_IN)) {
    need.push({ id: ADJUST_CATEGORY_IN, name: '其他', emoji: '⚙️', type: 'income', hidden: true });
  }
  if (!categories.some((c) => c.id === ADJUST_CATEGORY_OUT)) {
    need.push({ id: ADJUST_CATEGORY_OUT, name: '其他', emoji: '⚙️', type: 'expense', hidden: true });
  }
  return need.length ? [...categories, ...need] : categories;
}

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
  /** 主题：浅色 / 深色 */
  theme: 'light' | 'dark';
  /** 模板快捷记账 */
  templates: Template[];
  /** 周期记账规则 */
  recurrences: Recurring[];
  setActiveBook: (id: string) => void;
  setBudget: (bookId: string, amount: number | null) => void;
  toggleHideAmounts: () => void;
  toggleTheme: () => void;
  addTemplate: (t: Omit<Template, 'id'>) => void;
  removeTemplate: (id: string) => void;
  saveRecurring: (r: Recurring) => void;
  removeRecurring: (id: string) => void;
  /** 应用启动时补齐周期账单（幂等） */
  runRecurrences: () => void;
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

  const mkAcc = (
    name: string,
    icon: string,
    kind: AccountKind,
    subtype: string,
    initialBalance: number,
    extra?: Partial<Account>,
  ): Account => ({
    id: uid(),
    name,
    emoji: icon,
    type: kindToType(kind),
    kind,
    subtype,
    initialBalance,
    createdAt: iso(addDays(now, -120)),
    includeInNet: true,
    canSelect: true,
    ...extra,
  });
  const accounts: Account[] = [
    mkAcc('微信零钱', '微', 'fund', 'wechat', 8000),
    mkAcc('支付宝', '支', 'fund', 'alipay', 10000),
    mkAcc('招商银行卡', '💳', 'fund', 'savings', 46000),
    mkAcc('基金账户', '📊', 'invest', 'fund', 30000),
    mkAcc('公交卡', '🚌', 'recharge', 'bus_card', 120, { note: '地铁通勤充值' }),
    mkAcc('信用卡', '💳', 'credit', 'credit_card', 12000, { note: '招行信用卡' }),
    mkAcc('老妈', '🙏', 'payable', 'borrow_in', 20000, {
      note: '装修借款',
      lendDate: iso(addDays(now, -240)),
    }),
  ];
  const [wx, ali, cmb, fund, bus, credit] = accounts;

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
  const categories = ensureAdjustCategories([...expenseCats, ...incomeCats]);
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
  const trips: [number, string, number, string[], Txn['reimb']?][] = [
    [-6, '上海出差 · 高铁', 553, ['出差', '交通'], 'pending'],
    [-7, '酒店两晚', 836, ['出差'], 'pending'],
    [-8, '客户晚宴', 486, ['出差', '招待'], 'pending'],
    [-21, '深圳出差 · 机票', 1240, ['出差'], 'done'],
    [-23, '酒店三晚', 1176, ['出差'], 'done'],
    [-40, '杭州出差 · 高铁', 219, ['出差'], 'done'],
  ];
  for (const [off, note, amt, tags, reimb] of trips) {
    const t: Txn = {
      id: uid(), bookId: work.id, type: 'expense', categoryId: off === -8 ? can.id : trip.id,
      accountId: credit.id, amount: amt, date: iso(addDays(now, off)), note, createdAt: `${iso(addDays(now, off))} 12:00`,
      tags, reimb,
    };
    txns.push(t);
  }
  addTxn(work.id, 'income', partTime, cmb, 3000, iso(addDays(now, -14)), '项目奖金');
  // 转账演示：公交卡充值、还信用卡（负债账户转入即还款）
  txns.push({
    id: uid(), bookId: life.id, type: 'transfer', categoryId: TRANSFER_CATEGORY_ID,
    accountId: wx.id, toAccountId: bus.id, amount: 100,
    date: iso(addDays(now, -12)), note: '公交卡充值', createdAt: `${iso(addDays(now, -12))} 12:00`,
  });
  txns.push({
    id: uid(), bookId: life.id, type: 'transfer', categoryId: TRANSFER_CATEGORY_ID,
    accountId: cmb.id, toAccountId: credit.id, amount: 2000,
    date: iso(addDays(now, -5)), note: '还信用卡', createdAt: `${iso(addDays(now, -5))} 12:00`,
  });
  // 日常记录点缀标签
  txns[0].tags = ['日常'];
  txns[1].tags = ['日常'];

  // 周期记账演示：视频会员（每月 15 日 ¥25），启动时自动补齐
  const recurrences: Recurring[] = [
    {
      id: uid(),
      bookId: life.id,
      accountId: ali.id,
      categoryId: fun.id,
      type: 'expense',
      amount: 25,
      note: '视频会员',
      freq: 'monthly',
      startDate: iso(new Date(now.getFullYear(), now.getMonth() - 2, 15)),
      lastGenerated: null,
      enabled: true,
    },
  ];

  // 模板快捷记账演示
  const templates: Template[] = [
    { id: uid(), name: '☕ 咖啡', type: 'expense', amount: 15, categoryId: can.id, accountId: wx.id, bookId: life.id, note: '' },
    { id: uid(), name: '💰 月度工资', type: 'income', amount: 12800, categoryId: salary.id, accountId: cmb.id, bookId: life.id, note: '月度工资' },
  ];

  return { books, accounts, categories, txns, recurrences, templates, activeBookId: books[0].id };
}

/* ------------------------------------------------------------------ */

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createDemoData(),
      budgets: {},
      hideAmounts: false,
      theme: 'light',

      setActiveBook: (id) => set({ activeBookId: id }),

      setBudget: (bookId, amount) =>
        set((s) => {
          const budgets = { ...s.budgets };
          if (amount === null || amount <= 0) delete budgets[bookId];
          else budgets[bookId] = round2(amount);
          return { budgets };
        }),

      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      addTemplate: (t) =>
        set((s) => ({ templates: [...s.templates, { ...t, id: uid() }] })),

      removeTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      saveRecurring: (r) =>
        set((s) => ({
          recurrences: s.recurrences.some((x) => x.id === r.id)
            ? s.recurrences.map((x) => (x.id === r.id ? r : x))
            : [...s.recurrences, r],
        })),

      removeRecurring: (id) =>
        set((s) => ({ recurrences: s.recurrences.filter((r) => r.id !== id) })),

      runRecurrences: () => {
        const s = get();
        if (s.recurrences.length === 0) return;
        const todayISO = fmtISO(new Date());
        const seen = new Set(
          s.txns.map((t) => (t.recurrenceId ? `${t.recurrenceId}:${t.date}` : t.id)),
        );
        const additions: Txn[] = [];
        const progress: Record<string, string> = {};
        for (const r of s.recurrences) {
          if (!r.enabled) continue;
          const out: string[] = [];
          let d = parseISO(r.startDate);
          let guard = 0;
          while (guard++ < 500) {
            const iso = fmtISO(d);
            if (iso > todayISO) break;
            if (!r.lastGenerated || iso > r.lastGenerated) out.push(iso);
            d = stepFreq(d, r.freq);
          }
          // 追账上限 60 条，避免久未打开时爆量
          for (const date of out.slice(-60)) {
            const key = `${r.id}:${date}`;
            if (seen.has(key)) continue;
            seen.add(key);
            additions.push({
              id: uid(),
              bookId: r.bookId,
              accountId: r.accountId,
              categoryId: r.categoryId,
              type: r.type,
              amount: r.amount,
              date,
              note: r.note,
              createdAt: new Date().toISOString(),
              recurrenceId: r.id,
            });
            progress[r.id] = date;
          }
        }
        if (additions.length === 0) return;
        set((st) => ({
          txns: [...st.txns, ...additions],
          recurrences: st.recurrences.map((r) =>
            progress[r.id] ? { ...r, lastGenerated: progress[r.id] } : r,
          ),
        }));
      },

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
          // 同时清理本账户流水与转入本账户的转账（避免悬挂的 toAccountId）
          txns: s.txns.filter((t) => t.accountId !== id && t.toAccountId !== id),
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
        return JSON.stringify({ app: 'pocket-ledger', version: 2, books, accounts, categories, txns }, null, 2);
      },

      importJSON: (raw) => {
        try {
          const d = JSON.parse(raw);
          if (!Array.isArray(d.books) || !Array.isArray(d.accounts) || !Array.isArray(d.txns)) {
            return '文件格式不对：缺少 books / accounts / txns 字段';
          }
          set({
            books: d.books,
            accounts: d.accounts.map((a: Partial<Account> & Pick<Account, 'id' | 'name'>) => normalizeAccount(a)),
            categories: ensureAdjustCategories(Array.isArray(d.categories) ? d.categories : []),
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
    {
      name: 'pocket-ledger',
      version: 2,
      // v1 → v2：账户补充 kind/subtype/includeInNet/canSelect 字段
      migrate: (persisted) => {
        const s = persisted as Partial<StoreState> & { accounts?: Partial<Account>[] };
        if (Array.isArray(s.accounts)) {
          s.accounts = s.accounts
            .filter((a) => a && typeof a.id === 'string')
            .map((a) => normalizeAccount(a as Partial<Account> & Pick<Account, 'id' | 'name'>));
        }
        if (Array.isArray(s.categories)) {
          s.categories = ensureAdjustCategories(s.categories);
        }
        return s as StoreState;
      },
    },
  ),
);
