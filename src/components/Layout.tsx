import { type ReactNode } from 'react';
import { useStore } from '../store';
import { BookIcon, ChartIcon, PlusIcon, WalletIcon } from './icons';

export type TabKey = 'books' | 'assets' | 'stats';

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: 'books', label: '账本', icon: <BookIcon /> },
  { key: 'assets', label: '资产', icon: <WalletIcon /> },
  { key: 'stats', label: '统计', icon: <ChartIcon /> },
];

const PAGE_TITLE: Record<TabKey, string> = {
  books: '账本',
  assets: '资产',
  stats: '统计',
};

interface LayoutProps {
  tab: TabKey;
  onTab: (t: TabKey) => void;
  onAdd: () => void;
  children: ReactNode;
}

export function Layout({ tab, onTab, onAdd, children }: LayoutProps) {
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const setActiveBook = useStore((s) => s.setActiveBook);
  const activeBook = books.find((b) => b.id === activeBookId) ?? books[0];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">💰</span>
          <span>
            口袋记账
            <small>PocketLedger</small>
          </span>
        </div>
        <nav className="side-nav">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => onTab(t.key)}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        {books.length > 0 && (
          <>
            <div className="side-label">账本切换</div>
            <div className="side-books">
              {books.map((b) => (
                <button
                  key={b.id}
                  className={'side-book' + (b.id === activeBook?.id ? ' active' : '')}
                  style={b.id === activeBook?.id ? { color: b.color } : undefined}
                  onClick={() => setActiveBook(b.id)}
                >
                  <span>{b.emoji}</span>
                  {b.name}
                </button>
              ))}
            </div>
          </>
        )}
        <button className="btn primary side-add" onClick={onAdd}>
          <PlusIcon size={16} /> 记一笔
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{PAGE_TITLE[tab]}</h1>
          {activeBook && (
            <button className="book-chip" style={{ color: activeBook.color }} onClick={() => onTab('books')}>
              {activeBook.emoji} {activeBook.name}
            </button>
          )}
        </header>

        <main className="content">{children}</main>
      </div>

      <button className="fab" onClick={onAdd} aria-label="记一笔">
        <PlusIcon />
      </button>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={'tab-item' + (tab === t.key ? ' active' : '')} onClick={() => onTab(t.key)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
