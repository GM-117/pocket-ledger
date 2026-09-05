import { useState } from 'react';
import { useStore } from '../store';
import { ADJUST_CATEGORY_IN, ADJUST_CATEGORY_OUT, type Account } from '../types';
import { accountBalance, evalAmount, fmtISO, round2, uid } from '../utils';
import { CalcKeypad } from './CalcKeypad';

interface BalanceAdjustModalProps {
  account: Account;
  onClose: () => void;
}

/** iCost 式余额调整：带入当前余额、清除按钮、计算器键盘、差额可记为收支 */
export function BalanceAdjustModal({ account, onClose }: BalanceAdjustModalProps) {
  const txns = useStore((s) => s.txns);
  const categories = useStore((s) => s.categories);
  const activeBookId = useStore((s) => s.activeBookId);
  const saveAccount = useStore((s) => s.saveAccount);
  const saveTxn = useStore((s) => s.saveTxn);

  const current = accountBalance(account, txns);
  const [expr, setExpr] = useState(() => String(round2(current)));
  const [asTxn, setAsTxn] = useState(false);
  const [error, setError] = useState('');

  const press = (k: string) => {
    setError('');
    if (k === 'del') return setExpr((e) => e.slice(0, -1));
    if (k === '.') {
      return setExpr((e) => {
        const seg = e.split(/[+\-*/]/).pop() ?? '';
        if (seg.includes('.')) return e;
        return seg === '' ? `${e}0.` : e + '.';
      });
    }
    if ('+-*/'.includes(k)) {
      return setExpr((e) => {
        if (e === '') return k === '-' ? k : e;
        if ('+-*/'.includes(e.slice(-1))) return e.slice(0, -1) + k;
        return e + k;
      });
    }
    setExpr((e) => (e.replace(/[+\-*/]/g, '').replace('.', '').length >= 12 ? e : e + k));
  };

  const done = () => {
    const target = evalAmount(expr);
    if (!Number.isFinite(target)) return setError('金额格式不对');
    if (target < 0) return setError('金额不能为负数');
    const delta = round2(target - current);
    if (delta === 0) return onClose();
    if (asTxn) {
      // 差额生成一笔收支流水（分类为隐藏的「其他」），期初余额不动
      const cat =
        categories.find((c) => c.id === (delta > 0 ? ADJUST_CATEGORY_IN : ADJUST_CATEGORY_OUT)) ??
        categories.find((c) => c.type === (delta > 0 ? 'income' : 'expense') && !c.hidden);
      if (!cat) return setError('缺少可用的收支分类');
      saveTxn({
        id: uid(),
        bookId: activeBookId,
        accountId: account.id,
        categoryId: cat.id,
        type: delta > 0 ? 'income' : 'expense',
        amount: round2(Math.abs(delta)),
        date: fmtISO(new Date()),
        note: '余额调整',
        createdAt: new Date().toISOString(),
      });
    } else {
      saveAccount({ ...account, initialBalance: round2(account.initialBalance + delta) });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal adj-modal" role="dialog" aria-label="余额调整">
        <div className="adj-top">
          <button className="adj-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
          <span className="title">余额调整</span>
          <button className="done" onClick={done}>
            完成
          </button>
        </div>

        <div className="adj-input-row">
          <input
            value={expr}
            inputMode="decimal"
            placeholder="请输入金额"
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.+\-*/]/g, '');
              setExpr(v);
              setError('');
            }}
          />
          {expr && (
            <button className="adj-clear" onClick={() => setExpr('')} aria-label="清除">
              ✕
            </button>
          )}
        </div>

        <label className="adj-check">
          <input type="checkbox" checked={asTxn} onChange={(e) => setAsTxn(e.target.checked)} />
          将增减金额记为收支
        </label>
        <p className="adj-hint">当前余额 ¥{current.toLocaleString('zh-CN')}，默认按差额调整期初余额（不影响已有流水）</p>

        {error && <p className="form-error">{error}</p>}

        <div className="adj-grid">
          <CalcKeypad onKey={press} />
          <button className="kp-key done adj-done" onClick={done}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
