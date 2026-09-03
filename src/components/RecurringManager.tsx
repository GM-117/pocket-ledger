import { useState } from 'react';
import { useStore } from '../store';
import { FREQ_LABEL, type CategoryType, type Freq, type Recurring } from '../types';
import { fmtISO, fmtMoney, round2, uid } from '../utils';
import { Modal } from './Modal';

const FREQS: Freq[] = ['daily', 'weekly', 'monthly', 'yearly'];

interface RecurringManagerProps {
  bookId: string;
  onClose: () => void;
}

export function RecurringManager({ bookId, onClose }: RecurringManagerProps) {
  const recurrences = useStore((s) => s.recurrences);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const saveRecurring = useStore((s) => s.saveRecurring);
  const removeRecurring = useStore((s) => s.removeRecurring);

  const [type, setType] = useState<CategoryType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [freq, setFreq] = useState<Freq>('monthly');
  const [startDate, setStartDate] = useState(fmtISO(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const cats = categories.filter((c) => c.type === type);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('请输入金额');
    if (!categoryId) return setError('请选择分类');
    saveRecurring({
      id: uid(),
      bookId,
      accountId,
      categoryId,
      type,
      amount: round2(amt),
      note: note.trim(),
      freq,
      startDate,
      lastGenerated: null,
      enabled: true,
    });
    setAmount('');
    setCategoryId('');
    setNote('');
    setError('');
  };

  return (
    <Modal title="周期记账" onClose={onClose}>
      <div className="seg">
        <button className={type === 'expense' ? 'active expense' : ''} onClick={() => setType('expense')}>
          支出
        </button>
        <button className={type === 'income' ? 'active income' : ''} onClick={() => setType('income')}>
          收入
        </button>
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <label className="field">
          <span>金额</span>
          <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="field">
          <span>重复频率</span>
          <select value={freq} onChange={(e) => setFreq(e.target.value as Freq)}>
            {FREQS.map((f) => (
              <option key={f} value={f}>
                {FREQ_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>分类</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">选择分类</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
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
          <span>开始日期</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="field">
          <span>备注</span>
          <input placeholder="如：房租" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="btn primary" onClick={submit}>
          添加规则
        </button>
      </div>

      <div className="section-title">已有规则（{recurrences.length}）</div>
      <div className="recur-list">
        {recurrences.map((r) => (
          <div className="recur-row" key={r.id}>
            <span
              className={'emoji-dot ' + r.type}
              style={{ background: r.type === 'income' ? 'var(--green-soft)' : 'var(--red-soft)' }}
            >
              {catMap.get(r.categoryId)?.emoji ?? '❓'}
            </span>
            <span className="txn-main">
              <span className="txn-cat">{r.note || catMap.get(r.categoryId)?.name || '周期账单'}</span>
              <span className="txn-sub">
                {FREQ_LABEL[r.freq]} · 期初 {r.startDate}
                {r.lastGenerated ? ` · 已记到 ${r.lastGenerated}` : ' · 待开始'}
              </span>
            </span>
            <span className={'amount ' + (r.type === 'income' ? 'pos' : 'neg')}>
              {r.type === 'income' ? '+' : '−'}
              {fmtMoney(r.amount)}
            </span>
            <button className="icon-btn" onClick={() => removeRecurring(r.id)} aria-label="删除">
              🗑️
            </button>
          </div>
        ))}
        {recurrences.length === 0 && <p className="empty-text">还没有周期规则，添加一个吧（如每月房租）</p>}
      </div>
    </Modal>
  );
}
