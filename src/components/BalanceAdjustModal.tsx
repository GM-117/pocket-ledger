import { useState } from 'react';
import { useStore } from '../store';
import type { Account } from '../types';
import { accountBalance, fmtISO, round2, uid } from '../utils';

interface BalanceAdjustModalProps {
  account: Account;
  onClose: () => void;
}

/** 四则运算求值：仅数字与 + - * /，先乘除后加减，支持负号开头；非法返回 NaN */
export function evalAmount(raw: string): number {
  const s = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!s || !/^[0-9.+\-*/]+$/.test(s) || /[+\-*/]{2,}/.test(s)) return NaN;
  const tokens = s.match(/\d+\.?\d*|\.\d+|[+\-*/]/g);
  if (!tokens) return NaN;
  let k = 0;
  let sign = 1;
  if (tokens[0] === '+' || tokens[0] === '-') {
    sign = tokens[0] === '-' ? -1 : 1;
    k = 1;
  }
  if (k >= tokens.length || /^[+\-*/]$/.test(tokens[k])) return NaN;
  let cur = sign * parseFloat(tokens[k]);
  k += 1;
  const flat: (number | string)[] = [];
  while (k < tokens.length) {
    const op = tokens[k];
    const next = tokens[k + 1];
    if (!next || /^[+\-*/]$/.test(next)) return NaN;
    const v = parseFloat(next);
    if (op === '*' || op === '/') {
      if (op === '/' && v === 0) return NaN;
      cur = op === '*' ? cur * v : cur / v;
    } else {
      flat.push(cur, op);
      cur = v;
    }
    k += 2;
  }
  flat.push(cur);
  let result = flat[0] as number;
  for (let j = 1; j < flat.length; j += 2) {
    result = flat[j] === '+' ? (result as number) + (flat[j + 1] as number) : (result as number) - (flat[j + 1] as number);
  }
  return Math.round(result * 10000) / 10000;
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
    if (k === 'clear') return setExpr('');
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
    const delta = round2(target - current);
    if (delta === 0) return onClose();
    if (asTxn) {
      // 差额生成一笔收支流水，期初余额不动
      const incCats = categories.filter((c) => c.type === 'income');
      const expCats = categories.filter((c) => c.type === 'expense');
      const cat = delta > 0 ? incCats[0] : expCats[0];
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

        <div className="kp-grid adj-grid">
          {['1', '2', '3', '+', '4', '5', '6', '-', '7', '8', '9', '×', '.', '0', 'del', '÷'].map((k) => {
            if (k === 'del')
              return (
                <button key={k} className="kp-key op" onClick={() => press(k)} aria-label="退格">
                  ⌫
                </button>
              );
            if ('+-×÷'.includes(k))
              return (
                <button key={k} className="kp-key op" onClick={() => press(k)}>
                  {k}
                </button>
              );
            return (
              <button key={k} className="kp-key" onClick={() => press(k)}>
                {k}
              </button>
            );
          })}
          <button className="kp-key done adj-done" onClick={done}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
