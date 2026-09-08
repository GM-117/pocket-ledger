import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface MonthSwitcherProps {
  /** 锚点日期（取其年月/年） */
  value: Date;
  onChange: (d: Date) => void;
  mode?: 'month' | 'year';
  label: string;
  /** 是否禁止切换到未来（用于周/月） */
  disableFuture?: boolean;
  /** 直接控制右箭头可用性（用于「全部」等无导航场景） */
  nextDisabled?: boolean;
}

export function MonthSwitcher({ value, onChange, mode = 'month', label, disableFuture = false, nextDisabled = false }: MonthSwitcherProps) {
  const step = mode === 'month' ? 1 : 12;
  const now = new Date();
  const nextTooBig =
    nextDisabled ||
    (disableFuture &&
      (mode === 'month'
        ? value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth()
        : value.getFullYear() === now.getFullYear()));

  return (
    <div className="month-switcher">
      <button className="round-btn" onClick={() => onChange(stepBack(value, step))} aria-label="上一期">
        <ChevronLeftIcon size={17} />
      </button>
      <span className="month-label">{label}</span>
      <button className="round-btn" onClick={() => onChange(stepFwd(value, step))} disabled={nextTooBig} aria-label="下一期">
        <ChevronRightIcon size={17} />
      </button>
    </div>
  );
}

function stepBack(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() - n, 1);
}

function stepFwd(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
