import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Txn, TxnType } from '../types';
import { endOfMonth, fmtISO, fmtMoney, sameMonth, startOfMonth, sumIn, ymKey } from '../utils';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { Modal } from '../components/Modal';
import { RecurringManager } from '../components/RecurringManager';
import { SearchPanel } from '../components/SearchPanel';
import { TxnList } from '../components/TxnList';

interface DetailPageProps {
  onEdit: (t: Txn) => void;
  onManage: () => void;
  onUseTemplate: (preset: Txn) => void;
}

export function DetailPage({ onEdit, onManage, onUseTemplate }: DetailPageProps) {
  const books = useStore((s) => s.books);
  const txns = useStore((s) => s.txns);
  const budgets = useStore((s) => s.budgets);
  const templates = useStore((s) => s.templates);
  const removeTemplate = useStore((s) => s.removeTemplate);
  const activeBookId = useStore((s) => s.activeBookId);
  const setActiveBook = useStore((s) => s.setActiveBook);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [tplManageOpen, setTplManageOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [flowFilter, setFlowFilter] = useState<'all' | TxnType>('all');

  const book = books.find((b) => b.id === activeBookId) ?? books[0];
  const budget = book ? budgets[book.id] ?? 0 : 0;

  const monthTxns = useMemo(
    () => (book ? txns.filter((t) => t.bookId === book.id && t.date.startsWith(ymKey(month))) : []),
    [txns, book, month],
  );

  const summary = useMemo(() => {
    const start = fmtISO(month);
    const end = fmtISO(endOfMonth(month));
    const expense = sumIn(monthTxns, start, end, 'expense');
    const income = sumIn(monthTxns, start, end, 'income');
    return { expense, income, balance: Math.round((income - expense) * 100) / 100 };
  }, [monthTxns, month]);

  const flowTxns = useMemo(
    () => (flowFilter === 'all' ? monthTxns : monthTxns.filter((t) => t.type === flowFilter)),
    [monthTxns, flowFilter],
  );

  if (!book) {
    return (
      <div className="empty">
        <span className="empty-emoji">📒</span>
        <p>还没有账本，先创建一个吧</p>
        <button className="btn primary" onClick={onManage}>
          去创建账本
        </button>
      </div>
    );
  }

  const isCurrentMonth = sameMonth(month, new Date());
  const budgetLeft = Math.round((budget - summary.expense) * 100) / 100;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((summary.expense / budget) * 100)) : 0;

  return (
    <>
      <div className="book-pills scroll-x">
        {books.map((b) => {
          const active = b.id === book.id;
          return (
            <button
              key={b.id}
              className={'book-pill' + (active ? ' active' : '')}
              style={active ? { color: b.color } : undefined}
              onClick={() => setActiveBook(b.id)}
            >
              <span>{b.emoji}</span>
              {b.name}
            </button>
          );
        })}
        <button className="book-pill manage" onClick={() => setSearchOpen(true)}>
          🔍 搜索
        </button>
        <button className="book-pill manage" onClick={() => setRecurringOpen(true)}>
          🔁 周期
        </button>
        <button className="book-pill manage" onClick={onManage}>
          ⚙️ 管理
        </button>
      </div>

      {templates.length > 0 && (
        <div className="tpl-row scroll-x">
          {templates.map((t) => (
            <button key={t.id} className="tpl-chip" onClick={() => onUseTemplate(templateToPreset(t))}>
              <b>{t.name}</b> {fmtMoney(t.amount)}
            </button>
          ))}
          <button className="tpl-chip manage" onClick={() => setTplManageOpen(true)}>
            管理
          </button>
        </div>
      )}

      <MonthSwitcher value={month} onChange={setMonth} label={`${month.getFullYear()}年${month.getMonth() + 1}月`} disableFuture />

      <div className="summary-grid section">
        <div className="stat-card expense">
          <span className="label">{isCurrentMonth ? '本月支出' : '支出'}</span>
          <span className="value">−{summary.expense.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card income">
          <span className="label">{isCurrentMonth ? '本月收入' : '收入'}</span>
          <span className="value">+{summary.income.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card balance">
          <span className="label">结余</span>
          <span className="value">{summary.balance.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      {budget > 0 && (
        <div className="card budget-card section">
          <div className="budget-head">
            <span>月度预算 · {book.name}</span>
            <button className="chip" onClick={() => setBudgetOpen(true)}>
              设置
            </button>
          </div>
          <div className="budget-track">
            <div
              className={'budget-bar' + (budgetLeft < 0 ? ' over' : budgetPct > 80 ? ' warn' : '')}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="budget-nums">
            <span>已用 {fmtMoney(summary.expense)}</span>
            <span className={budgetLeft < 0 ? 'neg' : 'muted'}>
              {budgetLeft < 0 ? `超支 ${fmtMoney(-budgetLeft)}` : `剩余 ${fmtMoney(budgetLeft)}`}
            </span>
          </div>
        </div>
      )}
      {budget <= 0 && (
        <button className="account-add section" onClick={() => setBudgetOpen(true)}>
          🎯 给「{book.name}」设个月度预算
        </button>
      )}

      <div className="section-title">
        <span>
          {book.emoji} {book.name} · 流水（{flowTxns.length}）
        </span>
        <div className="chips">
          {(
            [
              ['all', '全部'],
              ['expense', '支出'],
              ['income', '收入'],
              ['transfer', '转账'],
              ['adjust', '调整'],
            ] as ['all' | TxnType, string][]
          ).map(([k, label]) => (
            <button key={k} className={'chip' + (flowFilter === k ? ' active' : '')} onClick={() => setFlowFilter(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <TxnList txns={flowTxns} onEdit={onEdit} emptyText="这个月还没有记录，点右下角「＋」记一笔吧" />

      {budgetOpen && (
        <BudgetModal bookId={book.id} bookName={book.name} current={budget} onClose={() => setBudgetOpen(false)} />
      )}
      {recurringOpen && <RecurringManager bookId={book.id} onClose={() => setRecurringOpen(false)} />}
      {searchOpen && <SearchPanel onEdit={onEdit} onClose={() => setSearchOpen(false)} />}
      {tplManageOpen && (
        <Modal title="模板管理" onClose={() => setTplManageOpen(false)}>
          <div className="recur-list">
            {templates.map((t) => (
              <div className="recur-row" key={t.id}>
                <span className="emoji-dot expense">{t.name.slice(0, 2)}</span>
                <span className="txn-main">
                  <span className="txn-cat">{t.name}</span>
                  <span className="txn-sub">
                    {t.type === 'income' ? '收入' : '支出'} · {fmtMoney(t.amount)}
                  </span>
                </span>
                <button className="icon-btn" onClick={() => removeTemplate(t.id)} aria-label="删除">
                  🗑️
                </button>
              </div>
            ))}
            {templates.length === 0 && <p className="empty-text">还没有模板，记一笔时点「⭐ 存为模板」创建</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

function templateToPreset(t: { type: Txn['type']; amount: number; categoryId: string; accountId: string; bookId: string; note: string }): Txn {
  return {
    id: '',
    bookId: t.bookId,
    accountId: t.accountId,
    categoryId: t.categoryId,
    type: t.type,
    amount: t.amount,
    date: fmtISO(new Date()),
    note: t.note,
    createdAt: '',
  };
}

function BudgetModal({ bookId, bookName, current, onClose }: { bookId: string; bookName: string; current: number; onClose: () => void }) {
  const setBudget = useStore((s) => s.setBudget);
  const [val, setVal] = useState(current ? String(current) : '');

  const save = () => {
    const n = parseFloat(val);
    setBudget(bookId, Number.isNaN(n) ? null : n);
    onClose();
  };

  return (
    <Modal title={`月度预算 · ${bookName}`} onClose={onClose}>
      <label className="field">
        <span>每月总预算金额（清空即为取消预算）</span>
        <input autoFocus inputMode="decimal" placeholder="0.00" value={val} onChange={(e) => setVal(e.target.value)} />
      </label>
      <div className="form-actions">
        <button className="btn ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn primary" onClick={save}>
          保存
        </button>
      </div>
    </Modal>
  );
}
