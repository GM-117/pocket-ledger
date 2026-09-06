import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Txn } from '../types';
import { fmtISO, fmtMoney, parseISO, sameMonth, ymKey } from '../utils';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { TxnList } from '../components/TxnList';

const WEEK_HEADS = ['一', '二', '三', '四', '五', '六', '日'];

interface CalendarPageProps {
  onEdit: (t: Txn) => void;
}

export function CalendarPage({ onEdit }: CalendarPageProps) {
  const books = useStore((s) => s.books);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [scope, setScope] = useState(activeBookId || '__all__');
  const [selected, setSelected] = useState(() => fmtISO(new Date()));

  const scoped = useMemo(
    () => (scope === '__all__' ? txns : txns.filter((t) => t.bookId === scope)),
    [txns, scope],
  );

  /** 日 → 当日收支合计 */
  const daySums = useMemo(() => {
    const m = new Map<string, { expense: number; income: number }>();
    for (const t of scoped) {
      if (!t.date.startsWith(ymKey(month))) continue;
      if (t.type !== 'expense' && t.type !== 'income') continue;
      const cur = m.get(t.date) ?? { expense: 0, income: 0 };
      if (t.type === 'expense') cur.expense += t.amount;
      else cur.income += t.amount;
      m.set(t.date, cur);
    }
    return m;
  }, [scoped, month]);

  const monthNet = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const v of daySums.values()) {
      expense += v.expense;
      income += v.income;
    }
    return { expense: Math.round(expense * 100) / 100, income: Math.round(income * 100) / 100 };
  }, [daySums]);

  /** 月历格子：从周一开始，前后补齐 */
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list: { date: Date | null }[] = [];
    for (let i = 0; i < lead; i++) list.push({ date: null });
    for (let d = 1; d <= days; d++) list.push({ date: new Date(month.getFullYear(), month.getMonth(), d) });
    while (list.length % 7 !== 0) list.push({ date: null });
    return list;
  }, [month]);

  const todayISO = fmtISO(new Date());
  const sel = daySums.get(selected) ?? { expense: 0, income: 0 };
  const selTxns = useMemo(
    () => scoped.filter((t) => t.date === selected),
    [scoped, selected],
  );

  return (
    <>
      <div className="chips section">
        <button className={'chip' + (scope === '__all__' ? ' active' : '')} onClick={() => setScope('__all__')}>
          全部账本
        </button>
        {books.map((b) => (
          <button key={b.id} className={'chip' + (scope === b.id ? ' active' : '')} onClick={() => setScope(b.id)}>
            {b.emoji} {b.name}
          </button>
        ))}
      </div>

      <MonthSwitcher value={month} onChange={setMonth} label={`${month.getFullYear()}年${month.getMonth() + 1}月`} disableFuture />

      <div className="card section cal-card">
        <div className="cal-summary">
          <span className="neg">支出 {fmtMoney(monthNet.expense)}</span>
          <span className="pos">收入 {fmtMoney(monthNet.income)}</span>
        </div>
        <div className="cal-head">
          {WEEK_HEADS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((c, i) => {
            if (!c.date) return <span key={i} className="cal-cell blank" />;
            const iso = fmtISO(c.date);
            const sum = daySums.get(iso);
            const has = sum && (sum.expense > 0 || sum.income > 0);
            return (
              <button
                key={i}
                className={
                  'cal-cell' +
                  (iso === todayISO ? ' today' : '') +
                  (iso === selected ? ' selected' : '') +
                  (has ? ' has' : '')
                }
                onClick={() => setSelected(iso)}
              >
                <span className="cal-day">{c.date.getDate()}</span>
                {sum && sum.expense > 0 && <span className="cal-exp">−{Math.round(sum.expense)}</span>}
                {sum && sum.income > 0 && <span className="cal-inc">+{Math.round(sum.income)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-title cal-day-title">
        <span>
          {parseISO(selected).getMonth() + 1}月{parseISO(selected).getDate()}日 · 收支
          {!sameMonth(parseISO(selected), month) && '（非本月）'}
        </span>
        <span className="pair-nums">
          <span className="neg">−{fmtMoney(sel.expense)}</span>
          <span className="pos">+{fmtMoney(sel.income)}</span>
        </span>
      </div>
      <TxnList txns={selTxns} onEdit={onEdit} showBook emptyText="这一天没有记录" />
    </>
  );
}
