import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { addDays, startOfWeek } from '../utils';

interface MonthSwitcherProps {
  /** 锚点日期（周模式取其所在周，月/年模式取其年月/年） */
  value: Date;
  onChange: (d: Date) => void;
  mode?: 'week' | 'month' | 'year';
  label: string;
  /** 是否禁止切换到未来（用于周/月） */
  disableFuture?: boolean;
  /** 直接控制右箭头可用性（用于「全部」等无导航场景） */
  nextDisabled?: boolean;
}

export function MonthSwitcher({ value, onChange, mode = 'month', label, disableFuture = false, nextDisabled = false }: MonthSwitcherProps) {
  const now = new Date();
  const nextTooBig =
    nextDisabled ||
    (disableFuture &&
      (mode === 'week'
        ? // 周：显示的就是当前周时不能再往后
          startOfWeek(value).getTime() >= startOfWeek(now).getTime()
        : mode === 'month'
          ? value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth()
          : value.getFullYear() === now.getFullYear()));

  // 周：±7 天；月：±1 个月；年：±12 个月
  const step = (d: Date, n: number): Date =>
    mode === 'week' ? addDays(d, 7 * n) : new Date(d.getFullYear(), d.getMonth() + n * (mode === 'year' ? 12 : 1), 1);

  return (
    <div className="month-switcher">
      <button className="round-btn" onClick={() => onChange(step(value, -1))} aria-label="上一期">
        <ChevronLeftIcon size={17} />
      </button>
      <span className="month-label">{label}</span>
      <button className="round-btn" onClick={() => onChange(step(value, 1))} disabled={nextTooBig} aria-label="下一期">
        <ChevronRightIcon size={17} />
      </button>
    </div>
  );
}
