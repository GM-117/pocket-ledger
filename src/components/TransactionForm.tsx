import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { TRANSFER_CATEGORY_ID, type ReimbStatus, type Txn, type TxnType } from '../types';
import { fmtISO, fmtMoney, parseISO, round2, uid } from '../utils';

interface TransactionFormProps {
  /** 编辑已有记录 */
  initial: Txn | null;
  /** 从模板新建（无 id） */
  preset?: Txn | null;
  onClose: () => void;
}

/** iCost 风格快速记账面板：金额大字 + 分类宫格 + 数字键盘，支持转账与存为模板 */
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
  const [date, setDate] = useState(initial?.date ?? fmtISO(new Date()));
  const [note, setNote] = useState(initial?.note ?? preset?.note ?? '');
  const [metaOpen, setMetaOpen] = useState(!!initial);
  const [error, setError] = useState('');
  const [tplSaving, setTplSaving] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplSaved, setTplSaved] = useState(false);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? preset?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [reimb, setReimb] = useState<ReimbStatus>(initial?.reimb ?? preset?.reimb ?? 'none');
  const [refundAmt, setRefundAmt] = useState('');

  // 注意：selector 必须返回稳定引用，派生数据用 useMemo 计算，否则会无限重渲染
  const allTxns = useStore((s) => s.txns);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTxns) for (const g of t.tags ?? []) set.add(g);
    return [...set].sort();
  }, [allTxns]);

  /** 编辑支出时的退款关联 */
  const refunds = useMemo(
    () => (initial && initial.type === 'expense' ? allTxns.filter((t) => t.refundForId === initial.id) : []),
    [allTxns, initial],
  );
  const refunded = round2(refunds.reduce((s, r) => s + r.amount, 0));
  const refundRemaining =
    initial && initial.type === 'expense' ? round2(initial.amount - refunded) : 0;

  const cats = categories.filter((c) => c.type === type);

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

  const toggleTag = (g: string) => {
    setTplSaved(false);
    setTags((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  };

  const addTag = () => {
    const g = tagInput.trim().replace(/^#/, '');
    if (!g) return;
    setTplSaved(false);
    setTags((cur) => (cur.includes(g) ? cur : [...cur, g]));
    setTagInput('');
  };

  const addRefund = () => {
    if (!initial || initial.type !== 'expense') return;
    const amt = parseFloat(refundAmt);
    if (!amt || amt <= 0) return;
    const incCat = categories.find((c) => c.type === 'income');
    if (!incCat) return;
    saveTxn({
      id: uid(),
      bookId: initial.bookId,
      accountId: initial.accountId,
      categoryId: incCat.id,
      type: 'income',
      amount: round2(amt),
      date: fmtISO(new Date()),
      note: `退款：${initial.note || '原支出'}`,
      createdAt: new Date().toISOString(),
      refundForId: initial.id,
    });
    setRefundAmt('');
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
      note: note.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...(type === 'transfer' ? {} : { tags, reimb: reimb === 'none' ? undefined : reimb }),
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
      note: note.trim(),
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
  const selectedBook = books.find((b) => b.id === bookId);
  const isTransfer = type === 'transfer';

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
            <span className="kp-meta-label">日期</span>
            {date === fmtISO(new Date()) ? '今天' : `${parseISO(date).getMonth() + 1}/${parseISO(date).getDate()}`}
          </button>
          <button className={'kp-meta-chip' + (metaOpen ? ' open' : '')} onClick={() => setMetaOpen((v) => !v)}>
            <span className="kp-meta-label">更多</span>
            备注/账户
          </button>
        </div>

        {metaOpen && (
          <div className="kp-more">
            <label className="kp-field">
              <span>日期</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            {!isTransfer && (
              <label className="kp-field">
                <span>账户</span>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {selectable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.emoji} {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="kp-field" style={{ gridColumn: '1 / -1' }}>
              <span>备注</span>
              <input placeholder="记点什么…" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {!isTransfer && (
              <div className="kp-field" style={{ gridColumn: '1 / -1' }}>
                <span>标签（点选或输入）</span>
                <div className="tag-row">
                  {allTags.slice(0, 8).map((g) => (
                    <button key={g} className={'tag-chip' + (tags.includes(g) ? ' active' : '')} onClick={() => toggleTag(g)}>
                      #{g}
                    </button>
                  ))}
                </div>
                <div className="tag-add">
                  <input
                    placeholder="新标签"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button className="tpl-btn" onClick={addTag}>
                    ＋ 添加
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="tag-row">
                    {tags.map((g) => (
                      <button key={g} className="tag-chip active" onClick={() => toggleTag(g)}>
                        #{g} ✕
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!isTransfer && type === 'expense' && (
              <div className="kp-field" style={{ gridColumn: '1 / -1' }}>
                <span>报销状态</span>
                <div className="seg">
                  <button className={reimb === 'none' ? 'active' : ''} onClick={() => setReimb('none')}>
                    不报销
                  </button>
                  <button className={reimb === 'pending' ? 'active expense' : ''} onClick={() => setReimb('pending')}>
                    待报销
                  </button>
                  <button className={reimb === 'done' ? 'active income' : ''} onClick={() => setReimb('done')}>
                    已报销
                  </button>
                </div>
              </div>
            )}
            <p className="kp-current">
              {selectedBook?.emoji} {selectedBook?.name}
              {selectedAcc ? ` · ${selectedAcc.emoji} ${selectedAcc.name}` : ''}
            </p>
          </div>
        )}

        {initial && type === 'expense' && (
          <div className="refund-box">
            <div className="refund-head">
              <span>
                退款关联 · 已退 {fmtMoney(refunded)}
                {refundRemaining > 0 ? ` / 待退 ${fmtMoney(refundRemaining)}` : '（已退完）'}
              </span>
            </div>
            {refunds.map((r) => (
              <div className="refund-row" key={r.id}>
                <span>{r.date.slice(5).replace('-', '/')}</span>
                <span className="refund-note">{r.note}</span>
                <span className="pos">+{fmtMoney(r.amount)}</span>
              </div>
            ))}
            <div className="refund-add">
              <input
                inputMode="decimal"
                placeholder={refundRemaining > 0 ? `建议 ${refundRemaining}` : '退款金额'}
                value={refundAmt}
                onChange={(e) => setRefundAmt(e.target.value)}
              />
              <button className="tpl-btn" onClick={addRefund} disabled={!parseFloat(refundAmt)}>
                ＋ 记退款
              </button>
            </div>
          </div>
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
