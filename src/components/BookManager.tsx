import { useState } from 'react';
import { BOOK_EMOJIS, useStore } from '../store';
import type { Book } from '../types';
import { uid } from '../utils';
import { Modal } from './Modal';

const COLORS = ['#5b7cfa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface BookManagerProps {
  onClose: () => void;
}

export function BookManager({ onClose }: BookManagerProps) {
  const books = useStore((s) => s.books);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);
  const setActiveBook = useStore((s) => s.setActiveBook);
  const saveBook = useStore((s) => s.saveBook);
  const removeBook = useStore((s) => s.removeBook);

  const [editing, setEditing] = useState<Book | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [color, setColor] = useState(COLORS[0]);

  const startEdit = (b: Book) => {
    setEditing(b);
    setName(b.name);
    setEmoji(b.emoji);
    setColor(b.color);
  };

  const resetForm = () => {
    setEditing(null);
    setName('');
    setEmoji('🏠');
    setColor(COLORS[0]);
  };

  const submit = () => {
    if (!name.trim()) return;
    saveBook({
      id: editing?.id ?? uid(),
      name: name.trim(),
      emoji,
      color,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
    resetForm();
  };

  const del = (b: Book) => {
    const n = txns.filter((t) => t.bookId === b.id).length;
    const msg =
      n > 0
        ? `「${b.name}」里还有 ${n} 笔记录，删除账本会一并删除这些记录，确定吗？`
        : `确定删除账本「${b.name}」吗？`;
    if (window.confirm(msg)) {
      removeBook(b.id);
      if (editing?.id === b.id) resetForm();
    }
  };

  return (
    <Modal title="账本管理" onClose={onClose}>
      <div className="field">
        <span>{editing ? `编辑账本：${editing.name}` : '新建账本'}</span>
        <div className="form-grid">
          <input placeholder="账本名称，如：日常生活" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="emoji-row">
          {BOOK_EMOJIS.map((e) => (
            <button key={e} className={'emoji-pick' + (emoji === e ? ' active' : '')} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
        <div className="emoji-row">
          {COLORS.map((c) => (
            <button
              key={c}
              className={'color-pick' + (color === c ? ' active' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
        <div className="form-actions">
          {editing && (
            <button className="btn ghost" onClick={resetForm}>
              取消编辑
            </button>
          )}
          <button className="btn primary" onClick={submit} disabled={!name.trim()}>
            {editing ? '保存修改' : '创建账本'}
          </button>
        </div>
      </div>

      <div className="section-title">全部账本（{books.length}）</div>
      <div className="book-manage-list">
        {books.map((b) => {
          const n = txns.filter((t) => t.bookId === b.id).length;
          return (
            <div className={'book-manage-row' + (b.id === activeBookId ? ' active' : '')} key={b.id}>
              <button
                className="book-manage-main"
                onClick={() => {
                  setActiveBook(b.id);
                  onClose();
                }}
              >
                <span className="emoji-dot book" style={{ background: b.color + '22', color: b.color }}>
                  {b.emoji}
                </span>
                <span className="txn-main">
                  <span className="txn-cat">
                    {b.name}
                    {b.id === activeBookId && <span className="txn-book">当前使用</span>}
                  </span>
                  <span className="txn-sub">{n} 笔记录</span>
                </span>
              </button>
              <button className="icon-btn" onClick={() => startEdit(b)} aria-label="编辑">
                ✏️
              </button>
              <button className="icon-btn" onClick={() => del(b)} aria-label="删除">
                🗑️
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
