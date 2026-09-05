import { useMemo, useRef, useState } from 'react';
import { accountIcon, ACCOUNT_KINDS, KIND_MAP } from '../accountCatalog';
import { useStore } from '../store';
import type { Account, AccountKind, Txn } from '../types';
import { accountBalance, computeTotals, fmtISO, fmtMoney } from '../utils';
import { AccountDetail } from '../components/AccountDetail';
import { AccountForm, type AccountTypePreset } from '../components/AccountForm';
import { AccountTypePicker } from '../components/AccountTypePicker';
import { BorrowPage } from '../components/BorrowPage';
import { SwipeRow } from '../components/SwipeRow';

interface AssetsPageProps {
  /** 账户详情内点击流水 → 编辑 */
  onEdit: (t: Txn) => void;
  /** 账户详情「记一笔」（预填账户） */
  onQuickAdd: (preset: Txn) => void;
}

interface FormState extends AccountTypePreset {
  accountId: 'new' | string;
}

export function AssetsPage({ onEdit, onQuickAdd }: AssetsPageProps) {
  const accounts = useStore((s) => s.accounts);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);
  const hideAmounts = useStore((s) => s.hideAmounts);
  const toggleHideAmounts = useStore((s) => s.toggleHideAmounts);
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const loadDemo = useStore((s) => s.loadDemo);
  const removeAccount = useStore((s) => s.removeAccount);

  const [openKinds, setOpenKinds] = useState<Set<AccountKind>>(new Set());
  const [pickOpen, setPickOpen] = useState(false);
  const [pickInitialKind, setPickInitialKind] = useState<AccountKind | undefined>(undefined);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [borrowOpen, setBorrowOpen] = useState(false);
  /** 当前左滑展开的账户行（互斥） */
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const money = (n: number) => (hideAmounts ? '¥ ✱✱✱✱' : fmtMoney(n));

  const totals = useMemo(() => computeTotals(accounts, txns), [accounts, txns]);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, accountBalance(a, txns));
    return map;
  }, [accounts, txns]);

  /** 总借入 / 总借出 */
  const borrowTotals = useMemo(() => {
    let debt = 0;
    let lend = 0;
    for (const a of accounts) {
      if (a.includeInNet === false) continue;
      const b = balances.get(a.id) ?? 0;
      if (a.kind === 'payable') debt += b;
      if (a.kind === 'receivable') lend += b;
    }
    return { debt: Math.round(debt * 100) / 100, lend: Math.round(lend * 100) / 100 };
  }, [accounts, balances]);

  const kindRows = useMemo(
    () =>
      ACCOUNT_KINDS.map((k) => {
        const rows = accounts
          .filter((a) => a.kind === k.id)
          .map((a) => ({ a, bal: balances.get(a.id) ?? 0 }))
          .sort((x, y) => y.bal - x.bal);
        const sum = Math.round(rows.reduce((s, r) => s + r.bal, 0) * 100) / 100;
        return { kind: k, rows, sum };
      }),
    [accounts, balances],
  );

  const detailAccount = detailId ? accounts.find((a) => a.id === detailId) ?? null : null;
  const editingAccount = formState && formState.accountId !== 'new'
    ? accounts.find((a) => a.id === formState.accountId) ?? null
    : null;

  const onPickType = (kind: AccountKind, subtype: string) => {
    setFormState((cur) => (cur ? { ...cur, kind, subtype } : { accountId: 'new', kind, subtype }));
    setPickOpen(false);
  };

  const openPicker = (kind?: AccountKind) => {
    setPickInitialKind(kind);
    setPickOpen(true);
  };

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
        </div>
      </div>

      <div className="borrow-cards">
        <button className="borrow-card" onClick={() => setBorrowOpen(true)}>
          <span className="borrow-icon in">⬇</span>
          <span className="borrow-main">
            <span>总借入</span>
            <b>{money(borrowTotals.debt)}</b>
          </span>
        </button>
        <button className="borrow-card" onClick={() => setBorrowOpen(true)}>
          <span className="borrow-icon out">⬆</span>
          <span className="borrow-main">
            <span>总借出</span>
            <b>{money(borrowTotals.lend)}</b>
          </span>
        </button>
      </div>

      <div className="section-title">
        <span>账户类型</span>
        <button className="chip" onClick={() => openPicker()}>
          ＋ 添加账户
        </button>
      </div>

      {kindRows.map(({ kind, rows, sum }) => {
        const open = openKinds.has(kind.id);
        return (
          <section className="kind-group" key={kind.id}>
            <button
              className="kind-head"
              onClick={() =>
                setOpenKinds((cur) => {
                  const next = new Set(cur);
                  if (next.has(kind.id)) next.delete(kind.id);
                  else next.add(kind.id);
                  return next;
                })
              }
            >
              <span className="kind-name">
                {kind.label} <em>({rows.length})</em>
              </span>
              <span className="kind-sum">
                {rows.length > 0 && (
                  <>
                    {KIND_MAP[kind.id].sum === 'debt' ? '欠款: ' : '余额: '}
                    <b className={KIND_MAP[kind.id].sum === 'debt' ? 'neg' : ''}>{money(sum)}</b>
                  </>
                )}
                <span className={'type-chev' + (open ? ' open' : '')}>⌄</span>
              </span>
            </button>
            {open && (
              <div className="card kind-body">
                {rows.map(({ a, bal }) => {
                  const icon = accountIcon(a);
                  const row = (
                    <button
                      className="account-row"
                      onClick={() => {
                        setOpenSwipeId(null);
                        setDetailId(a.id);
                      }}
                    >
                      <span className="icon-circle" style={{ background: icon.color + '22', color: icon.color }}>
                        {icon.icon}
                      </span>
                      <span className="txn-main">
                        <span className="txn-cat">
                          {a.name}
                          {!a.includeInNet && <span className="badge-off">不计入</span>}
                        </span>
                        <span className="txn-sub">
                          {kindLabel(a)}
                          {a.note ? ` · ${a.note}` : ''}
                        </span>
                      </span>
                      <span className={'amount ' + (a.type === 'asset' ? 'pos' : 'neg')}>
                        {a.type === 'asset' ? '' : '−'}
                        {money(Math.abs(bal))}
                      </span>
                    </button>
                  );
                  return (
                    <SwipeRow
                      key={a.id}
                      open={openSwipeId === a.id}
                      onOpenChange={(open) => setOpenSwipeId(open ? a.id : null)}
                      onDelete={() => {
                        if (
                          window.confirm(
                            `您正在执行账户「${a.name}」的删除操作，将同时删除该账户及其全部账单记录，确定继续吗？`,
                          )
                        ) {
                          removeAccount(a.id);
                        }
                      }}
                    >
                      {row}
                    </SwipeRow>
                  );
                })}
                {rows.length === 0 && <p className="empty-text">该类型下还没有账户</p>}
              </div>
            )}
          </section>
        );
      })}

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

      {/* 顺序：表单在下、类型选择在上（同为顶层弹窗，后渲染者覆盖） */}
      {formState && (
        <AccountForm
          initial={editingAccount}
          typePreset={{ kind: formState.kind, subtype: formState.subtype }}
          onPickType={() => openPicker(formState.kind)}
          onClose={() => setFormState(null)}
        />
      )}
      {pickOpen && (
        <AccountTypePicker initialKind={pickInitialKind} onPick={onPickType} onClose={() => setPickOpen(false)} />
      )}
      {borrowOpen && (
        <BorrowPage
          onClose={() => setBorrowOpen(false)}
          onOpenDetail={(a) => setDetailId(a.id)}
          onAdd={(kind) => openPicker(kind)}
        />
      )}
      {detailAccount && (
        <AccountDetail
          account={detailAccount}
          onClose={() => setDetailId(null)}
          onEditTxn={onEdit}
          onQuickAdd={onQuickAdd}
          onEditAccount={(a) => setFormState({ accountId: a.id, kind: a.kind, subtype: a.subtype })}
        />
      )}
    </>
  );
}

function kindLabel(a: Account): string {
  const k = KIND_MAP[a.kind];
  const st = k?.subtypes.find((s) => s.id === a.subtype);
  return st?.label ?? '';
}
