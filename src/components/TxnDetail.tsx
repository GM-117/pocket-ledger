import { useEffect, useMemo, useRef, useState } from 'react';
import { subtypeOf } from '../accountCatalog';
import { useStore } from '../store';
import { ADJUST_CATEGORY_IN, type Account, type ReimbStatus, type Txn, type TxnType } from '../types';
import { fmtHm, fmtMoney, lockBodyScroll, parseISO, round2, uid, unlockBodyScroll } from '../utils';
import { AmountPadModal } from './AmountPadModal';
import { CategoryPickModal, DateEditModal, OptionPickerModal } from './EditModals';
import { Modal } from './Modal';

interface TxnDetailProps {
  /** 普通模式：流水 id */
  txnId?: string;
  /** 账户创建记录模式：传入对应账户 */
  createdAccount?: Account;
  /** 返回按钮文案（打开方页面名，如「账户详情」） */
  backLabel: string;
  onClose: () => void;
  /** 编辑 → 打开记账面板 */
  onEdit?: (t: Txn) => void;
}

const TYPE_LABEL: Record<TxnType, string> = {
  expense: '支出',
  income: '收入',
  transfer: '转账',
  adjust: '调整',
};

export function TxnDetail(props: TxnDetailProps) {
  if (props.createdAccount) {
    return <CreatedAccountDetail account={props.createdAccount} backLabel={props.backLabel} onClose={props.onClose} />;
  }
  return <TxnDetailView {...(props as Required<TxnDetailProps>)} />;
}

type EditTarget = 'book' | 'account' | 'amount' | 'date' | 'category' | null;

/** iCost 式账单详情：顶部快捷操作 + 明细行（每行可独立编辑，无需打开完整面板） */
function TxnDetailView({ txnId, backLabel, onClose, onEdit }: Required<TxnDetailProps>) {
  const txns = useStore((s) => s.txns);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const books = useStore((s) => s.books);
  const saveTxn = useStore((s) => s.saveTxn);
  const removeTxn = useStore((s) => s.removeTxn);
  const addTemplate = useStore((s) => s.addTemplate);

  const t = txns.find((x) => x.id === txnId);
  useEffect(() => {
    if (!t) onClose();
  }, [t, onClose]);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [refundAmt, setRefundAmt] = useState('');
  const refundInputRef = useRef<HTMLInputElement>(null);
  const refundSectionRef = useRef<HTMLDivElement>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const x of txns) for (const g of x.tags ?? []) set.add(g);
    return [...set].sort();
  }, [txns]);

  /** 行内编辑账户时可选的账户（记账可被选择的 + 当前已选中的） */
  const selectableAccounts = useMemo(() => {
    const base = accounts.filter((a) => a.canSelect !== false);
    if (t && !base.some((b) => b.id === t.accountId)) {
      const cur = accounts.find((a) => a.id === t.accountId);
      if (cur) base.push(cur);
    }
    return base;
  }, [accounts, t]);

  if (!t) return null;

  const isTransfer = t.type === 'transfer';
  // 调整流水的金额与期初余额变动一一对应，类型/金额/账户不可改，只留时间/账本/备注
  const isAdjust = t.type === 'adjust';
  const adjustIn = isAdjust && t.categoryId === ADJUST_CATEGORY_IN;
  const cat = categories.find((c) => c.id === t.categoryId);
  const acc = accounts.find((a) => a.id === t.accountId);
  const toAcc = accounts.find((a) => a.id === t.toAccountId);
  const book = books.find((b) => b.id === t.bookId);
  const d = parseISO(t.date);
  const dateLabel = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
  const time = fmtHm(t.createdAt);

  const refunds = t.type === 'expense' ? txns.filter((x) => x.refundForId === t.id) : [];
  const refunded = round2(refunds.reduce((s, r) => s + r.amount, 0));
  const refundRemaining = t.type === 'expense' ? round2(t.amount - refunded) : 0;

  const saveNote = () => {
    setNoteEditing(false);
    const v = noteDraft.trim();
    if (v !== (t.note ?? '')) saveTxn({ ...t, note: v });
  };

  const saveTags = () => {
    setTagOpen(false);
    saveTxn({ ...t, tags: tagDraft.length ? tagDraft : undefined });
  };

  const addRefund = () => {
    if (t.type !== 'expense') return;
    const amt = parseFloat(refundAmt);
    if (!amt || amt <= 0) return;
    const incCat = categories.find((c) => c.type === 'income');
    if (!incCat) return;
    saveTxn({
      id: uid(),
      bookId: t.bookId,
      accountId: t.accountId,
      categoryId: incCat.id,
      type: 'income',
      amount: round2(amt),
      date: new Date().toISOString().slice(0, 10),
      note: `退款：${t.note || '原支出'}`,
      createdAt: new Date().toISOString(),
      refundForId: t.id,
    });
    setRefundAmt('');
  };

  const del = () => {
    if (window.confirm('确定删除这笔账单吗？')) {
      removeTxn(t.id);
      onClose();
    }
  };

  const saveAsTemplate = () => {
    if (isTransfer) return;
    addTemplate({
      name: tplName.trim() || `${cat?.emoji ?? ''} ${cat?.name ?? '模板'}`,
      type: t.type === 'income' ? 'income' : 'expense',
      amount: t.amount,
      categoryId: t.categoryId,
      accountId: t.accountId,
      bookId: t.bookId,
      note: t.note,
    });
    setTplOpen(false);
    setTplName('');
  };

  const setReimb = (r: ReimbStatus) => saveTxn({ ...t, reimb: r === 'none' ? undefined : r });

  const closeEdit = () => setEditTarget(null);

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-page">
        <div className="page-head">
          <button className="page-back" onClick={onClose}>
            ‹ {backLabel}
          </button>
          <span className="page-title">账单详情</span>
          <span className="page-action placeholder" />
        </div>

      <div className="page-body">
        <div className="txn-actions">
          {!isAdjust && (
            <button className="txn-action edit" onClick={() => onEdit(t)}>
              <span className="ic">✏️</span>编辑
            </button>
          )}
          <button className="txn-action danger" onClick={del}>
            <span className="ic">🗑️</span>删除
          </button>
          {t.type === 'expense' && (
            <button
              className="txn-action"
              onClick={() => {
                refundSectionRef.current?.scrollIntoView({ block: 'center' });
                refundInputRef.current?.focus();
              }}
            >
              <span className="ic">🛒</span>退款
            </button>
          )}
          {!isTransfer && !isAdjust && (
            <button className="txn-action tpl" onClick={() => setTplOpen(true)}>
              <span className="ic">⚡</span>存为模板
            </button>
          )}
        </div>

        <div className="card detail-card">
          {isAdjust ? (
            <div className="detail-row">
              <span>类型</span>
              <span className="value">（调整）余额调整</span>
            </div>
          ) : (
            <button
              className="detail-row"
              onClick={() => (isTransfer ? onEdit(t) : setEditTarget('category'))}
            >
              <span>类型</span>
              <span className="value">
                （{TYPE_LABEL[t.type]}）{isTransfer ? '转账' : cat?.name ?? '未知分类'}
                <span className="arrow">›</span>
              </span>
            </button>
          )}
          <button className="detail-row" onClick={() => setEditTarget('book')}>
            <span>账本</span>
            <span className="value">
              {book ? `${book.emoji} ${book.name}` : '未知账本'}
              <span className="arrow">›</span>
            </span>
          </button>
        </div>

        <div className="card detail-card">
          <button className="detail-row" onClick={() => setEditTarget('date')}>
            <span>时间</span>
            <span className="value ink">
              {dateLabel} {time}
              <span className="arrow">›</span>
            </span>
          </button>
          {isAdjust ? (
            <div className="detail-row">
              <span>金额</span>
              <span className="value ink">
                {adjustIn ? '+' : '−'}
                {fmtMoney(t.amount)}
              </span>
            </div>
          ) : (
            <button className="detail-row" onClick={() => setEditTarget('amount')}>
              <span>金额</span>
              <span className="value ink">
                {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}
                {fmtMoney(t.amount)}
                <span className="arrow">›</span>
              </span>
            </button>
          )}
          <div className="detail-row">
            <span>货币</span>
            <span className="value">人民币 (CNY)</span>
          </div>
          {isAdjust ? (
            <div className="detail-row">
              <span>账户</span>
              <span className="value">{acc?.name ?? '未知账户'}</span>
            </div>
          ) : (
            <button
              className="detail-row"
              onClick={() => (isTransfer ? onEdit(t) : setEditTarget('account'))}
            >
              <span>账户</span>
              <span className="value">
                {isTransfer ? `${acc?.name ?? '?'} → ${toAcc?.name ?? '?'}` : acc?.name ?? '未知账户'}
                <span className="arrow">›</span>
              </span>
            </button>
          )}
        </div>

        <div className="card detail-card">
          <div className="detail-row">
            <span>备注</span>
            {noteEditing ? (
              <input
                autoFocus
                className="value"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={saveNote}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNote();
                  if (e.key === 'Escape') setNoteEditing(false);
                }}
              />
            ) : (
              <button
                className="value"
                onClick={() => {
                  setNoteDraft(t.note ?? '');
                  setNoteEditing(true);
                }}
              >
                {t.note || '无'}
                <span className="arrow">›</span>
              </button>
            )}
          </div>
          {!isTransfer && !isAdjust && (
            <div className="detail-row">
              <span>标签</span>
              <button
                className="value"
                onClick={() => {
                  setTagDraft(t.tags ?? []);
                  setTagInput('');
                  setTagOpen(true);
                }}
              >
                {(t.tags ?? []).length ? t.tags!.map((g) => `#${g}`).join(' ') : '无'}
                <span className="arrow">›</span>
              </button>
            </div>
          )}
        </div>

        {!isTransfer && t.type === 'expense' && (
          <div className="card detail-card">
            <div className="detail-row">
              <span>报销状态</span>
              <div className="seg">
                <button className={!t.reimb ? 'active' : ''} onClick={() => setReimb('none')}>
                  不报销
                </button>
                <button className={t.reimb === 'pending' ? 'active expense' : ''} onClick={() => setReimb('pending')}>
                  待报销
                </button>
                <button className={t.reimb === 'done' ? 'active income' : ''} onClick={() => setReimb('done')}>
                  已报销
                </button>
              </div>
            </div>
          </div>
        )}

        {t.type === 'expense' && (
          <div className="card detail-card" ref={refundSectionRef}>
            <div className="detail-row refund-head-row">
              <span>退款关联</span>
              <span className="value">
                已退 {fmtMoney(refunded)}
                {refundRemaining > 0 ? ` / 待退 ${fmtMoney(refundRemaining)}` : '（已退完）'}
              </span>
            </div>
            {refunds.map((r) => (
              <div className="detail-row" key={r.id}>
                <span className="value ink">{r.date.slice(5).replace('-', '/')}</span>
                <span className="value">
                  {r.note}
                  <b className="pos">+{fmtMoney(r.amount)}</b>
                </span>
              </div>
            ))}
            {refundRemaining > 0 && (
              <div className="refund-add">
                <input
                  ref={refundInputRef}
                  inputMode="decimal"
                  placeholder={`建议 ${refundRemaining}`}
                  value={refundAmt}
                  onChange={(e) => setRefundAmt(e.target.value)}
                />
                <button className="tpl-btn" onClick={addRefund} disabled={!parseFloat(refundAmt)}>
                  ＋ 记退款
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editTarget === 'category' && (
        <CategoryPickModal
          categories={categories}
          initialType={t.type}
          onPick={(type, categoryId) => {
            saveTxn({ ...t, type, categoryId });
            closeEdit();
          }}
          onClose={closeEdit}
        />
      )}
      {editTarget === 'book' && (
        <OptionPickerModal
          title="选择账本"
          options={books.map((b) => ({ id: b.id, label: b.name, emoji: b.emoji }))}
          selectedId={t.bookId}
          onPick={(bookId) => {
            saveTxn({ ...t, bookId });
            closeEdit();
          }}
          onClose={closeEdit}
        />
      )}
      {editTarget === 'account' && (
        <OptionPickerModal
          title="选择账户"
          options={selectableAccounts.map((a) => ({ id: a.id, label: a.name, emoji: a.emoji }))}
          selectedId={t.accountId}
          onPick={(accountId) => {
            saveTxn({ ...t, accountId });
            closeEdit();
          }}
          onClose={closeEdit}
        />
      )}
      {editTarget === 'amount' && (
        <AmountPadModal
          title="修改金额"
          initial={String(t.amount)}
          onSubmit={(amount) => {
            saveTxn({ ...t, amount });
            return null;
          }}
          onClose={closeEdit}
        />
      )}
      {editTarget === 'date' && (
        <DateEditModal
          date={t.date}
          onSave={(date) => {
            saveTxn({ ...t, date });
            closeEdit();
          }}
          onClose={closeEdit}
        />
      )}

      {tagOpen && (
        <Modal title="编辑标签" onClose={() => setTagOpen(false)}>
          <div className="tag-row">
            {allTags.slice(0, 12).map((g) => (
              <button
                key={g}
                className={'tag-chip' + (tagDraft.includes(g) ? ' active' : '')}
                onClick={() =>
                  setTagDraft((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))
                }
              >
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
                  const g = tagInput.trim().replace(/^#/, '');
                  if (g && !tagDraft.includes(g)) setTagDraft((cur) => [...cur, g]);
                  setTagInput('');
                }
              }}
            />
            <button
              className="tpl-btn"
              onClick={() => {
                const g = tagInput.trim().replace(/^#/, '');
                if (g && !tagDraft.includes(g)) setTagDraft((cur) => [...cur, g]);
                setTagInput('');
              }}
            >
              ＋ 添加
            </button>
          </div>
          {tagDraft.length > 0 && (
            <div className="tag-row">
              {tagDraft.map((g) => (
                <button
                  key={g}
                  className="tag-chip active"
                  onClick={() => setTagDraft((cur) => cur.filter((x) => x !== g))}
                >
                  #{g} ✕
                </button>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="btn ghost" onClick={() => setTagOpen(false)}>
              取消
            </button>
            <button className="btn primary" onClick={saveTags}>
              保存
            </button>
          </div>
        </Modal>
      )}

      {tplOpen && (
        <Modal title="存为模板" onClose={() => setTplOpen(false)}>
          <label className="field">
            <span>模板名称</span>
            <input
              autoFocus
              placeholder={`如：${cat?.emoji ?? ''} ${cat?.name ?? '模板'}`}
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
            />
          </label>
          <p className="field-hint">
            {TYPE_LABEL[t.type]} · {fmtMoney(t.amount)} · {acc?.name}
          </p>
          <div className="form-actions">
            <button className="btn ghost" onClick={() => setTplOpen(false)}>
              取消
            </button>
            <button className="btn primary" onClick={saveAsTemplate}>
              保存
            </button>
          </div>
        </Modal>
      )}
        </div>
      </>
  );
}

/** 「账户创建」记录详情：仅支持 修改时间 / 修改金额 / 删除（删除即清零期初余额） */
function CreatedAccountDetail({
  account: acc0,
  backLabel,
  onClose,
}: {
  account: Account;
  backLabel: string;
  onClose: () => void;
}) {
  const accounts = useStore((s) => s.accounts);
  const saveAccount = useStore((s) => s.saveAccount);
  const [editOpen, setEditOpen] = useState(false);
  const [dateEdit, setDateEdit] = useState(false);
  const [amountEdit, setAmountEdit] = useState(false);

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  const acc = accounts.find((a) => a.id === acc0.id) ?? acc0;
  const st = subtypeOf(acc.kind, acc.subtype);
  const isLiab = acc.type === 'liability';
  const note = `初始${isLiab ? '欠款' : '余额'}为 ${fmtMoney(acc.initialBalance)}`;
  const d = parseISO(acc.createdAt.slice(0, 10));
  const dateLabel = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;

  const del = () => {
    if (window.confirm('确定删除该「账户创建」记录吗？账户期初余额将清零。')) {
      saveAccount({ ...acc, initialBalance: 0 });
      onClose();
    }
  };

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-page">
        <div className="page-head">
          <button className="page-back" onClick={onClose}>
            ‹ {backLabel}
          </button>
          <span className="page-title">账单详情</span>
          <span className="page-action placeholder" />
        </div>

      <div className="page-body">
        <div className="txn-actions two">
          <button className="txn-action edit" onClick={() => setEditOpen(true)}>
            <span className="ic">✏️</span>编辑
          </button>
          <button className="txn-action danger" onClick={del}>
            <span className="ic">🗑️</span>删除
          </button>
        </div>

        <div className="card detail-card">
          <div className="detail-row">
            <span>类型</span>
            <span className="value">账户创建</span>
          </div>
        </div>

        <div className="card detail-card">
          <button className="detail-row" onClick={() => setDateEdit(true)}>
            <span>时间</span>
            <span className="value ink">
              {dateLabel} {fmtHm(acc.createdAt)}
              <span className="arrow">›</span>
            </span>
          </button>
          <button className="detail-row" onClick={() => setAmountEdit(true)}>
            <span>金额</span>
            <span className="value ink">
              {fmtMoney(acc.initialBalance)}
              <span className="arrow">›</span>
            </span>
          </button>
          <div className="detail-row">
            <span>货币</span>
            <span className="value">人民币 (CNY)</span>
          </div>
          <div className="detail-row">
            <span>账户</span>
            <span className="value">
              {acc.name}（{st.label}）
            </span>
          </div>
        </div>

        <div className="card detail-card">
          <div className="detail-row">
            <span>备注</span>
            <span className="value">{note}</span>
          </div>
        </div>
      </div>

      {editOpen && (
        <Modal title="编辑" onClose={() => setEditOpen(false)}>
          <div className="option-list">
            <button
              className="option-row"
              onClick={() => {
                setEditOpen(false);
                setDateEdit(true);
              }}
            >
              <span className="emoji-dot">📅</span>
              <span className="option-label">修改时间</span>
              <span className="option-check">›</span>
            </button>
            <button
              className="option-row"
              onClick={() => {
                setEditOpen(false);
                setAmountEdit(true);
              }}
            >
              <span className="emoji-dot">💰</span>
              <span className="option-label">修改金额</span>
              <span className="option-check">›</span>
            </button>
          </div>
        </Modal>
      )}
      {dateEdit && (
        <DateEditModal
          date={acc.createdAt.slice(0, 10)}
          onSave={(date) => {
            // 保留原时分秒部分，仅替换日期
            saveAccount({ ...acc, createdAt: date + acc.createdAt.slice(10) });
            setDateEdit(false);
          }}
          onClose={() => setDateEdit(false)}
        />
      )}
      {amountEdit && (
        <AmountPadModal
          title="修改金额"
          initial={String(Math.abs(acc.initialBalance))}
          onSubmit={(amount) => {
            saveAccount({ ...acc, initialBalance: amount });
            if (amount === 0) onClose();
            return null;
          }}
          onClose={() => setAmountEdit(false)}
        />
      )}
        </div>
      </>
  );
}
