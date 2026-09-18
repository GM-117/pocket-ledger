import { type ReactNode } from 'react';
import { useStore } from '../store';
import {
  BrandIcon,
  ChevronDownIcon,
  GearIcon,
  LIcon,
  MoonIcon,
  PlusIcon,
  QuestionIcon,
  SunIcon,
  TAB_ICON_SETS,
} from './icons';

export type TabKey = 'detail' | 'assets' | 'calendar' | 'stats';

const TAB_META: { key: TabKey; label: string }[] = [
  { key: 'detail', label: '明细' },
  { key: 'assets', label: '资产' },
  { key: 'calendar', label: '日历' },
  { key: 'stats', label: '图表' },
];

const PAGE_TITLE: Record<TabKey, string> = {
  detail: '明细',
  assets: '资产',
  calendar: '日历',
  stats: '统计',
};

interface LayoutProps {
  tab: TabKey;
  onTab: (t: TabKey) => void;
  onAdd: () => void;
  /** 顶右账本芯片 → 打开账本管理（切换/创建/编辑/删除） */
  onOpenBooks: () => void;
  /** 顶栏帮助按钮 → 打开使用引导 */
  onOpenGuide: () => void;
  /** 顶栏 ⚙ → 打开设置（数据管理：导出 / 导入 / 模拟数据 / 清空） */
  onOpenSettings: () => void;
  children: ReactNode;
}

export function Layout({ tab, onTab, onAdd, onOpenBooks, onOpenGuide, onOpenSettings, children }: LayoutProps) {
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const setActiveBook = useStore((s) => s.setActiveBook);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  // 风格主题使用专属底栏图标包（糖果 / 樱花 / 手账），简约深浅沿用基础图标
  const tabIcons = TAB_ICON_SETS[theme];
  const TABS = TAB_META.map((t) => {
    const Icon = tabIcons[t.key];
    return { ...t, icon: <Icon /> };
  });
  const activeBook = books.find((b) => b.id === activeBookId) ?? books[0];
  const themeBtn = (
    <button
      className="theme-btn"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? '切换到深色主题' : '切换到简约浅色主题'}
    >
      {theme === 'light' ? (
        <MoonIcon size={17} />
      ) : theme === 'dark' ? (
        <SunIcon size={17} />
      ) : (
        // 风格主题：显示当前主题色圆点，点击回简约浅色
        <span className="theme-dot" aria-hidden="true" />
      )}
    </button>
  );
  const guideBtn = (
    <button className="theme-btn" onClick={onOpenGuide} aria-label="使用指南">
      <QuestionIcon size={17} />
    </button>
  );
  const settingsBtn = (
    <button className="theme-btn" onClick={onOpenSettings} aria-label="设置">
      <GearIcon size={17} />
    </button>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">
            <BrandIcon size={20} />
          </span>
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
        <div className="side-label">
          <span>账本切换</span>
          <button className="side-label-btn" onClick={onOpenBooks} title="新建 / 编辑 / 删除账本">
            ＋ 管理
          </button>
        </div>
        <div className="side-books">
          {books.map((b) => (
            <button
              key={b.id}
              className={'side-book' + (b.id === activeBook?.id ? ' active' : '')}
              style={b.id === activeBook?.id ? { color: b.color } : undefined}
              onClick={() => setActiveBook(b.id)}
            >
              <LIcon emoji={b.emoji} size={16} />
              {b.name}
            </button>
          ))}
          {books.length === 0 && <p className="side-books-empty">还没有账本，点「＋ 管理」创建</p>}
        </div>
        <button className="btn primary side-add" onClick={onAdd}>
          <PlusIcon size={16} /> 记一笔
        </button>
        <div className="side-actions">
          {guideBtn}
          {themeBtn}
          {settingsBtn}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{PAGE_TITLE[tab]}</h1>
          <div className="topbar-right">
            {guideBtn}
            {themeBtn}
            {settingsBtn}
            {activeBook && (
              <button
                className="book-chip"
                style={{ color: activeBook.color }}
                onClick={onOpenBooks}
                title="切换 / 管理账本"
              >
                <LIcon emoji={activeBook.emoji} size={15} />
                {activeBook.name}
                <ChevronDownIcon size={12} className="book-chip-chev" />
              </button>
            )}
          </div>
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
