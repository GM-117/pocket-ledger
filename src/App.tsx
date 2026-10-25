import { useEffect, useState } from 'react';
import { Layout, type TabKey } from './components/Layout';
import { BookManager } from './components/BookManager';
import { GuideOverlay } from './components/GuideOverlay';
import { ScanModal } from './components/ScanModal';
import { SettingsPanel } from './components/SettingsPanel';
import { TransactionForm } from './components/TransactionForm';
import { TxnDetail } from './components/TxnDetail';
import { AssetsPage } from './pages/AssetsPage';
import { CalendarPage } from './pages/CalendarPage';
import { DetailPage } from './pages/DetailPage';
import { StatsPage } from './pages/StatsPage';
import { useStore, ensureAdjustCategories } from './store';
import { getTheme } from './theme';
import type { Txn } from './types';

/**
 * 截图记账入口开关。识别链路、本机 OCR 与全部单测都保留在仓库里，只是先不对外暴露：
 * 真实账单截图的版式差异仍会导致漏读，使用体验还没打磨到位。
 * 恢复只需把此常量改为 true，其余代码无需改动。
 */
const SHOW_SCAN = false;

export default function App() {
  const [tab, setTab] = useState<TabKey>('detail');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [preset, setPreset] = useState<Txn | null>(null);
  const [bookMgrOpen, setBookMgrOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** 截图 / 文字识别记账 */
  const [scanOpen, setScanOpen] = useState(false);
  /** 首次使用引导：未看过时自动弹出，可随时从顶栏「?」再次打开 */
  const [guideOpen, setGuideOpen] = useState(() => !useStore.getState().guideSeen);
  /** 调整流水没有记账表单，列表点击时改走账单详情 */
  const [adjustDetailId, setAdjustDetailId] = useState<string | null>(null);
  const theme = useStore((s) => s.theme);

  const closeGuide = () => {
    useStore.getState().setGuideSeen();
    setGuideOpen(false);
  };

  // 主题：html data-theme + 状态栏颜色跟随（themeColor 查表见 theme.ts）
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', getTheme(theme).themeColor);
  }, [theme]);

  // 切页后回到顶部：滚动容器是 document，上一页（如图表长页）滚到底后残留的滚动量
  // 不会自动收敛，切到较短页面时真机 WebView 会停在空白区，需手动滑动才能恢复
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  // 启动时补齐周期账单与隐藏的系统分类
  useEffect(() => {
    useStore.setState((s) => ({ categories: ensureAdjustCategories(s.categories) }));
    useStore.getState().runRecurrences();
  }, []);

  const openEditor = (t: Txn | null) => {
    if (t && t.type === 'adjust') {
      setAdjustDetailId(t.id);
      return;
    }
    setEditing(t);
    setPreset(null);
    setFormOpen(true);
  };

  const openFromTemplate = (p: Txn) => {
    setEditing(null);
    setPreset(p);
    setFormOpen(true);
  };

  return (
    <>
      <Layout
        tab={tab}
        onTab={setTab}
        onAdd={() => openEditor(null)}
        onScan={SHOW_SCAN ? () => setScanOpen(true) : undefined}
        onOpenBooks={() => setBookMgrOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        {tab === 'detail' && (
          <DetailPage onEdit={openEditor} onManage={() => setBookMgrOpen(true)} onUseTemplate={openFromTemplate} />
        )}
        {tab === 'assets' && <AssetsPage onEdit={openEditor} onQuickAdd={openFromTemplate} />}
        {tab === 'calendar' && <CalendarPage onEdit={openEditor} />}
        {tab === 'stats' && <StatsPage />}
      </Layout>

      {formOpen && (
        <TransactionForm initial={editing} preset={preset} onClose={() => setFormOpen(false)} />
      )}
      {adjustDetailId && (
        <TxnDetail
          txnId={adjustDetailId}
          backLabel="返回"
          onClose={() => setAdjustDetailId(null)}
          onEdit={openEditor}
        />
      )}
      {bookMgrOpen && <BookManager onClose={() => setBookMgrOpen(false)} />}
      {SHOW_SCAN && scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          onDone={(p) => {
            // 先关掉识别弹层再开记账面板，避免两层 overlay 的滚动锁互相打架
            setScanOpen(false);
            openFromTemplate(p);
          }}
        />
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {guideOpen && <GuideOverlay onClose={closeGuide} />}
    </>
  );
}
