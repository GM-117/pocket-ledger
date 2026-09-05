import { useRef, useState, type ReactNode } from 'react';

interface SwipeRowProps {
  children: ReactNode;
  onDelete: () => void;
}

/** 左滑露出删除按钮（触屏 / 鼠标拖动均可）；纵向滑动时让位给页面滚动 */
export function SwipeRow({ children, onDelete }: SwipeRowProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const baseDx = useRef(0);
  const active = useRef(false);
  const moved = useRef(false);

  const down = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    baseDx.current = dx;
    active.current = true;
    moved.current = false;
    setDragging(true);
  };

  const move = (x: number, y: number) => {
    if (!active.current) return;
    const mx = x - startX.current;
    const my = y - startY.current;
    if (!moved.current && Math.abs(mx) < 6 && Math.abs(my) < 6) return;
    if (!moved.current && Math.abs(my) > Math.abs(mx)) {
      // 纵向意图 → 交给页面滚动
      active.current = false;
      setDragging(false);
      return;
    }
    moved.current = true;
    setDx(Math.max(-76, Math.min(0, baseDx.current + mx)));
  };

  const up = () => {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    setDx((cur) => (cur < -38 ? -76 : 0));
  };

  return (
    <div className="swipe-row">
      <button
        className="swipe-del"
        tabIndex={-1}
        onClick={() => {
          setDx(0);
          onDelete();
        }}
      >
        删除
      </button>
      <div
        className="swipe-content"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? 'none' : 'transform 0.18s',
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
