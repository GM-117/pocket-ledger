import { useMemo, useState } from 'react';
import { accountIcon } from '../accountCatalog';
import { useStore } from '../store';
import type { Account, Txn } from '../types';
import { accountBalance, fmtHm, fmtMoney, pad, parseISO, round2 } from '../utils';

interface AccountDetailProps {
  account: Account;
  onClose: () => void;
  /** 点击流水 → 编辑 */
  onEditTxn: (t: Txn) => void;
  /** 记一笔（预填本账户） */
  onQuickAdd: (preset: Txn) => void;
  /** 更多菜单 → 编辑账户 */
  onEditAccount: (a: Account) => void;
}

interface DayGroup {
  date: string;
  items: { t: Txn; bal: number }[];
  out: number;
  in: number;
}

interface MonthBucket {
  ym: string;
  label: string;
  range: string;
  days: DayGroup[];
  out: number;
  in: number;
}

const outFlow = (a: Account, t: Txn) =>
  t.type === 'expense' || (t.type === 'transfer' && t.accountId === a.id);
const inFlow = (a: Account, t: Txn) =>
  t.type === 'income' || (t.type === 'transfer' && t.toAccountId === a.id);

/** iCost 式账户详情：账户卡 + 按月折叠的收支流水（带每笔后的余额） */
export function AccountDetail({ account: a, onClose, onEditTxn, onQuickAdd, onEditAccount }: AccountDetailProps) {
  const txns = useStore((s) => s.txns);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const books = useStore((s) => s.books);
  const saveAccount = useStore((s) => s.saveAccount);
  const removeAccount = useStore((s) => s.removeAccount);

  const [openMonths, setOpenMonths] = useState<Set<string> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const activeBookId = useStore((s) => s.activeBookId);

  const accTxns = useMemo(
    () => txns.filter((t) => t.accountId === a.id || t.toAccountId === a.id),
    [txns, a.id],
  );
  const balance = useMemo(() => accountBalance(a, txns), [a, txns]);
  const icon = accountIcon(a);

  const months = useMemo<MonthBucket[]>(() => {
    // 正序累加出每笔之后的账户余额
    const asc = [...accTxns].sort((x, y) =>
      x.date === y.date ? (x.createdAt || '').localeCompare(y.createdAt || '') : x.date.localeCompare(y.date),
    );
    const dir = a.type === 'liability' ? -1 : 1;
    let b = a.initialBalance;
    const balMap = new Map<string, number>();
    for (const t of asc) {
      if (t.type === 'transfer') {
        if (t.accountId === a.id) b -= dir * t.amount;
        if (t.toAccountId === a.id) b += dir * t.amount;
      } else {
        b += dir * (t.type === 'income' ? t.amount : -t.amount);
      }
      balMap.set(t.id, round2(b));
    }

    const byMonth = new Map<string, Txn[]>();
    for (const t of asc) {
      const ym = t.date.slice(0, 7);
      (byMonth.get(ym) ?? byMonth.set(ym, []).get(ym)!).push(t);
    }
    return [...byMonth.entries()]
      .sort((x, y) => y[0].localeCompare(x[0]))
      .map(([ym, list]) => {
        const [y, m] = ym.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const byDay = new Map<string, Txn[]>();
        for (const t of [...list].sort((x, y2) =>
          x.date === y2.date ? (y2.createdAt || '').localeCompare(x.createdAt || '') : y2.date.localeCompare(x.date),
        )) {
          (byDay.get(t.date) ?? byDay.set(t.date, []).get(t.date)!).push(t);
        }
        const days: DayGroup[] = [...byDay.entries()].map(([date, items]) => ({
          date,
          items: items.map((t) => ({ t, bal: balMap.get(t.id) ?? 0 })),
          out: round2(items.filter((t) => outFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
          in: round2(items.filter((t) => inFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
        }));
        return {
          ym,
          label: `${y} 年 ${m} 月`,
          range: `${pad(m)}月01日 - ${pad(m)}月${lastDay}日`,
          days,
          out: round2(list.filter((t) => outFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
          in: round2(list.filter((t) => inFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
        };
      });
  }, [accTxns, a]);

  // 默认展开最近有记录的月份
  const effectiveOpen =
    openMonths ?? new Set(months.length ? [months[0].ym] : []);
  const toggleMonth = (ym: string) => {
    const next = new Set(effectiveOpen);
    if (next.has(ym)) next.delete(ym);
    else next.add(ym);
    setOpenMonths(next);
  };

  const accMap = new Map(accounts.map((x) => [x.id, x]));
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const del = () => {
    setMenuOpen(false);
    if (window.confirm(`确定删除账户「${a.name}」吗？其名下流水也会一并删除。`)) {
      removeAccount(a.id);
      onClose();
    }
  };

  return (
    <div className="overlay-page">
      <div className="page-head">
        <button className="page-back" onClick={onClose}>
          ‹ 资产
        </button>
        <span className="page-title">账户详情</span>
        <button
          className="page-action"
          onClick={() => {
            onQuickAdd({
              id: '',
              bookId: activeBookId || books[0]?.id || '',
              accountId: a.id,
              categoryId: '',
              type: 'expense',
              amount: 0,
              date: new Date().toISOString().slice(0, 10),
              note: '',
              createdAt: '',
            });
          }}
        >
          记一笔
        </button>
      </div>

      <div className="page-body">
        <div className="card acc-hero">
          <div className="acc-hero-head">
            <span className="icon-circle xl" style={{ background: icon.color + '22', color: icon.color }}>
              {icon.icon}
            </span>
            <span className="acc-hero-name">
              {a.name}
              {!a.includeInNet && <span className="badge-off">不计入</span>}
            </span>
            <span className="acc-more-wrap">
              <button className="chip" onClick={() => setMenuOpen((v) => !v)}>
                更多
              </button>
              {menuOpen && (
                <div className="acc-menu">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditAccount(a);
                    }}
                  >
                    ✏️ 编辑账户
                  </button>
                  <button className="danger" onClick={del}>
                    🗑 删除账户
                  </button>
                </div>
              )}
            </span>
          </div>
          <div className="acc-hero-label">账户余额（CNY）</div>
          <button className="acc-hero-balance" onClick={() => setAdjustOpen(true)} title="调整余额">
            {fmtMoney(balance)}
            <span className="acc-pencil">✏️</span>
          </button>
        </div>

        {months.length === 0 && (
          <div className="empty">
            <span className="empty-emoji">🪹</span>
            <p>这个账户还没有收支记录</p>
          </div>
        )}

        {months.map((m) => {
          const open = effectiveOpen.has(m.ym);
          return (
            <div className="month-card" key={m.ym}>
              <button className="month-head" onClick={() => toggleMonth(m.ym)}>
                <span className="month-title">
                  {m.label}
                  <em>{m.range}</em>
                </span>
                <span className="month-flows">
                  <span className="neg">流出: {fmtMoney(m.out)}</span>
                  <span className="pos">流入: {fmtMoney(m.in)}</span>
                </span>
                <span className={'type-chev' + (open ? ' open' : '')}>⌄</span>
              </button>
              {open && (
                <div className="month-body">
                  {m.days.map((d) => (
                    <div className="day-group" key={d.date}>
                      <div className="day-head">
                        <span>{d.date.slice(5)} 星期{'日一二三四五六'[parseISO(d.date).getDay()]}</span>
                        <span className="day-flows">
                          流出: {fmtMoney(d.out)} 流入: {fmtMoney(d.in)}
                        </span>
                      </div>
                      {d.items.map(({ t, bal }) => {
                        const isTransfer = t.type === 'transfer';
                        const cat = catMap.get(t.categoryId);
                        const from = accMap.get(t.accountId);
                        const to = accMap.get(t.toAccountId ?? '');
                        const book = bookMap.get(t.bookId);
                        const hm = fmtHm(t.createdAt);
                        return (
                          <button className="txn-row" key={t.id} onClick={() => onEditTxn(t)}>
                            <span className={'emoji-dot ' + (isTransfer ? 'transfer' : t.type)}>
                              {isTransfer ? '🔁' : cat?.emoji ?? '❓'}
                            </span>
                            <span className="txn-main">
                              <span className="txn-cat">
                                {isTransfer ? '转账' : cat?.name ?? '未知分类'}
                                {book && (
                                  <span className="txn-book" style={{ color: book.color }}>
                                    {book.emoji} {book.name}
                                  </span>
                                )}
                              </span>
                              <span className="txn-sub">
                                {t.date.slice(5)} {hm}
                                {isTransfer && from && to
                                  ? ` · ${from.name} → ${to.name}`
                                  : t.note
                                    ? ` · ${t.note}`
                                    : ''}
                              </span>
                            </span>
                            <span className="txn-right">
                              <span
                                className={'amount ' + (isTransfer ? 'trf' : t.type === 'income' ? 'pos' : 'neg')}
                              >
                                {t.type === 'income' ? '+' : isTransfer ? '' : '−'}
                                {fmtMoney(t.amount)}
                              </span>
                              <span className="txn-balance">余额: {fmtMoney(bal)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adjustOpen && (
        <BalanceAdjustModal
          account={a}
          current={balance}
          onSave={(target) => {
            const delta = round2(target - balance);
            saveAccount({ ...a, initialBalance: round2(a.initialBalance + delta) });
            setAdjustOpen(false);
          }}
          onClose={() => setAdjustOpen(false)}
        />
      )}
    </div>
  );
}

function BalanceAdjustModal({
  account,
  current,
  onSave,
  onClose,
}: {
  account: Account;
  current: number;
  onSave: (target: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState('');
  const n = parseFloat(val);
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="余额调整">
        <div className="modal-head">
          <h3>余额调整 · {account.name}</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <p className="field-hint">当前余额 {fmtMoney(current)}，输入目标余额，将按差额调整期初余额（不影响已有流水）</p>
        <label className="field">
          <span>目标余额</span>
          <input autoFocus inputMode="decimal" placeholder="0.00" value={val} onChange={(e) => setVal(e.target.value)} />
        </label>
        <div className="form-actions">
          <button className="btn ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn primary" disabled={!Number.isFinite(n)} onClick={() => onSave(n)}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
