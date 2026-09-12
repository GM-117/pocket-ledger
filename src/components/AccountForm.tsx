import { useState } from 'react';
import { accountIcon, KIND_MAP, kindToType, subtypeOf } from '../accountCatalog';
import { useStore } from '../store';
import { ADJUST_CATEGORY_IN, ADJUST_CATEGORY_OUT, type Account, type AccountKind } from '../types';
import { accountBalance, fmtISO, fmtMoney, round2, uid } from '../utils';
import { BalanceAdjustModal } from './BalanceAdjustModal';
import { Modal } from './Modal';
import { LIcon } from './icons';

export interface AccountTypePreset {
  kind: AccountKind;
  subtype: string;
}

interface AccountFormProps {
  /** 编辑已有账户；null 为新建 */
  initial: Account | null;
  /** 新建时已选定的类型（由选择类型页传入，表单内可点类型行重选） */
  typePreset: AccountTypePreset;
  /** 点击类型行 → 打开选择类型页 */
  onPickType: () => void;
  onClose: () => void;
}

/** iCost 式添加/修改账户：类型行、名称、备注、余额、币种、计入总资产、记账时可被选择 */
export function AccountForm({ initial, typePreset, onPickType, onClose }: AccountFormProps) {
  const txns = useStore((s) => s.txns);
  const accounts = useStore((s) => s.accounts);
  const saveAccount = useStore((s) => s.saveAccount);
  const saveTxn = useStore((s) => s.saveTxn);
  const removeAccount = useStore((s) => s.removeAccount);
  const activeBookId = useStore((s) => s.activeBookId);

  const [name, setName] = useState(initial?.name ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [balance, setBalance] = useState(initial ? String(initial.initialBalance) : '');
  const [includeInNet, setIncludeInNet] = useState(initial?.includeInNet ?? true);
  const [canSelect, setCanSelect] = useState(initial?.canSelect ?? true);
  const [lendDate, setLendDate] = useState(initial?.lendDate ?? '');
  /** 新建借入/借出时关联的资金账户：借入→收款入账，借出→付款划出（仅创建时入账一次） */
  const [linkedAccId, setLinkedAccId] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [error, setError] = useState('');

  // 余额调整会直接写 store，编辑时始终以 store 中的实时账户为准
  const live = initial ? accounts.find((a) => a.id === initial.id) ?? null : null;

  const kind: AccountKind = initial?.kind ?? typePreset.kind;
  const subtype = initial?.subtype ?? typePreset.subtype;
  const st = subtypeOf(kind, subtype);
  const icon = live ? accountIcon(live) : { icon: st.icon, color: st.color };
  const isBorrowKind = kind === 'receivable' || kind === 'payable';
  const currentBalance = live ? accountBalance(live, txns) : 0;
  // 关联账户候选：当前账本下的资金类账户（资金/充值/理财）。
  // 应收/应付是债权债务凭证、信用卡是负债，都不是借入/借出资金实际落账的地方
  const assetAccounts = accounts.filter(
    (a) => a.bookId === activeBookId && a.type === 'asset' && a.kind !== 'receivable',
  );

  const submit = () => {
    if (!name.trim()) return setError('请填写账户名称');
    const b = parseFloat(balance || '0');
    if (!initial && Number.isNaN(b)) return setError('期初余额格式不对');
    saveAccount({
      id: live?.id ?? uid(),
      name: name.trim(),
      emoji: icon.icon,
      type: kindToType(kind),
      // 新建账户归属当前账本；编辑保持原归属
      bookId: live?.bookId ?? activeBookId,
      initialBalance: live ? live.initialBalance : round2(b),
      createdAt: live?.createdAt ?? new Date().toISOString(),
      kind,
      subtype,
      note: note.trim() || undefined,
      includeInNet,
      canSelect,
      lendDate: isBorrowKind && lendDate ? lendDate : undefined,
    });

    // 新建借入/借出并关联了资金账户：金额一次性入账——差额调整对方期初余额，
    // 并留一条「调整」痕迹流水（与余额调整同口径，不计入收支统计）
    if (!live && isBorrowKind && linkedAccId && b > 0) {
      const linked = accounts.find((a) => a.id === linkedAccId && a.type === 'asset');
      if (linked) {
        const delta = kind === 'payable' ? b : -b; // 借入到账 +，借出划出 −
        saveAccount({ ...linked, initialBalance: round2(linked.initialBalance + delta) });
        saveTxn({
          id: uid(),
          bookId: linked.bookId,
          accountId: linked.id,
          categoryId: delta > 0 ? ADJUST_CATEGORY_IN : ADJUST_CATEGORY_OUT,
          type: 'adjust',
          amount: round2(Math.abs(b)),
          date: lendDate || fmtISO(new Date()),
          note: kind === 'payable' ? `借入入账 · ${name.trim()}` : `借出划出 · ${name.trim()}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
    onClose();
  };

  const del = () => {
    if (live && window.confirm(`确定删除账户「${live.name}」吗？其名下流水也会一并删除。`)) {
      removeAccount(live.id);
      onClose();
    }
  };

  return (
    <Modal title={initial ? '修改账户' : '添加账户'} onClose={onClose}>
      <button className="acc-type-row" onClick={onPickType}>
        <span className="icon-circle lg" style={{ background: icon.color + '22', color: icon.color }}>
          <LIcon emoji={icon.icon} size={20} />
        </span>
        <span className="acc-type-name">{name.trim() || st.label}</span>
        <span className="value">
          {st.label}
          <span className="arrow">›</span>
        </span>
      </button>

      <div className="form-grid">
        <label className="field">
          <span>账户名称</span>
          <input placeholder="请输入账户名称" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>账户备注（可不填）</span>
          <input placeholder="点击填写备注" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      {isBorrowKind && (
        <label className="field section">
          <span>借款时间（可不填）</span>
          <input type="date" value={lendDate} onChange={(e) => setLendDate(e.target.value)} />
        </label>
      )}

      {isBorrowKind && !initial && (
        <div className="field section">
          <label className="field">
            <span>{kind === 'payable' ? '收款账户（可不选）' : '付款账户（可不选）'}</span>
            <select value={linkedAccId} onChange={(e) => setLinkedAccId(e.target.value)}>
              <option value="">无</option>
              {assetAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <p className="field-hint">
            {kind === 'payable'
              ? '借入的钱若进入本账本的资金账户，选择后保存时会将该金额记入其余额（不计入收支统计）'
              : '借出的钱若从本账本的资金账户划出，选择后保存时会从其余额中扣减该金额（不计入收支统计）'}
          </p>
        </div>
      )}

      <div className="card detail-card">
        {live ? (
          <button className="detail-row" onClick={() => setAdjustOpen(true)}>
            <span>账户余额</span>
            <span className="value ink">
              {fmtMoney(currentBalance)}
              <span className="arrow">›</span>
            </span>
          </button>
        ) : (
          <label className="detail-row as-field">
            <span>期初余额{kind === 'credit' || kind === 'payable' ? '（填欠款金额）' : ''}</span>
            <input inputMode="decimal" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </label>
        )}
        <div className="detail-row">
          <span>账户币种</span>
          <span className="value">
            人民币 (CNY)
            <span className="arrow">›</span>
          </span>
        </div>
        {/* label 使整行可点：开关的 checkbox 本身 0×0，点行任意处都能切换 */}
        <label className="detail-row">
          <span>计入总资产</span>
          <span className="switch">
            <input type="checkbox" checked={includeInNet} onChange={(e) => setIncludeInNet(e.target.checked)} />
            <i />
          </span>
        </label>
        <label className="detail-row">
          <span>记账时可被选择</span>
          <span className="switch">
            <input type="checkbox" checked={canSelect} onChange={(e) => setCanSelect(e.target.checked)} />
            <i />
          </span>
        </label>
        <p className="field-hint">关闭后，该账户不出现在记账面板与周期记账的账户列表中</p>
      </div>

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

      {live && adjustOpen && <BalanceAdjustModal account={live} onClose={() => setAdjustOpen(false)} />}
    </Modal>
  );
}
