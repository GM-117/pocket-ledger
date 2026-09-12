import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { FREQ_LABEL, type CategoryType, type Freq, type Recurring } from '../types';
import { fmtISO, fmtMoney, round2, uid } from '../utils';
import { Modal } from './Modal';
import { ChevronDownIcon, LIcon, TrashIcon } from './icons';

const FREQS: Freq[] = ['daily', 'weekly', 'monthly', 'yearly'];

interface RecurringManagerProps {
  bookId: string;
  onClose: () => void;
}

export function RecurringManager({ bookId, onClose }: RecurringManagerProps) {
  const recurrences = useStore((s) => s.recurrences);
  const books = useStore((s) => s.books);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const activeBookId = useStore((s) => s.activeBookId);
  const saveRecurring = useStore((s) => s.saveRecurring);
  const removeRecurring = useStore((s) => s.removeRecurring);

  const [type, setType] = useState<CategoryType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  /** 当前展开查看配置详情的规则 id */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** 规则较多时默认收起「已有规则」列表，需要时再展开 */
  const [listOpen, setListOpen] = useState(recurrences.length <= 3);
  /** 添加成功提醒（展示数秒后自动消失） */
  const [ok, setOk] = useState('');
  const okTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(okTimer.current), []);
  /** 周期记账只允许选择 canSelect 的账户 */
  const selectable = useMemo(
    () => accounts.filter((a) => a.canSelect !== false && a.bookId === activeBookId),
    [accounts, activeBookId],
  );
  const [accountId, setAccountId] = useState(selectable[0]?.id ?? '');
  const [freq, setFreq] = useState<Freq>('monthly');
  const [startDate, setStartDate] = useState(fmtISO(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const cats = categories.filter((c) => c.type === type && !c.hidden);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('请输入金额');
    if (!selectable.length) return setError('当前账本还没有账户，请先在「资产」添加账户');
    if (!categoryId) return setError('请选择分类');
    if (!accountId) return setError('请选择账户');
    const label = note.trim() || cats.find((c) => c.id === categoryId)?.name || '周期账单';
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
    // 保存后立即补账：开始日期 ≤ 今天的规则当场生成账单（未来开始的不会生成），
    // 让用户马上看到规则确实生效。runRecurrences 幂等，可安全重复执行
    useStore.getState().runRecurrences();
    setAmount('');
    setCategoryId('');
    setNote('');
    setError('');
    setListOpen(true);
    setOk(`已添加「${label}」${FREQ_LABEL[freq]}周期规则 ✓`);
    window.clearTimeout(okTimer.current);
    okTimer.current = window.setTimeout(() => setOk(''), 2600);
  };

  return (
    <Modal title="周期记账" onClose={onClose} className="compact">
      <div className="seg">
        <button className={type === 'expense' ? 'active expense' : ''} onClick={() => setType('expense')}>
          支出
        </button>
        <button className={type === 'income' ? 'active income' : ''} onClick={() => setType('income')}>
          收入
        </button>
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <label className="field field-wide recur-amount">
          <span>金额</span>
          <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <div className="field field-wide">
          <span>重复频率</span>
          <div className="seg seg-freq">
            {FREQS.map((f) => (
              <button key={f} className={freq === f ? 'active' : ''} onClick={() => setFreq(f)}>
                {FREQ_LABEL[f]}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>分类</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">选择分类</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>账户</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {selectable.length === 0 && <option value="">请先添加账户</option>}
            {selectable.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
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

      {error ? <p className="form-error">{error}</p> : ok ? <p className="form-ok">{ok}</p> : null}
      <div className="form-actions">
        <button className="btn primary recur-add" onClick={submit}>
          添加规则
        </button>
      </div>

      <button
        className="section-title recur-toggle"
        onClick={() => setListOpen((v) => !v)}
        aria-expanded={listOpen}
      >
        <span>已有规则（{recurrences.length}）</span>
        <ChevronDownIcon size={15} className={'type-chev' + (listOpen ? ' open' : '')} />
      </button>
      {listOpen && (
        <div className="recur-list">
        {recurrences.map((r) => {
          const cat = catMap.get(r.categoryId);
          const acc = accMap.get(r.accountId);
          const bk = bookMap.get(r.bookId);
          const open = expandedId === r.id;
          const label = r.note || cat?.name || '周期账单';
          return (
            <div className="recur-row" key={r.id}>
              <button className="recur-main" onClick={() => setExpandedId(open ? null : r.id)}>
                <span className={'emoji-dot ' + r.type}>
                  <LIcon emoji={cat?.emoji} size={18} />
                </span>
                <span className="txn-main">
                  <span className="txn-cat">{label}</span>
                  <span className="txn-sub">
                    {FREQ_LABEL[r.freq]} · 期初 {r.startDate}
                    {r.lastGenerated ? ` · 已记到 ${r.lastGenerated}` : ' · 待开始'}
                  </span>
                </span>
                <span className={'amount ' + (r.type === 'income' ? 'pos' : 'neg')}>
                  {r.type === 'income' ? '+' : '−'}
                  {fmtMoney(r.amount)}
                </span>
                <ChevronDownIcon size={15} className={'type-chev' + (open ? ' open' : '')} />
              </button>
              <button
                className="icon-btn"
                aria-label="删除"
                onClick={() => {
                  if (window.confirm(`确定删除周期规则「${label}」吗？已生成的账单记录会保留。`)) {
                    removeRecurring(r.id);
                  }
                }}
              >
                <TrashIcon size={15} />
              </button>
              {open && (
                <div className="recur-detail">
                  <div>
                    <span>类型</span>
                    <b>{r.type === 'income' ? '收入' : '支出'}</b>
                  </div>
                  <div>
                    <span>金额</span>
                    <b>{fmtMoney(r.amount)}</b>
                  </div>
                  <div>
                    <span>分类</span>
                    <b>{cat?.name ?? '未知分类'}</b>
                  </div>
                  <div>
                    <span>账户</span>
                    <b>{acc?.name ?? '未知账户'}</b>
                  </div>
                  <div>
                    <span>重复频率</span>
                    <b>{FREQ_LABEL[r.freq]}</b>
                  </div>
                  <div>
                    <span>开始日期</span>
                    <b>{r.startDate}</b>
                  </div>
                  <div>
                    <span>备注</span>
                    <b>{r.note || '—'}</b>
                  </div>
                  <div>
                    <span>所属账本</span>
                    <b>{bk?.name ?? '—'}</b>
                  </div>
                  <div>
                    <span>状态</span>
                    <b>{r.enabled ? '启用中' : '已停用'}</b>
                  </div>
                  <div>
                    <span>已记到</span>
                    <b>{r.lastGenerated ?? '尚未生成'}</b>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {recurrences.length === 0 && <p className="empty-text">还没有周期规则，添加一个吧（如每月房租）</p>}
        </div>
      )}
    </Modal>
  );
}
