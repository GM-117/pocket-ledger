import { useState } from 'react';
import { useStore } from '../store';
import type { Txn, TxnType } from '../types';
import { fmtISO, round2, uid } from '../utils';
import { Modal } from './Modal';

interface TransactionFormProps {
  initial: Txn | null;
  onClose: () => void;
}

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
  const [error, setError] = useState('');

  const cats = categories.filter((c) => c.type === type);

  const switchType = (t: TxnType) => {
    setType(t);
    setCategoryId('');
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('请输入正确的金额');
    if (!categoryId) return setError('请选择一个分类');
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

  return (
    <Modal title={initial ? '编辑记录' : '记一笔'} onClose={onClose}>
      <div className="seg">
        <button className={type === 'expense' ? 'active expense' : ''} onClick={() => switchType('expense')}>
          支出
        </button>
        <button className={type === 'income' ? 'active income' : ''} onClick={() => switchType('income')}>
          收入
        </button>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>金额</span>
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="field">
          <span>日期</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>账户</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>账本</span>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field">
        <span>分类</span>
        <div className="cat-grid">
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
      </div>

      <label className="field">
        <span>备注（可选）</span>
        <input placeholder="记点什么…" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        {initial && (
          <button className="btn danger" onClick={del}>
            删除
          </button>
        )}
        <button className="btn ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn primary" onClick={submit}>
          保存
        </button>
      </div>
    </Modal>
  );
}
