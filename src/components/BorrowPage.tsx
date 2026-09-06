import { useMemo, useState } from 'react';
import { accountIcon } from '../accountCatalog';
import { useStore } from '../store';
import type { Account, AccountKind } from '../types';
import { accountBalance, fmtMoney, lockBodyScroll, unlockBodyScroll } from '../utils';
import { useEffect } from 'react';

interface BorrowPageProps {
  /** 初始选中的分段（由总借入/总借出卡片决定） */
  initialTab?: 'borrow' | 'lend';
  onClose: () => void;
  /** 点击条目 → 账户详情 */
  onOpenDetail: (a: Account) => void;
  /** ＋ → 打开选择类型页（预选大类） */
  onAdd: (kind: AccountKind) => void;
}

/** iCost 式借入/借出列表：显示借款时间与金额 */
export function BorrowPage({ initialTab = 'borrow', onClose, onOpenDetail, onAdd }: BorrowPageProps) {
  const accounts = useStore((s) => s.accounts);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);
  const hideAmounts = useStore((s) => s.hideAmounts);
  const [tab, setTab] = useState<'borrow' | 'lend'>(initialTab);

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  const money = (n: number) => (hideAmounts ? '¥ ✱✱✱✱' : fmtMoney(n));

  // 借入借出随账本走：只统计当前账本名下的流水
  const bookTxns = useMemo(
    () => txns.filter((t) => t.bookId === activeBookId),
    [txns, activeBookId],
  );

  const list = useMemo(
    () =>
      accounts
        .filter((a) => (tab === 'borrow' ? a.kind === 'payable' : a.kind === 'receivable'))
        .map((a) => ({ a, bal: accountBalance(a, bookTxns) })),
    [accounts, bookTxns, tab],
  );
  const total = useMemo(() => list.reduce((s, x) => s + x.bal, 0), [list]);

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-page">
      <div className="page-head">
        <button className="page-back" onClick={onClose}>
          ‹ 资产
        </button>
        <div className="seg">
          <button className={tab === 'borrow' ? 'active expense' : ''} onClick={() => setTab('borrow')}>
            借入
          </button>
          <button className={tab === 'lend' ? 'active income' : ''} onClick={() => setTab('lend')}>
            借出
          </button>
        </div>
        <button className="page-action" onClick={() => onAdd(tab === 'borrow' ? 'payable' : 'receivable')}>
          ＋
        </button>
      </div>

      <div className="page-body">
        {list.length > 0 && (
          <div className="borrow-total card">
            <span>{tab === 'borrow' ? '借入总额（欠款）' : '借出总额（应收）'}</span>
            <b className={tab === 'borrow' ? 'neg' : 'pos'}>{money(total)}</b>
          </div>
        )}
        {list.length === 0 && (
          <div className="empty">
            <span className="empty-emoji">🤝</span>
            <p>{tab === 'borrow' ? '没有借入账户，点右上角「＋」添加' : '没有借出账户，点右上角「＋」添加'}</p>
          </div>
        )}
        {list.length > 0 && (
          <div className="card borrow-list">
            {list.map(({ a, bal }) => {
              const icon = accountIcon(a);
              const dateParts = a.lendDate?.split('-');
              return (
                <button className="borrow-row" key={a.id} onClick={() => onOpenDetail(a)}>
                  <span className="icon-circle" style={{ background: icon.color + '22', color: icon.color }}>
                    {icon.icon}
                  </span>
                  <span className="txn-main">
                    <span className="txn-cat">
                      {a.name}
                      {!a.includeInNet && <span className="badge-off">不计入</span>}
                    </span>
                    {a.note && <span className="txn-sub">{a.note}</span>}
                    <span className="txn-sub borrow-date">
                      📅 {dateParts ? `${dateParts[0]}年${dateParts[1]}月${dateParts[2]}日` : '未记录借款时间'}
                    </span>
                  </span>
                  <span className={'amount ' + (tab === 'borrow' ? 'neg' : 'pos')}>
                    {tab === 'borrow' ? '−' : '+'}
                    {money(bal)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
