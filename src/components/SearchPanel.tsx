import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Txn, TxnType } from '../types';
import { fmtISO, fmtMoney, round2, startOfMonth } from '../utils';
import { Modal } from './Modal';
import { TxnList } from './TxnList';

interface SearchPanelProps {
  onEdit: (t: Txn) => void;
  onClose: () => void;
}

type TypeFilter = 'all' | TxnType;
type ReimbFilter = 'any' | 'pending' | 'done';

export function SearchPanel({ onEdit, onClose }: SearchPanelProps) {
  const txns = useStore((s) => s.txns);
  const books = useStore((s) => s.books);
  const accounts = useStore((s) => s.accounts);

  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [bookId, setBookId] = useState('__all__');
  const [accountId, setAccountId] = useState('__all__');
  const [tag, setTag] = useState('__any__');
  const [reimb, setReimb] = useState<ReimbFilter>('any');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const t of txns) for (const g of t.tags ?? []) s.add(g);
    return [...s].sort();
  }, [txns]);

  const results = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const minN = parseFloat(min);
    const maxN = parseFloat(max);
    return txns
      .filter((t) => {
        if (type !== 'all' && t.type !== type) return false;
        if (bookId !== '__all__' && t.bookId !== bookId) return false;
        if (accountId !== '__all__' && t.accountId !== accountId && t.toAccountId !== accountId) return false;
        if (start && t.date < start) return false;
        if (end && t.date > end) return false;
        if (!Number.isNaN(minN) && min !== '' && t.amount < minN) return false;
        if (!Number.isNaN(maxN) && max !== '' && t.amount > maxN) return false;
        if (tag === '__none__') {
          if ((t.tags ?? []).length > 0) return false;
        } else if (tag !== '__any__' && !(t.tags ?? []).includes(tag)) {
          return false;
        }
        if (reimb === 'pending' && t.reimb !== 'pending') return false;
        if (reimb === 'done' && t.reimb !== 'done') return false;
        if (kw) {
          const hay = `${t.note} ${t.tags?.join(' ') ?? ''}`.toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  }, [txns, keyword, type, bookId, accountId, tag, reimb, start, end, min, max]);

  const sums = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const t of results) {
      if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'income') income += t.amount;
    }
    return { expense: round2(expense), income: round2(income) };
  }, [results]);

  return (
    <Modal title="账单搜索" onClose={onClose}>
      <input
        className="search-kw"
        autoFocus
        placeholder="搜备注或标签，如：出差"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="search-grid">
        <label className="field">
          <span>类型</span>
          <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
            <option value="all">全部</option>
            <option value="expense">支出</option>
            <option value="income">收入</option>
            <option value="transfer">转账</option>
            <option value="adjust">调整</option>
          </select>
        </label>
        <label className="field">
          <span>账本</span>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="__all__">全部账本</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>账户</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="__all__">全部账户</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>标签</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="__any__">任意</option>
            <option value="__none__">无标签</option>
            {allTags.map((g) => (
              <option key={g} value={g}>
                #{g}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>开始日期</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          <span>结束日期</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label className="field">
          <span>最小金额</span>
          <input inputMode="decimal" placeholder="0" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
        <label className="field">
          <span>最大金额</span>
          <input inputMode="decimal" placeholder="不限" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
      </div>

      <div className="field">
        <span>报销状态</span>
        <div className="seg">
          <button className={reimb === 'any' ? 'active' : ''} onClick={() => setReimb('any')}>
            全部
          </button>
          <button className={reimb === 'pending' ? 'active expense' : ''} onClick={() => setReimb('pending')}>
            待报销
          </button>
          <button className={reimb === 'done' ? 'active income' : ''} onClick={() => setReimb('done')}>
            已报销
          </button>
        </div>
      </div>

      <div className="search-summary">
        <div>
          <span className="label">命中</span>
          <strong>{results.length} 笔</strong>
        </div>
        <div>
          <span className="label">支出</span>
          <strong className="neg">{fmtMoney(sums.expense)}</strong>
        </div>
        <div>
          <span className="label">收入</span>
          <strong className="pos">{fmtMoney(sums.income)}</strong>
        </div>
      </div>

      <div className="search-results">
        <TxnList txns={results} onEdit={onEdit} showBook emptyText="没有符合条件的记录" />
      </div>

      <div className="form-actions">
        <button
          className="btn ghost"
          onClick={() => {
            setKeyword('');
            setType('all');
            setBookId('__all__');
            setAccountId('__all__');
            setTag('__any__');
            setReimb('any');
            setStart('');
            setEnd('');
            setMin('');
            setMax('');
          }}
        >
          重置条件
        </button>
        <button
          className="btn primary"
          onClick={() => {
            setStart(fmtISO(startOfMonth(new Date())));
            setEnd(fmtISO(new Date()));
          }}
        >
          本月至今
        </button>
      </div>
    </Modal>
  );
}
