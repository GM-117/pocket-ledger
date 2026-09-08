import { useState } from 'react';
import type { Category, TxnType } from '../types';
import { Modal } from './Modal';
import { CheckIcon, LIcon } from './icons';

export interface PickerOption {
  id: string;
  label: string;
  emoji?: string;
}

interface OptionPickerModalProps {
  title: string;
  options: PickerOption[];
  selectedId?: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

/** 单选弹窗：账本 / 账户等行内编辑复用 */
export function OptionPickerModal({ title, options, selectedId, onPick, onClose }: OptionPickerModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="option-list">
        {options.map((o) => (
          <button
            key={o.id}
            className={'option-row' + (o.id === selectedId ? ' active' : '')}
            onClick={() => onPick(o.id)}
          >
            {o.emoji && (
              <span className="emoji-dot">
                <LIcon emoji={o.emoji} size={17} />
              </span>
            )}
            <span className="option-label">{o.label}</span>
            {o.id === selectedId && (
              <span className="option-check">
                <CheckIcon size={14} />
              </span>
            )}
          </button>
        ))}
        {options.length === 0 && <p className="empty-text">暂无可选项</p>}
      </div>
    </Modal>
  );
}

interface CategoryPickModalProps {
  categories: Category[];
  initialType: TxnType;
  onPick: (type: TxnType, categoryId: string) => void;
  onClose: () => void;
}

/** 分类选择弹窗：账单详情「类型」行内编辑复用（转账请走完整编辑面板） */
export function CategoryPickModal({ categories, initialType, onPick, onClose }: CategoryPickModalProps) {
  const [type, setType] = useState<TxnType>(initialType === 'income' ? 'income' : 'expense');
  const [categoryId, setCategoryId] = useState('');
  const cats = categories.filter((c) => c.type === type && !c.hidden);

  return (
    <Modal title="选择分类" onClose={onClose}>
      <div className="seg">
        <button className={type === 'expense' ? 'active expense' : ''} onClick={() => setType('expense')}>
          支出
        </button>
        <button className={type === 'income' ? 'active income' : ''} onClick={() => setType('income')}>
          收入
        </button>
      </div>
      <div className="cat-grid" style={{ margin: '14px 0 4px' }}>
        {cats.map((c) => (
          <button
            key={c.id}
            className={'cat-chip' + (categoryId === c.id ? ' active' : '')}
            onClick={() => setCategoryId(c.id)}
          >
            <span><LIcon emoji={c.emoji} size={21} /></span>
            {c.name}
          </button>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn ghost" onClick={onClose}>
          取消
        </button>
        <button
          className="btn primary"
          disabled={!categoryId}
          onClick={() => categoryId && onPick(type, categoryId)}
        >
          保存
        </button>
      </div>
    </Modal>
  );
}

interface DateEditModalProps {
  date: string;
  onSave: (date: string) => void;
  onClose: () => void;
}

/** 日期编辑弹窗：账单详情「时间」行内编辑复用 */
export function DateEditModal({ date, onSave, onClose }: DateEditModalProps) {
  const [val, setVal] = useState(date);
  return (
    <Modal title="修改时间" onClose={onClose}>
      <label className="field">
        <span>日期</span>
        <input autoFocus type="date" value={val} onChange={(e) => setVal(e.target.value)} />
      </label>
      <p className="field-hint">时间（时分）为记录生成时间，暂不支持修改</p>
      <div className="form-actions">
        <button className="btn ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn primary" disabled={!val} onClick={() => onSave(val)}>
          保存
        </button>
      </div>
    </Modal>
  );
}
