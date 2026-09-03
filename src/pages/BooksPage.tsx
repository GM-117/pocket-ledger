import { useMemo } from 'react';
import { useStore } from '../store';
import type { Txn } from '../types';
import { fmtISO, startOfMonth, sumIn } from '../utils';
import { TxnList } from '../components/TxnList';

interface BooksPageProps {
  onEdit: (t: Txn) => void;
  onManage: () => void;
}

export function BooksPage({ onEdit, onManage }: BooksPageProps) {
  const books = useStore((s) => s.books);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);
  const setActiveBook = useStore((s) => s.setActiveBook);

  const book = books.find((b) => b.id === activeBookId) ?? books[0];

  const bookTxns = useMemo(
    () => (book ? txns.filter((t) => t.bookId === book.id) : []),
    [txns, book],
  );

  const monthSummary = useMemo(() => {
    const start = fmtISO(startOfMonth(new Date()));
    const today = fmtISO(new Date());
    const income = sumIn(bookTxns, start, today, 'income');
    const expense = sumIn(bookTxns, start, today, 'expense');
    return { income, expense, balance: Math.round((income - expense) * 100) / 100 };
  }, [bookTxns]);

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
        <button className="book-pill manage" onClick={onManage}>
          ⚙️ 管理
        </button>
      </div>

      <div className="summary-grid section">
        <div className="stat-card income">
          <span className="label">本月收入</span>
          <span className="value">+{monthSummary.income.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card expense">
          <span className="label">本月支出</span>
          <span className="value">−{monthSummary.expense.toLocaleString('zh-CN')}</span>
        </div>
        <div className="stat-card balance">
          <span className="label">本月结余</span>
          <span className="value">{monthSummary.balance.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="section-title">
        <span>{book.emoji} {book.name} · 流水（{bookTxns.length}）</span>
      </div>
      <TxnList txns={bookTxns} onEdit={onEdit} />
    </>
  );
}
