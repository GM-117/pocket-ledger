import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import type { Txn, TxnType } from '../types';
import { accountBalance, computeTotals, fmtISO, fmtMoney } from '../utils';
import { AccountForm } from '../components/AccountForm';
import { TxnList } from '../components/TxnList';

type Filter = 'all' | TxnType;

export function AssetsPage({ onEdit }: { onEdit: (t: Txn) => void }) {
  const accounts = useStore((s) => s.accounts);
  const txns = useStore((s) => s.txns);
  const hideAmounts = useStore((s) => s.hideAmounts);
  const toggleHideAmounts = useStore((s) => s.toggleHideAmounts);
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const loadDemo = useStore((s) => s.loadDemo);

  const [filter, setFilter] = useState<Filter>('all');
  const [editingAcc, setEditingAcc] = useState<null | 'new' | string>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const money = (n: number) => (hideAmounts ? '¥ ✱✱✱✱' : fmtMoney(n));

  const totals = useMemo(() => computeTotals(accounts, txns), [accounts, txns]);

  const sortedAccounts = useMemo(() => {
    const bal = (id: string) => {
      const a = accounts.find((x) => x.id === id)!;
      return accountBalance(a, txns);
    };
    return [...accounts].sort(
      (a, b) =>
        (a.type === 'asset' ? 0 : 1) - (b.type === 'asset' ? 0 : 1) ||
        bal(b.id) - bal(a.id),
    );
  }, [accounts, txns]);

  const filteredTxns = useMemo(
    () => (filter === 'all' ? txns : txns.filter((t) => t.type === filter)),
    [txns, filter],
  );

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocket-ledger-${fmtISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('已导出备份文件 ✓');
  };

  const onImportFile = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const err = importJSON(String(r.result));
      setMsg(err ?? '导入成功 ✓');
    };
    r.readAsText(f);
  };

  const editingAccount = (() => {
    if (editingAcc === 'new') return null;
    const id = editingAcc;
    return accounts.find((a) => a.id === id) ?? null;
  })();

  return (
    <>
      <div className="hero">
        <div className="hero-label-row">
          <span className="label">净资产（总资产 − 总负债）</span>
          <button className="eye-btn" onClick={toggleHideAmounts} aria-label="隐藏或显示金额">
            {hideAmounts ? '🙈' : '👁'}
          </button>
        </div>
        <div className="net">{money(totals.netWorth)}</div>
        <div className="sub">
          <div>
            <span>总资产</span>
            <strong>{money(totals.assets)}</strong>
          </div>
          <div>
            <span>总负债</span>
            <strong>{money(totals.liabilities)}</strong>
          </div>
          <div>
            <span>账户数</span>
            <strong>{accounts.length}</strong>
          </div>
        </div>
      </div>

      <div className="section-title">
        <span>我的账户</span>
        <button className="chip" onClick={() => setEditingAcc('new')}>
          ＋ 添加账户
        </button>
      </div>
      <div className="card account-list">
        {sortedAccounts.map((a) => {
          const b = accountBalance(a, txns);
          return (
            <button className="account-row" key={a.id} onClick={() => setEditingAcc(a.id)}>
              <span className="emoji-dot">{a.emoji}</span>
              <span className="txn-main">
                <span className="txn-cat">
                  {a.name}
                  <span className={'acct-tag ' + a.type}>{a.type === 'asset' ? '资产' : '负债'}</span>
                </span>
                <span className="txn-sub">期初 {fmtMoney(a.initialBalance)}</span>
              </span>
              <span className={'amount ' + (a.type === 'asset' ? 'pos' : 'neg')}>
                {a.type === 'asset' ? '' : '−'}
                {money(Math.abs(b))}
              </span>
            </button>
          );
        })}
        {accounts.length === 0 && <p className="empty-text">还没有账户，添加一个吧</p>}
        <button className="account-add" onClick={() => setEditingAcc('new')}>
          ＋ 添加资产 / 负债账户
        </button>
      </div>

      <div className="section-title">
        <span>全部收支记录（{filteredTxns.length}）</span>
        <div className="chips">
          {(
            [
              ['all', '全部'],
              ['expense', '支出'],
              ['income', '收入'],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button key={k} className={'chip' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <TxnList txns={filteredTxns} onEdit={onEdit} showBook />

      <div className="section-title">
        <span>数据管理</span>
        {msg && <span className="data-msg">{msg}</span>}
      </div>
      <div className="card data-actions">
        <button className="btn ghost" onClick={doExport}>
          ⬇️ 导出数据
        </button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>
          ⬆️ 导入数据
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (window.confirm('重置为演示数据？当前所有数据将被覆盖。')) {
              loadDemo();
              setMsg('已重置为演示数据 ✓');
            }
          }}
        >
          ♻️ 重置演示
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            onImportFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {editingAcc !== null && (
        <AccountForm initial={editingAccount} onClose={() => setEditingAcc(null)} />
      )}
    </>
  );
}
