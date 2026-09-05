import { useState } from 'react';
import { ACCOUNT_KINDS } from '../accountCatalog';
import type { AccountKind } from '../types';
import { Modal } from './Modal';

interface AccountTypePickerProps {
  /** 打开时默认展开的大类 */
  initialKind?: AccountKind;
  onPick: (kind: AccountKind, subtype: string) => void;
  onClose: () => void;
}

/** iCost 式「选择类型」：六大账户大类手风琴，展开后选择子类型 */
export function AccountTypePicker({ initialKind, onPick, onClose }: AccountTypePickerProps) {
  const [openKind, setOpenKind] = useState<AccountKind | null>(initialKind ?? null);

  return (
    <Modal title="选择类型" onClose={onClose}>
      <div className="type-picker">
        {ACCOUNT_KINDS.map((k) => {
          const open = openKind === k.id;
          return (
            <div className="type-group" key={k.id}>
              <button className="type-group-head" onClick={() => setOpenKind(open ? null : k.id)}>
                <span>{k.label}</span>
                <span className={'type-chev' + (open ? ' open' : '')}>⌄</span>
              </button>
              {open && (
                <div className="type-list">
                  {k.subtypes.map((s) => (
                    <button
                      className="type-row"
                      key={s.id}
                      onClick={() => onPick(k.id, s.id)}
                    >
                      <span
                        className="icon-circle"
                        style={{ background: s.color + '22', color: s.color }}
                      >
                        {s.icon}
                      </span>
                      <span className="type-row-label">{s.label}</span>
                      <span className="type-row-arrow">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
