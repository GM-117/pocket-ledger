import { useEffect, useState } from 'react';
import { BOOK_EMOJIS, useStore } from '../store';
import type { Book } from '../types';
import { lockBodyScroll, uid, unlockBodyScroll } from '../utils';
import { Modal } from './Modal';

const COLORS = ['#5b7cfa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface BookManagerProps {
  onClose: () => void;
}

/** iCost 式「我的账本」管理页：卡片宫格，点卡片切换，⋯ 编辑/删除，＋ 新建 */
export function BookManager({ onClose }: BookManagerProps) {
  const books = useStore((s) => s.books);
  const txns = useStore((s) => s.txns);
  const activeBookId = useStore((s) => s.activeBookId);
  const setActiveBook = useStore((s) => s.setActiveBook);
  const removeBook = useStore((s) => s.removeBook);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  // 覆盖页打开期间锁定背景滚动（计数式，叠加页共用）
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (b: Book) => {
    setEditing(b);
    setMenuId(null);
    setFormOpen(true);
  };

  const del = (b: Book) => {
    setMenuId(null);
    const n = txns.filter((t) => t.bookId === b.id).length;
    const msg =
      n > 0
        ? `「${b.name}」里还有 ${n} 笔记录，删除账本会一并删除这些记录，确定吗？`
        : `确定删除账本「${b.name}」吗？`;
    if (window.confirm(msg)) removeBook(b.id);
  };

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-page">
        <div className="page-head">
          <button className="page-back" onClick={onClose}>
            ‹ 返回
          </button>
          <span className="page-title">我的账本</span>
          <button className="page-action" onClick={openCreate} aria-label="新建账本">
            ＋
          </button>
        </div>

        <div className="page-body">
          {books.length === 0 && (
            <div className="empty">
              <span className="empty-emoji">📒</span>
              <p>还没有账本，点右上角「＋」创建</p>
            </div>
          )}
          <div className="book-grid">
            {books.map((b) => {
              const n = txns.filter((t) => t.bookId === b.id).length;
              const current = b.id === activeBookId;
              return (
                <div className={'book-card' + (current ? ' current' : '')} key={b.id}>
                  <button className="book-card-main" onClick={() => setActiveBook(b.id)}>
                    <span className="emoji-dot book" style={{ background: b.color + '22', color: b.color }}>
                      {b.emoji}
                    </span>
                    <span className="book-card-name">
                      {b.name}
                      <em>{n} 笔记录</em>
                    </span>
                  </button>
                  {current && <span className="book-card-check">✓</span>}
                  <button
                    className="book-card-more"
                    onClick={() => setMenuId(menuId === b.id ? null : b.id)}
                    aria-label="更多操作"
                  >
                    ⋯
                  </button>
                  {menuId === b.id && (
                    <div className="acc-menu book-menu">
                      <button onClick={() => openEdit(b)}>✏️ 编辑账本</button>
                      <button className="danger" onClick={() => del(b)}>
                        🗑 删除账本
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button className="book-add btn ghost" onClick={openCreate}>
            ＋ 新建账本
          </button>
        </div>

        {formOpen && <BookFormModal editing={editing} onClose={() => setFormOpen(false)} />}
      </div>
    </>
  );
}

/** 账本新建 / 编辑表单（名称 + 图标 + 颜色） */
function BookFormModal({ editing, onClose }: { editing: Book | null; onClose: () => void }) {
  const saveBook = useStore((s) => s.saveBook);
  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🏠');
  const [color, setColor] = useState(editing?.color ?? COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    saveBook({
      id: editing?.id ?? uid(),
      name: name.trim(),
      emoji,
      color,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal title={editing ? `编辑账本：${editing.name}` : '新建账本'} onClose={onClose}>
      <div className="field">
        <span>账本名称</span>
        <div className="form-grid">
          <input
            autoFocus
            placeholder="如：日常生活"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
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
      </div>
      <div className="form-actions">
        <button className="btn ghost" onClick={onClose}>
          取消
        </button>
        <button className="btn primary" onClick={submit} disabled={!name.trim()}>
          {editing ? '保存修改' : '创建账本'}
        </button>
      </div>
    </Modal>
  );
}
