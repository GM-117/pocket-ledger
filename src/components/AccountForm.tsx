import { useState } from 'react';
import { accountIcon, KIND_MAP, kindToType, subtypeOf } from '../accountCatalog';
import { useStore } from '../store';
import type { Account, AccountKind } from '../types';
import { round2, uid } from '../utils';
import { Modal } from './Modal';

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

/** iCost 式添加/编辑账户：类型行、名称、备注、余额、币种、计入总资产、记账时可被选择 */
export function AccountForm({ initial, typePreset, onPickType, onClose }: AccountFormProps) {
  const saveAccount = useStore((s) => s.saveAccount);
  const removeAccount = useStore((s) => s.removeAccount);

  const [name, setName] = useState(initial?.name ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [balance, setBalance] = useState(initial ? String(initial.initialBalance) : '');
  const [includeInNet, setIncludeInNet] = useState(initial?.includeInNet ?? true);
  const [canSelect, setCanSelect] = useState(initial?.canSelect ?? true);
  const [lendDate, setLendDate] = useState(initial?.lendDate ?? '');
  const [error, setError] = useState('');

  const kind: AccountKind = initial?.kind ?? typePreset.kind;
  const subtype = initial?.subtype ?? typePreset.subtype;
  const st = subtypeOf(kind, subtype);
  const icon = initial ? accountIcon(initial) : { icon: st.icon, color: st.color };
  const isBorrowKind = kind === 'receivable' || kind === 'payable';

  const submit = () => {
    if (!name.trim()) return setError('请填写账户名称');
    const b = parseFloat(balance || '0');
    if (Number.isNaN(b)) return setError('期初余额格式不对');
    saveAccount({
      id: initial?.id ?? uid(),
      name: name.trim(),
      emoji: icon.icon,
      type: kindToType(kind),
      initialBalance: round2(b),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      kind,
      subtype,
      note: note.trim() || undefined,
      includeInNet,
      canSelect,
      lendDate: isBorrowKind && lendDate ? lendDate : undefined,
    });
    onClose();
  };

  const del = () => {
    if (initial && window.confirm(`确定删除账户「${initial.name}」吗？其名下流水也会一并删除。`)) {
      removeAccount(initial.id);
      onClose();
    }
  };

  return (
    <Modal title={initial ? '编辑账户' : '添加账户'} onClose={onClose}>
      <div className="form-grid">
        <button className="acc-type-row" onClick={onPickType}>
          <span className="icon-circle lg" style={{ background: icon.color + '22', color: icon.color }}>
            {icon.icon}
          </span>
          <span className="acc-type-name">
            {st.label}
            <em>{KIND_MAP[kind].label}</em>
          </span>
          <span className="type-row-arrow">›</span>
        </button>
        <label className="field">
          <span>账户名称</span>
          <input placeholder="请输入账户名称" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>账户备注（可不填）</span>
          <input placeholder="点击填写备注" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label className="field">
          <span>期初余额{kind === 'credit' || kind === 'payable' ? '（填欠款金额）' : ''}</span>
          <input inputMode="decimal" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </label>
      </div>

      {isBorrowKind && (
        <label className="field section">
          <span>借款时间（可不填）</span>
          <input type="date" value={lendDate} onChange={(e) => setLendDate(e.target.value)} />
        </label>
      )}

      <div className="form-grid">
        <div className="field acc-static-row">
          <span>账户币种</span>
          <b>人民币 (CNY)</b>
        </div>
        <label className="field switch-row">
          <span>计入总资产</span>
          <span className="switch">
            <input type="checkbox" checked={includeInNet} onChange={(e) => setIncludeInNet(e.target.checked)} />
            <i />
          </span>
        </label>
      </div>

      <div className="card inline-card">
        <label className="field switch-row">
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
    </Modal>
  );
}
