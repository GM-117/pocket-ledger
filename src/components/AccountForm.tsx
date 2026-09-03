import { useState } from 'react';
import { ACCOUNT_EMOJIS, useStore } from '../store';
import type { Account, AccountType } from '../types';
import { round2, uid } from '../utils';
import { Modal } from './Modal';

interface AccountFormProps {
  initial: Account | null;
  onClose: () => void;
}

export function AccountForm({ initial, onClose }: AccountFormProps) {
  const saveAccount = useStore((s) => s.saveAccount);
  const removeAccount = useStore((s) => s.removeAccount);

  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💵');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'asset');
  const [balance, setBalance] = useState(initial ? String(initial.initialBalance) : '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) return setError('请填写账户名称');
    const b = parseFloat(balance || '0');
    if (Number.isNaN(b)) return setError('期初余额格式不对');
    saveAccount({
      id: initial?.id ?? uid(),
      name: name.trim(),
      emoji,
      type,
      initialBalance: round2(b),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
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
        <label className="field">
          <span>账户名称</span>
          <input placeholder="如：微信零钱" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>期初余额（负债填欠款金额）</span>
          <input inputMode="decimal" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </label>
      </div>

      <div className="field">
        <span>账户类型</span>
        <div className="seg">
          <button className={type === 'asset' ? 'active income' : ''} onClick={() => setType('asset')}>
            资产账户
          </button>
          <button className={type === 'liability' ? 'active expense' : ''} onClick={() => setType('liability')}>
            负债账户
          </button>
        </div>
      </div>

      <div className="field">
        <span>图标</span>
        <div className="emoji-row">
          {ACCOUNT_EMOJIS.map((e) => (
            <button key={e} className={'emoji-pick' + (emoji === e ? ' active' : '')} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
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
