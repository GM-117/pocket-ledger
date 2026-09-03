import { useState } from 'react';
import { Layout, type TabKey } from './components/Layout';
import { BookManager } from './components/BookManager';
import { TransactionForm } from './components/TransactionForm';
import { AssetsPage } from './pages/AssetsPage';
import { BooksPage } from './pages/BooksPage';
import { StatsPage } from './pages/StatsPage';
import type { Txn } from './types';

export default function App() {
  const [tab, setTab] = useState<TabKey>('books');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [bookMgrOpen, setBookMgrOpen] = useState(false);

  const openEditor = (t: Txn | null) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <>
      <Layout tab={tab} onTab={setTab} onAdd={() => openEditor(null)}>
        {tab === 'books' && <BooksPage onEdit={openEditor} onManage={() => setBookMgrOpen(true)} />}
        {tab === 'assets' && <AssetsPage onEdit={openEditor} />}
        {tab === 'stats' && <StatsPage />}
      </Layout>

      {formOpen && <TransactionForm initial={editing} onClose={() => setFormOpen(false)} />}
      {bookMgrOpen && <BookManager onClose={() => setBookMgrOpen(false)} />}
    </>
  );
}
