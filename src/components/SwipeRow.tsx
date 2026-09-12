import { useRef, useState, type ReactNode } from 'react';

interface SwipeRowProps {
  /** 是否处于左滑展开状态（受控，互斥：同一时刻只允许一行展开） */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  onDelete: () => void;
}

/** 左滑露出删除按钮（触屏 / 鼠标拖动均可）；纵向滑动时让位给页面滚动 */
export function SwipeRow({ open, onOpenChange, children, onDelete }: SwipeRowProps) {
  /** 拖动中的实时位移；null 表示未在拖动（此时位移由 open 决定，带过渡动画） */
  const [dragDx, setDragDx] = useState<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const active = useRef(false);
  const moved = useRef(false);

  const base = open ? -76 : 0;
  const dx = dragDx ?? base;

  const down = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    active.current = true;
    moved.current = false;
  };

  const move = (x: number, y: number) => {
    if (!active.current) return;
    const mx = x - startX.current;
    const my = y - startY.current;
    if (!moved.current && Math.abs(mx) < 6 && Math.abs(my) < 6) return;
    if (!moved.current && Math.abs(my) > Math.abs(mx)) {
      // 纵向意图 → 交给页面滚动
      active.current = false;
      return;
    }
    moved.current = true;
    setDragDx(Math.max(-76, Math.min(0, base + mx)));
  };

  const up = () => {
    if (!active.current) return;
    active.current = false;
    if (moved.current) onOpenChange((dragDx ?? base) < -38);
    setDragDx(null);
  };

  return (
    <div className="swipe-row">
      <button
        className={'swipe-del' + (open || dragDx !== null ? ' show' : '')}
        tabIndex={-1}
        aria-hidden={!open}
        onClick={() => {
          onOpenChange(false);
          onDelete();
        }}
      >
        删除
      </button>
      <div
        className="swipe-content"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragDx === null ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
        onPointerDown={(e) => down(e.clientX, e.clientY)}
        onPointerMove={(e) => move(e.clientX, e.clientY)}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
