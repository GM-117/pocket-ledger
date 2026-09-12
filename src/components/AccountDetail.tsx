import { useEffect, useMemo, useState } from 'react';
import { accountIcon } from '../accountCatalog';
import { useStore } from '../store';
import { ADJUST_CATEGORY_IN, type Account, type Txn } from '../types';
import { accountBalance, createdTs, fmtHm, fmtMoney, fmtSigned, lockBodyScroll, pad, parseISO, round2, unlockBodyScroll } from '../utils';
import { BalanceAdjustModal } from './BalanceAdjustModal';
import { TxnDetail } from './TxnDetail';
import { ChevronDownIcon, ChevronLeftIcon, FileTextIcon, InboxIcon, LIcon, PencilIcon, TrashIcon } from './icons';

interface AccountDetailProps {
  account: Account;
  onClose: () => void;
  /** 账单详情「编辑」→ 打开记账面板 */
  onEditTxn: (t: Txn) => void;
  /** 记一笔（预填本账户） */
  onQuickAdd: (preset: Txn) => void;
  /** 更多菜单 → 修改账户 */
  onEditAccount: (a: Account) => void;
}

interface DayGroup {
  date: string;
  items: { t: Txn; bal: number; created?: boolean }[];
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

/** iCost 式账户详情：账户卡 + 按月折叠的收支流水（带每笔后的余额与「账户创建」条目） */
export function AccountDetail({ account: a, onClose, onEditTxn, onQuickAdd, onEditAccount }: AccountDetailProps) {
  const txns = useStore((s) => s.txns);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const saveAccount = useStore((s) => s.saveAccount);
  const removeAccount = useStore((s) => s.removeAccount);

  const [openMonths, setOpenMonths] = useState<Set<string> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [txnDetailId, setTxnDetailId] = useState<string | null>(null);
  const [createdDetail, setCreatedDetail] = useState(false);

  // 覆盖页打开期间锁定背景滚动（计数式，叠加页共用）
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  // 账户详情随账本走：只展示当前账本名下与该账户相关的流水（余额口径与资产页一致）
  const accTxns = useMemo(
    () =>
      txns.filter(
        (t) => t.bookId === activeBookId && (t.accountId === a.id || t.toAccountId === a.id),
      ),
    [txns, a.id, activeBookId],
  );
  const balance = useMemo(() => accountBalance(a, accTxns), [a, accTxns]);
  const icon = accountIcon(a);

  const months = useMemo<MonthBucket[]>(() => {
    // 期初余额不为 0 时，注入一条「账户创建」虚拟流水（黄色，不计入流出/流入）
    const created: Txn | null =
      Math.abs(a.initialBalance) > 0.001
        ? {
            id: '__created__',
            bookId: '',
            accountId: a.id,
            categoryId: '',
            type: 'income',
            amount: Math.abs(a.initialBalance),
            date: a.createdAt.slice(0, 10),
            note: `初始${a.type === 'liability' ? '欠款' : '余额'}为 ${fmtSigned(a.initialBalance)}`,
            createdAt: a.createdAt,
          }
        : null;
    const asc = [...accTxns].sort((x, y) =>
      x.date === y.date ? createdTs(x.createdAt) - createdTs(y.createdAt) : x.date.localeCompare(y.date),
    );
    const all = created ? [created, ...asc] : asc;

    const dir = a.type === 'liability' ? -1 : 1;
    let b = 0;
    const balMap = new Map<string, number>();
    for (const t of all) {
      if (t.id === '__created__') {
        b = a.initialBalance;
      } else if (t.type === 'adjust') {
        // 调整差额已并入期初余额，此处仅留痕，不改变运行余额
      } else if (t.type === 'transfer') {
        if (t.accountId === a.id) b -= dir * t.amount;
        if (t.toAccountId === a.id) b += dir * t.amount;
      } else {
        b += dir * (t.type === 'income' ? t.amount : -t.amount);
      }
      balMap.set(t.id, round2(b));
    }

    const byMonth = new Map<string, Txn[]>();
    for (const t of all) {
      const ym = t.date.slice(0, 7);
      (byMonth.get(ym) ?? byMonth.set(ym, []).get(ym)!).push(t);
    }
    return [...byMonth.entries()]
      .sort((x, y) => y[0].localeCompare(x[0]))
      .map(([ym, list]) => {
        const [y, m] = ym.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const real = list.filter((t) => t.id !== '__created__');
        const byDay = new Map<string, Txn[]>();
        for (const t of [...list].sort((x, y2) =>
          x.date === y2.date ? createdTs(y2.createdAt) - createdTs(x.createdAt) : y2.date.localeCompare(x.date),
        )) {
          (byDay.get(t.date) ?? byDay.set(t.date, []).get(t.date)!).push(t);
        }
        const days: DayGroup[] = [...byDay.entries()].map(([date, items]) => ({
          date,
          items: items.map((t) => ({
            t,
            bal: balMap.get(t.id) ?? 0,
            created: t.id === '__created__',
          })),
          out: round2(items.filter((t) => t.id !== '__created__' && outFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
          in: round2(items.filter((t) => t.id !== '__created__' && inFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
        }));
        return {
          ym,
          label: `${y} 年 ${m} 月`,
          range: `${pad(m)}月01日 - ${pad(m)}月${lastDay}日`,
          days,
          out: round2(real.filter((t) => outFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
          in: round2(real.filter((t) => inFlow(a, t)).reduce((s, t) => s + t.amount, 0)),
        };
      });
  }, [accTxns, a]);

  // 默认展开最近有记录的月份
  const effectiveOpen = openMonths ?? new Set(months.length ? [months[0].ym] : []);
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
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-page">
      <div className="page-head">
        <button className="page-back" onClick={onClose}>
          <ChevronLeftIcon size={17} /> 资产
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
              <LIcon emoji={icon.icon} size={24} />
            </span>
            <span className="acc-hero-name">
              {a.name}
              {!a.includeInNet && <span className="badge-off">不计入</span>}
            </span>
            <span className="acc-more-wrap">
              <button className="chip" onClick={() => setMenuOpen((v) => !v)}>
                更多
              </button>
              {menuOpen && <div className="pop-mask" onClick={() => setMenuOpen(false)} />}
              {menuOpen && (
                <div className="acc-menu">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditAccount(a);
                    }}
                  >
                    <PencilIcon size={15} /> 修改账户
                  </button>
                  <button className="danger" onClick={del}>
                    <TrashIcon size={15} /> 删除账户
                  </button>
                </div>
              )}
            </span>
          </div>
          <div className="acc-hero-label">账户余额（CNY）</div>
          <button className="acc-hero-balance" onClick={() => setAdjustOpen(true)} title="调整余额">
            {fmtSigned(balance)}
            <span className="acc-pencil"><PencilIcon size={14} /></span>
          </button>
        </div>

        {months.length === 0 && (
          <div className="empty">
            <span className="empty-emoji"><InboxIcon size={44} /></span>
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
                <ChevronDownIcon size={16} className={'type-chev' + (open ? ' open' : '')} />
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
                      {d.items.map(({ t, bal, created }) => {
                        if (created) {
                          return (
                            <button className="txn-row" key={t.id} onClick={() => setCreatedDetail(true)}>
                              <span className="emoji-dot created"><FileTextIcon size={18} /></span>
                              <span className="txn-main">
                                <span className="txn-cat">账户创建</span>
                                <span className="txn-sub">
                                  {t.date.slice(5)} {fmtHm(t.createdAt)} · {t.note}
                                </span>
                              </span>
                              <span className="txn-right">
                                <span className="amount created">{fmtSigned(a.initialBalance)}</span>
                                <span className="txn-balance">余额: {fmtSigned(bal)}</span>
                              </span>
                            </button>
                          );
                        }
                        const isTransfer = t.type === 'transfer';
                        const isAdjust = t.type === 'adjust';
                        const adjustIn = isAdjust && t.categoryId === ADJUST_CATEGORY_IN;
                        const transferIn = isTransfer && t.toAccountId === a.id;
                        const cat = catMap.get(t.categoryId);
                        const from = accMap.get(t.accountId);
                        const to = accMap.get(t.toAccountId ?? '');
                        const book = bookMap.get(t.bookId);
                        const hm = fmtHm(t.createdAt);
                        return (
                          <button className="txn-row" key={t.id} onClick={() => setTxnDetailId(t.id)}>
                            <span className={'emoji-dot ' + (isTransfer ? 'transfer' : isAdjust ? 'adjust' : t.type)}>
                              <LIcon emoji={isTransfer ? '🔁' : isAdjust ? '⚙️' : cat?.emoji} size={18} />
                            </span>
                            <span className="txn-main">
                              <span className="txn-cat">
                                {isTransfer ? '转账' : isAdjust ? '余额调整' : cat?.name ?? '未知分类'}
                                {book && (
                                  <span className="txn-book" style={{ color: book.color }}>
                                    <LIcon emoji={book.emoji} size={11} /> {book.name}
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
                                className={
                                  'amount ' +
                                  (isTransfer
                                    ? transferIn
                                      ? 'pos'
                                      : 'neg'
                                    : isAdjust
                                      ? 'adj'
                                      : t.type === 'income'
                                        ? 'pos'
                                        : 'neg')
                                }
                              >
                                {isAdjust ? (adjustIn ? '+' : '−') : t.type === 'income' || transferIn ? '+' : '−'}
                                {fmtMoney(t.amount)}
                              </span>
                              <span className="txn-balance">余额: {fmtSigned(bal)}</span>
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

      {adjustOpen && <BalanceAdjustModal account={a} onClose={() => setAdjustOpen(false)} />}
      {txnDetailId && (
        <TxnDetail
          txnId={txnDetailId}
          backLabel="账户详情"
          onClose={() => setTxnDetailId(null)}
          onEdit={onEditTxn}
        />
      )}
      {createdDetail && (
        <TxnDetail createdAccount={a} backLabel="账户详情" onClose={() => setCreatedDetail(false)} />
      )}
      </div>
    </>
  );
}
