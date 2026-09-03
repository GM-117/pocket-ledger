import { useMemo } from 'react';
import { useStore } from '../store';
import type { Txn } from '../types';
import { fmtDayLabel, fmtMoney } from '../utils';

interface TxnListProps {
  txns: Txn[];
  onEdit: (t: Txn) => void;
  /** 是否显示流水所属账本标记（跨账本列表用） */
  showBook?: boolean;
  emptyText?: string;
}

interface Group {
  date: string;
  items: Txn[];
  net: number;
}

export function TxnList({ txns, onEdit, showBook = false, emptyText }: TxnListProps) {
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const books = useStore((s) => s.books);

  const groups = useMemo<Group[]>(() => {
    const sorted = [...txns].sort((a, b) =>
      a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
    );
    const map = new Map<string, Txn[]>();
    for (const t of sorted) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return [...map.entries()].map(([date, items]) => ({
      date,
      items,
      net: items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    }));
  }, [txns]);

  if (txns.length === 0) {
    return (
      <div className="empty">
        <span className="empty-emoji">🪹</span>
        <p>{emptyText ?? '还没有记录，点右下角「＋」记一笔吧'}</p>
      </div>
    );
  }

  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const bookMap = new Map(books.map((b) => [b.id, b]));

  return (
    <div className="txn-list">
      {groups.map((g) => (
        <div className="txn-group" key={g.date}>
          <div className="txn-group-head">
            <span>{fmtDayLabel(g.date)}</span>
            <span className={g.net >= 0 ? 'pos' : 'neg'}>
              {g.net >= 0 ? '+' : '−'}
              {fmtMoney(g.net)}
            </span>
          </div>
          {g.items.map((t) => {
            const cat = catMap.get(t.categoryId);
            const acc = accMap.get(t.accountId);
            const book = showBook ? bookMap.get(t.bookId) : undefined;
            return (
              <button className="txn-row" key={t.id} onClick={() => onEdit(t)}>
                <span className={'emoji-dot ' + t.type}>{cat?.emoji ?? '❓'}</span>
                <span className="txn-main">
                  <span className="txn-cat">
                    {cat?.name ?? '未知分类'}
                    {book && (
                      <span className="txn-book" style={{ color: book.color }}>
                        {book.emoji} {book.name}
                      </span>
                    )}
                  </span>
                  <span className="txn-sub">
                    {acc?.name ?? '未知账户'}
                    {t.note ? ` · ${t.note}` : ''}
                  </span>
                </span>
                <span className={'amount ' + (t.type === 'income' ? 'pos' : 'neg')}>
                  {t.type === 'income' ? '+' : '−'}
                  {fmtMoney(t.amount)}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
