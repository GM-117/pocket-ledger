import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { TRANSFER_CATEGORY_ID, type Txn, type TxnType } from '../types';
import { fmtISO, round2, uid } from '../utils';
import { DateEditModal, OptionPickerModal } from './EditModals';

interface TransactionFormProps {
  /** 编辑已有记录 */
  initial: Txn | null;
  /** 从模板新建（无 id） */
  preset?: Txn | null;
  onClose: () => void;
}

/** iCost 风格快速记账面板：金额大字 + 分类宫格 + 数字键盘，支持转账与存为模板。
 *  备注 / 标签 / 报销 / 退款在「账单详情」页编辑，面板保持精简 */
export function TransactionForm({ initial, preset, onClose }: TransactionFormProps) {
  const books = useStore((s) => s.books);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const activeBookId = useStore((s) => s.activeBookId);
  const saveTxn = useStore((s) => s.saveTxn);
  const removeTxn = useStore((s) => s.removeTxn);
  const addTemplate = useStore((s) => s.addTemplate);

  /** 记账可选账户：过滤 canSelect=false，但编辑中已选中的账户保留 */
  const selectable = useMemo(() => {
    const base = accounts.filter((a) => a.canSelect !== false);
    const curIds = [initial?.accountId, preset?.accountId, initial?.toAccountId, preset?.toAccountId];
    for (const id of curIds) {
      const a = id ? accounts.find((x) => x.id === id) : undefined;
      if (a && !base.some((b) => b.id === a.id)) base.push(a);
    }
    return base;
  }, [accounts, initial, preset]);

  const [type, setType] = useState<TxnType>(initial?.type ?? preset?.type ?? 'expense');
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : preset ? String(preset.amount) : '',
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? preset?.categoryId ?? '');
  const [accountId, setAccountId] = useState(
    initial?.accountId ?? preset?.accountId ?? selectable[0]?.id ?? '',
  );
  const [toAccountId, setToAccountId] = useState(
    initial?.toAccountId ?? selectable.find((a) => a.id !== accountId)?.id ?? '',
  );
  const [bookId, setBookId] = useState(initial?.bookId ?? preset?.bookId ?? activeBookId);
  const [date, setDate] = useState(initial?.date ?? preset?.date ?? fmtISO(new Date()));
  const [dateOpen, setDateOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const [error, setError] = useState('');
  const [tplSaving, setTplSaving] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplSaved, setTplSaved] = useState(false);

  const cats = categories.filter((c) => c.type === type && !c.hidden);

  const switchType = (t: TxnType) => {
    setType(t);
    setCategoryId('');
    setTplSaved(false);
  };

  /* ---------- 数字键盘 ---------- */
  const pressKey = (k: string) => {
    setError('');
    setTplSaved(false);
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
    if (type === 'transfer') {
      if (!accountId || !toAccountId) return setError('请选择转出与转入账户');
      if (accountId === toAccountId) return setError('转出与转入不能是同一账户');
    } else if (!categoryId) {
      return setError('请选择分类');
    }
    saveTxn({
      id: initial?.id ?? uid(),
      bookId,
      accountId,
      ...(type === 'transfer' ? { toAccountId } : {}),
      categoryId: type === 'transfer' ? TRANSFER_CATEGORY_ID : categoryId,
      type,
      amount: round2(amt),
      date,
      // 备注与标签/报销在账单详情页维护，编辑时原样保留
      note: initial?.note ?? preset?.note ?? '',
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...(type === 'transfer'
        ? {}
        : { tags: initial?.tags, reimb: initial?.reimb }),
    });
    onClose();
  };

  const saveAsTemplate = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !categoryId) return;
    const cat = categories.find((c) => c.id === categoryId);
    addTemplate({
      name: tplName.trim() || `${cat?.emoji ?? ''} ${cat?.name ?? '模板'}`,
      type: type === 'income' ? 'income' : 'expense',
      amount: round2(amt),
      categoryId,
      accountId,
      bookId,
      note: initial?.note ?? preset?.note ?? '',
    });
    setTplSaving(false);
    setTplName('');
    setTplSaved(true);
    setTimeout(() => setTplSaved(false), 1800);
  };

  const del = () => {
    if (initial && window.confirm('确定删除这笔记录吗？')) {
      removeTxn(initial.id);
      onClose();
    }
  };

  const selectedAcc = accounts.find((a) => a.id === accountId);
  const isTransfer = type === 'transfer';
  const dateLabel =
    date === fmtISO(new Date())
      ? '今天'
      : `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

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
            <button className={type === 'transfer' ? 'active transfer' : ''} onClick={() => switchType('transfer')}>
              转账
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

        {isTransfer ? (
          <div className="transfer-grid">
            <label className="field">
              <span>转出账户</span>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {selectable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>转入账户</span>
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                {selectable.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === accountId}>
                    {a.emoji} {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
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
        )}

        <div className="kp-meta">
          <button className="kp-meta-chip" onClick={() => setDateOpen(true)}>
            <span className="kp-meta-label">日期</span>
            {dateLabel}
          </button>
          {!isTransfer && (
            <button className="kp-meta-chip" onClick={() => setAccOpen(true)}>
              <span className="kp-meta-label">账户</span>
              <span className="kp-meta-value">
                {selectedAcc ? `${selectedAcc.emoji} ${selectedAcc.name}` : '选择账户'}
              </span>
            </button>
          )}
          <button className="kp-meta-chip">
            <span className="kp-meta-label">账本</span>
            <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.emoji} {b.name}
                </option>
              ))}
            </select>
          </button>
        </div>

        {dateOpen && (
          <DateEditModal
            date={date}
            onSave={(d) => {
              setDate(d);
              setDateOpen(false);
            }}
            onClose={() => setDateOpen(false)}
          />
        )}
        {accOpen && (
          <OptionPickerModal
            title="选择账户"
            options={selectable.map((a) => ({ id: a.id, label: a.name, emoji: a.emoji }))}
            selectedId={accountId}
            onPick={(id) => {
              setAccountId(id);
              setAccOpen(false);
            }}
            onClose={() => setAccOpen(false)}
          />
        )}

        {!isTransfer && (
          <div className="tpl-save-row">
            {tplSaving ? (
              <>
                <input
                  autoFocus
                  placeholder="模板名称，如：☕ 咖啡"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                />
                <button className="btn ghost" onClick={() => setTplSaving(false)}>
                  取消
                </button>
                <button className="btn primary" onClick={saveAsTemplate} disabled={!parseFloat(amount)}>
                  存模板
                </button>
              </>
            ) : (
              <>
                <button className="tpl-btn" onClick={() => setTplSaving(true)}>
                  ⭐ 存为模板
                </button>
                {tplSaved && <span className="tpl-saved">已保存 ✓</span>}
              </>
            )}
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
