import { useState } from 'react';
import { useStore } from '../store';
import type { Txn, TxnType } from '../types';
import { fmtISO, parseISO, round2, uid } from '../utils';

interface TransactionFormProps {
  initial: Txn | null;
  onClose: () => void;
}

/** iCost 风格快速记账面板：金额大字 + 分类宫格 + 数字键盘 */
export function TransactionForm({ initial, onClose }: TransactionFormProps) {
  const books = useStore((s) => s.books);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const activeBookId = useStore((s) => s.activeBookId);
  const saveTxn = useStore((s) => s.saveTxn);
  const removeTxn = useStore((s) => s.removeTxn);

  const [type, setType] = useState<TxnType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? '');
  const [bookId, setBookId] = useState(initial?.bookId ?? activeBookId);
  const [date, setDate] = useState(initial?.date ?? fmtISO(new Date()));
  const [note, setNote] = useState(initial?.note ?? '');
  const [metaOpen, setMetaOpen] = useState(!!initial);
  const [error, setError] = useState('');

  const cats = categories.filter((c) => c.type === type);

  const switchType = (t: TxnType) => {
    setType(t);
    setCategoryId('');
  };

  /* ---------- 数字键盘 ---------- */
  const pressKey = (k: string) => {
    setError('');
    setAmount((cur) => {
      if (k === 'del') return cur.slice(0, -1);
      if (k === 'clear') return '';
      if (k === '.') return cur.includes('.') ? cur : cur === '' ? '0.' : cur + '.';
      if (cur.includes('.') && cur.split('.')[1].length >= 2) return cur;
      if (cur.replace('.', '').length >= 9) return cur;
      if (cur === '0') return k;
      return cur + k;
    });
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('请输入金额');
    if (!categoryId) return setError('请选择分类');
    if (!accountId) return setError('请选择账户');
    saveTxn({
      id: initial?.id ?? uid(),
      bookId,
      accountId,
      categoryId,
      type,
      amount: round2(amt),
      date,
      note: note.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  };

  const del = () => {
    if (initial && window.confirm('确定删除这笔记录吗？')) {
      removeTxn(initial.id);
      onClose();
    }
  };

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedAcc = accounts.find((a) => a.id === accountId);
  const selectedBook = books.find((b) => b.id === bookId);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal kp-modal" role="dialog" aria-label="记一笔">
        <div className="kp-top">
          <button className="kp-cancel" onClick={onClose} aria-label="取消">
            ✕
          </button>
          <div className="seg kp-seg">
            <button className={type === 'expense' ? 'active expense' : ''} onClick={() => switchType('expense')}>
              支出
            </button>
            <button className={type === 'income' ? 'active income' : ''} onClick={() => switchType('income')}>
              收入
            </button>
          </div>
          {initial ? (
            <button className="kp-del" onClick={del} aria-label="删除">
              🗑
            </button>
          ) : (
            <span className="kp-placeholder" />
          )}
        </div>

        <div className={'kp-amount ' + type}>
          <span className="kp-cny">¥</span>
          <span className="kp-num">{amount || '0.00'}</span>
        </div>
        {error && <p className="form-error kp-error">{error}</p>}

        <div className="cat-grid kp-cats">
          {cats.map((c) => (
            <button
              key={c.id}
              className={'cat-chip' + (categoryId === c.id ? ' active' : '')}
              onClick={() => setCategoryId(c.id)}
            >
              <span>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>

        <div className="kp-meta">
          <button className="kp-meta-chip" onClick={() => setMetaOpen((v) => !v)}>
            <span className="kp-meta-label">账本</span>
            <select value={bookId} onClick={(e) => e.stopPropagation()} onChange={(e) => setBookId(e.target.value)}>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.emoji} {b.name}
                </option>
              ))}
            </select>
          </button>
          <button className="kp-meta-chip" onClick={() => setMetaOpen((v) => !v)}>
            <span className="kp-meta-label">账户</span>
            <select value={accountId} onClick={(e) => e.stopPropagation()} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.name}
                </option>
              ))}
            </select>
          </button>
          <button className={'kp-meta-chip' + (metaOpen ? ' open' : '')} onClick={() => setMetaOpen((v) => !v)}>
            <span className="kp-meta-label">更多</span>
            {date === fmtISO(new Date()) ? '今天' : `${parseISO(date).getMonth() + 1}/${parseISO(date).getDate()}`}
          </button>
        </div>

        {metaOpen && (
          <div className="kp-more">
            <label className="kp-field">
              <span>日期</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="kp-field">
              <span>备注</span>
              <input placeholder="记点什么…" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <p className="kp-current">
              {selectedBook?.emoji} {selectedBook?.name} · {selectedAcc?.emoji} {selectedAcc?.name}
              {selectedCat ? ` · ${selectedCat.emoji} ${selectedCat.name}` : ''}
            </p>
          </div>
        )}

        <div className="kp-grid">
          {['7', '8', '9', 'del', '4', '5', '6', 'clear', '1', '2', '3', '.', '0', '00', 'done'].map((k) => {
            if (k === 'done')
              return (
                <button key={k} className="kp-key done" onClick={submit}>
                  完成
                </button>
              );
            if (k === 'del') return <button key={k} className="kp-key op" onClick={() => pressKey(k)}>⌫</button>;
            if (k === 'clear') return <button key={k} className="kp-key op" onClick={() => pressKey(k)}>C</button>;
            return (
              <button key={k} className="kp-key" onClick={() => pressKey(k)}>
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
