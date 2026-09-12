import { useEffect, useState } from 'react';
import { BOOK_EMOJIS, useStore } from '../store';
import type { Book } from '../types';
import { lockBodyScroll, uid, unlockBodyScroll } from '../utils';
import { Modal } from './Modal';
import { CheckIcon, ChevronLeftIcon, LIcon, NotebookIcon, PencilIcon, TrashIcon } from './icons';

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
    if (books.length <= 1) {
      window.alert('至少保留一个账本，可先创建新账本再删除');
      return;
    }
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
            <ChevronLeftIcon size={17} /> 返回
          </button>
          <span className="page-title">我的账本</span>
          <button className="page-action" onClick={openCreate} aria-label="新建账本">
            ＋
          </button>
        </div>

        <div className="page-body">
          {/* ⋯ 菜单打开时铺透明遮罩：点击任意其他位置即收起（与账户详情「更多」一致） */}
          {menuId && <div className="pop-mask" onClick={() => setMenuId(null)} />}
          {books.length === 0 && (
            <div className="empty">
              <span className="empty-emoji"><NotebookIcon size={44} /></span>
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
                      <LIcon emoji={b.emoji} size={22} />
                    </span>
                    <span className="book-card-name">
                      {b.name}
                      <em>{n} 笔记录</em>
                    </span>
                  </button>
                  {current && (
                    <span className="book-card-check">
                      <CheckIcon size={12} />
                    </span>
                  )}
                  <button
                    className="book-card-more"
                    onClick={() => setMenuId(menuId === b.id ? null : b.id)}
                    aria-label="更多操作"
                  >
                    ⋯
                  </button>
                  {menuId === b.id && (
                    <div className="acc-menu book-menu">
                      <button onClick={() => openEdit(b)}>
                        <PencilIcon size={15} /> 编辑账本
                      </button>
                      <button className="danger" onClick={() => del(b)}>
                        <TrashIcon size={15} /> 删除账本
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
            <button
              key={e}
              className={'emoji-pick' + (emoji === e ? ' active' : '')}
              onClick={() => setEmoji(e)}
              aria-label={`图标 ${e}`}
            >
              <LIcon emoji={e} size={19} />
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
