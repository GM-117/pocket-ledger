import { useState } from 'react';
import { round2 } from '../utils';
import { CalcKeypad } from './CalcKeypad';
import { Modal } from './Modal';
import { CloseIcon } from './icons';

interface AmountPadModalProps {
  title: string;
  /** 初始金额字符串（如 "3600" 或 "3600.5"） */
  initial: string;
  /** 提交回调；非法输入返回错误信息，成功返回 null */
  onSubmit: (amount: number) => string | null;
  onClose: () => void;
}

/** 金额编辑弹窗：数字键盘 + 清除，账单详情「金额」行内编辑复用 */
export function AmountPadModal({ title, initial, onSubmit, onClose }: AmountPadModalProps) {
  const [expr, setExpr] = useState(() => String(round2(parseFloat(initial) || 0)));
  const [error, setError] = useState('');

  const press = (k: string) => {
    setError('');
    if (k === 'del') return setExpr((e) => e.slice(0, -1));
    if (k === '.') {
      return setExpr((e) => (e.includes('.') ? e : e === '' ? '0.' : e + '.'));
    }
    setExpr((e) => (e.replace('.', '').length >= 10 ? e : e === '0' ? k : e + k));
  };

  const done = () => {
    const n = parseFloat(expr);
    if (!Number.isFinite(n) || expr === '') return setError('金额格式不对');
    if (n < 0) return setError('金额不能为负数');
    if (n === 0) return setError('金额需大于 0');
    const err = onSubmit(round2(n));
    if (err) return setError(err);
    onClose();
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="adj-input-row">
        <input
          value={expr}
          inputMode="decimal"
          placeholder="请输入金额"
          onChange={(e) => {
            setExpr(e.target.value.replace(/[^\d.-]/g, ''));
            setError('');
          }}
        />
        {expr && (
          <button className="adj-clear" onClick={() => setExpr('')} aria-label="清除">
            <CloseIcon size={11} />
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="adj-grid">
        <CalcKeypad onKey={press} />
        <button className="kp-key done adj-done" onClick={done}>
          完成
        </button>
      </div>
    </Modal>
  );
}
