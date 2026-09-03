import { useEffect, useState } from 'react';
import { Layout, type TabKey } from './components/Layout';
import { BookManager } from './components/BookManager';
import { TransactionForm } from './components/TransactionForm';
import { AssetsPage } from './pages/AssetsPage';
import { CalendarPage } from './pages/CalendarPage';
import { DetailPage } from './pages/DetailPage';
import { StatsPage } from './pages/StatsPage';
import { useStore } from './store';
import type { Txn } from './types';

export default function App() {
  const [tab, setTab] = useState<TabKey>('detail');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [preset, setPreset] = useState<Txn | null>(null);
  const [bookMgrOpen, setBookMgrOpen] = useState(false);

  // 启动时补齐周期账单
  useEffect(() => {
    useStore.getState().runRecurrences();
  }, []);

  const openEditor = (t: Txn | null) => {
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
      <Layout tab={tab} onTab={setTab} onAdd={() => openEditor(null)}>
        {tab === 'detail' && (
          <DetailPage onEdit={openEditor} onManage={() => setBookMgrOpen(true)} onUseTemplate={openFromTemplate} />
        )}
        {tab === 'assets' && <AssetsPage onEdit={openEditor} />}
        {tab === 'calendar' && <CalendarPage onEdit={openEditor} />}
        {tab === 'stats' && <StatsPage />}
      </Layout>

      {formOpen && (
        <TransactionForm initial={editing} preset={preset} onClose={() => setFormOpen(false)} />
      )}
      {bookMgrOpen && <BookManager onClose={() => setBookMgrOpen(false)} />}
    </>
  );
}
