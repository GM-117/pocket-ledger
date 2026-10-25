import type { ReactNode } from 'react';
import type { ThemeId } from '../theme';

interface IconProps {
  size?: number;
  className?: string;
}

/** 统一线性图标基座：24 网格、currentColor 描边，随上下文着色 */
function base(size: number, sw: number, children: ReactNode, className?: string) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function make(paths: ReactNode, sw = 1.8, defaultSize = 22) {
  return function Icon({ size = defaultSize, className }: IconProps) {
    return base(size, sw, paths, className);
  };
}

/** 填充式图标基座：品牌 logo 用，fill=currentColor，随上下文着色 */
function fillMake(paths: ReactNode, defaultSize = 22) {
  return function Icon({ size = defaultSize, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        className={className}
        aria-hidden="true"
        focusable="false"
      >
        {paths}
      </svg>
    );
  };
}

/* ============ 品牌 ============ */

/** 品牌标:钱包（1024 网格源图，按 24/1024 缩放）。颜色由 currentColor 决定，与 favicon / PWA 图标同源 */
export const BrandIcon = fillMake(
  <g transform="scale(0.0234375)">
    <path d="M787.584 164.138667a85.333333 85.333333 0 0 1 1.493333 15.936v13.653333A128.042667 128.042667 0 0 1 896 320v88.021333c36.821333 9.493333 64 42.88 64 82.645334v149.333333a85.376 85.376 0 0 1-64 82.645333V810.666667a128 128 0 0 1-128 128H192a128 128 0 0 1-128-128V320a128 128 0 0 1 127.744-128v-1.429333L687.829333 96.213333a85.333333 85.333333 0 0 1 99.776 67.904zM768 256H192a64 64 0 0 0-63.893333 60.245333L128 320v490.666667a64 64 0 0 0 60.245333 63.893333L192 874.666667h576a64 64 0 0 0 63.893333-60.245334L832 810.666667v-85.333334h-181.333333a160 160 0 0 1 0-320H832v-85.333333a64 64 0 0 0-60.245333-63.893333L768 256z m106.666667 213.333333H650.666667a96 96 0 0 0-4.522667 191.893334L650.666667 661.333333H874.666667a21.333333 21.333333 0 0 0 21.184-18.837333L896 640v-149.333333a21.333333 21.333333 0 0 0-18.837333-21.184L874.666667 469.333333z m-224 64a32 32 0 1 1 0 64 32 32 0 0 1 0-64z m51.584-374.549333l-2.474667 0.341333-172.949333 32.853334h198.229333v-12.906667l-0.341333-2.986667a21.333333 21.333333 0 0 0-22.464-17.28z" />
  </g>,
);

/* ============ 导航 / 框架 ============ */

export const BookIcon = make(
  <>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M9 7h7" />
  </>,
);

export const WalletIcon = make(
  <>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </>,
);

export const ChartIcon = make(
  <>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 15v-4" />
    <path d="M12 15V7" />
    <path d="M17 15v-6" />
  </>,
);

export const CalendarIcon = make(
  <>
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <path d="M8 15h.01" />
    <path d="M12 15h.01" />
    <path d="M16 15h.01" />
  </>,
);

export function PlusIcon({ size = 24, className }: IconProps) {
  return base(
    size,
    2.2,
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>,
    className,
  );
}

/* ============ UI 操作 ============ */

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
);

export const RepeatIcon = make(
  <>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </>,
);

export const FunnelIcon = make(
  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
);

export const SwapIcon = make(
  <>
    <path d="M8 3 4 7l4 4" />
    <path d="M4 7h16" />
    <path d="m16 21 4-4-4-4" />
    <path d="M20 17H4" />
  </>,
);

export const TargetIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </>,
);

export const TrashIcon = make(
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>,
);

export const PencilIcon = make(
  <>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </>,
);

export const CloseIcon = make(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
  2,
);

export const CheckIcon = make(<polyline points="20 6 9 17 4 12" />, 2.4);

export const ChevronLeftIcon = make(<path d="m15 18-6-6 6-6" />, 2);
export const ChevronRightIcon = make(<path d="m9 18 6-6-6-6" />, 2);
export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />, 2);

export const SunIcon = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>,
);

export const MoonIcon = make(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);

export const EyeIcon = make(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const EyeOffIcon = make(
  <>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </>,
);

export const DownloadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <path d="M12 15V3" />
  </>,
);

export const UploadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <path d="M12 3v12" />
  </>,
);

export const CameraIcon = make(
  <>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3.2" />
  </>,
);

export const RotateCcwIcon = make(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>,
);

export const StarIcon = make(
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
);

export const ZapIcon = make(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />);

export const CartIcon = make(
  <>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </>,
);

export const BackspaceIcon = make(
  <>
    <path d="M20 5H9L2 12l7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
    <path d="m18 9-6 6" />
    <path d="m12 9 6 6" />
  </>,
);

export const ArrowDownIcon = make(
  <>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </>,
  2,
);

export const ArrowUpIcon = make(
  <>
    <path d="M12 5v14" />
    <path d="m5 12 7-7 7 7" />
  </>,
  2,
);

/* ============ 数据语义图标（分类 / 账本 / 账户 / 状态） ============ */

export const HomeIcon = make(
  <>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </>,
);

export const BriefcaseIcon = make(
  <>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </>,
);

export const PlaneIcon = make(
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
);

export const GradCapIcon = make(
  <>
    <path d="M22 9 12 4 2 9l10 5 10-5Z" />
    <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    <path d="M22 9v5" />
  </>,
);

export const GiftIcon = make(
  <>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </>,
);

export const CarIcon = make(
  <>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </>,
);

export const BabyIcon = make(
  <>
    <path d="M9 12h.01" />
    <path d="M15 12h.01" />
    <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
    <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
  </>,
);

export const EnvelopeIcon = make(
  <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>,
);

export const NotebookIcon = make(
  <>
    <path d="M2 6h4" />
    <path d="M2 10h4" />
    <path d="M2 14h4" />
    <path d="M2 18h4" />
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M9 7h6" />
  </>,
);

export const UtensilsIcon = make(
  <>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </>,
);

export const SubwayIcon = make(
  <>
    <rect x="5" y="2.5" width="14" height="15" rx="3" />
    <path d="M5 9.5h14" />
    <path d="M9 13.5h.01" />
    <path d="M15 13.5h.01" />
    <path d="m9 17.5-2 4" />
    <path d="m15 17.5 2 4" />
  </>,
);

export const BusIcon = make(
  <>
    <rect x="4" y="3" width="16" height="15" rx="2.5" />
    <path d="M4 10h16" />
    <path d="M8 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 21v-3" />
    <path d="M16 21v-3" />
  </>,
);

export const ShoppingBagIcon = make(
  <>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </>,
);

export const GamepadIcon = make(
  <>
    <path d="M6 11h4" />
    <path d="M8 9v4" />
    <path d="M15 12h.01" />
    <path d="M18 10h.01" />
    <path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.62 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.54-.62-6.58-.68-7.26A4 4 0 0 0 17.32 5Z" />
  </>,
);

export const PillIcon = make(
  <>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </>,
);

export const SmartphoneIcon = make(
  <>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </>,
);

export const CoffeeIcon = make(
  <>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <path d="M6 2v2" />
    <path d="M10 2v2" />
    <path d="M14 2v2" />
  </>,
);

export const ClapperIcon = make(
  <>
    <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
    <path d="m6.2 5.3 3.1 3.9" />
    <path d="m12.4 3.4 3.1 4" />
    <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </>,
);

export const BookOpenIcon = make(
  <>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>,
);

export const PawIcon = make(
  <>
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="20" cy="16" r="2" />
    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
  </>,
);

export const BulbIcon = make(
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>,
);

export const CoinsIcon = make(
  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </>,
);

export const CoinIcon = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5v9" />
    <path d="M9.5 10c0-.9 1.1-1.4 2.5-1.4s2.5.5 2.5 1.4-1 1.2-2.5 1.4-2.5.5-2.5 1.4 1.1 1.4 2.5 1.4 2.5-.5 2.5-1.4" />
  </>,
);

export const TrendingUpIcon = make(
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>,
);

export const BarChartIcon = make(
  <>
    <path d="M12 20v-10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </>,
);

export const BanknoteIcon = make(
  <>
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01" />
    <path d="M18 12h.01" />
  </>,
);

export const BankIcon = make(
  <>
    <path d="M3 22h18" />
    <path d="M6 18v-7" />
    <path d="M10 18v-7" />
    <path d="M14 18v-7" />
    <path d="M18 18v-7" />
    <polygon points="12 2 20 7 4 7" />
  </>,
);

export const CreditCardIcon = make(
  <>
    <rect width="22" height="16" x="1" y="4" rx="2" />
    <path d="M1 10h22" />
  </>,
);

export const PiggyIcon = make(
  <>
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5Z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <path d="M16 11h.01" />
  </>,
);

export const RiceIcon = make(
  <>
    <path d="M4 12h16a8 8 0 0 1-16 0Z" />
    <path d="m14.5 8 5-6" />
    <path d="m18 9.5 4-5" />
  </>,
);

export const CrownIcon = make(
  <>
    <path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.27-3.67a.5.5 0 0 1 .8.52l-2.83 10.24a1 1 0 0 1-.96.74H5.81a1 1 0 0 1-.96-.74L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.29Z" />
    <path d="M5 21h14" />
  </>,
);

export const FuelIcon = make(
  <>
    <path d="M3 22h12" />
    <path d="M4 9h10" />
    <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
  </>,
);

export const LockIcon = make(
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
);

export const AppleIcon = make(
  <>
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
    <path d="M10 2c1 .5 2 2 2 5" />
  </>,
);

export const ShieldIcon = make(
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
);

export const OilIcon = make(
  <>
    <ellipse cx="12" cy="5" rx="7" ry="2.5" />
    <path d="M5 5v14c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5" />
    <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </>,
);

export const BitcoinIcon = make(
  <>
    <path d="M9.5 5H15a3 3 0 1 1 0 6H9.5Z" />
    <path d="M9.5 11H16a3 3 0 1 1 0 6H9.5Z" />
    <path d="M9.5 5v12" />
    <path d="M12 3v2" />
    <path d="M12 19v2" />
    <path d="M7 5h2.5" />
    <path d="M7 19h2.5" />
  </>,
);

export const HandshakeIcon = make(
  <>
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
    <path d="m21 3 1 11h-2" />
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
    <path d="M3 4h8" />
  </>,
);

export const HeartHandshakeIcon = make(
  <>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
    <path d="m18 15-2-2" />
    <path d="m15 18-2-2" />
  </>,
);

export const FileTextIcon = make(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </>,
);

export const GearIcon = make(
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const QuestionIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </>,
);

export const PackageIcon = make(
  <>
    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
    <path d="M12 22V12" />
    <path d="m3.3 7 7.7 4.73a2 2 0 0 0 2 0L20.7 7" />
    <path d="m7.5 4.27 9 5.15" />
  </>,
);

export const InboxIcon = make(
  <>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </>,
);

/* ============ 品牌 logo（单色填充，由 icon-circle 的 color 着色） ============ */

export const AlipayLogo = fillMake(
  <path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809" />,
);

export const WechatLogo = fillMake(
  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />,
);

export const MeituanLogo = fillMake(
  <path d="M6.923 0c-2.408 0-3.28.25-4.16.721A4.906 4.907 0 0 0 .722 2.763C.25 3.643 0 4.516 0 6.923v10.154c0 2.407.25 3.28.72 4.16a4.905 4.906 0 0 0 2.042 2.042c.88.47 1.752.721 4.16.721h10.156c2.407 0 3.28-.25 4.16-.721a4.906 4.907 0 0 0 2.04-2.042c.471-.88.722-1.753.722-4.16V6.923c0-2.407-.25-3.28-.722-4.16A4.906 4.907 0 0 0 21.238.72C20.357.251 19.484 0 17.077 0ZM4.17 7.51h1.084c.04.24.07.488.11.737h3.47c.05-.25.08-.497.1-.736h1.105a9.849 9.85 0 0 1-.09.736h1.562v.866H7.62v.696h3.642v.855h-3.64v.667h3.64v.854h-3.64v.816h3.89v.865H7.88c.775.935 2.218 1.532 3.78 1.651l-.538.936c-1.442-.17-3.103-.846-4.028-2.04-.856 1.194-2.487 1.92-4.525 2.07l.318-1.005c1.382-.02 2.814-.736 3.431-1.612h-3.62v-.865h3.86v-.816h-3.64v-.854h3.64v-.667h-3.64v-.855h3.64v-.697H2.7v-.866h1.56zm8.603.182h7.976c.358 0 .567.198.567.547v8.146H13.33c-.358 0-.557-.199-.557-.547zm1.044.885V15.5h6.455V8.577Zm3.999.476h1.024v.756h.975v.835h-.975V13c0 .806-.1 1.402-.318 2.02h-1.113c.338-.717.408-1.224.408-1.99v-2.387h-.935c-.14 1.541-.736 3.451-1.363 4.376h-1.134c.607-.855 1.303-2.526 1.472-4.376h-1.512v-.835h3.472z" />,
);

export const QqLogo = fillMake(
  <path d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673" />,
);

/** 抖音与 TikTok 为同一音符标 */
export const DouyinLogo = fillMake(
  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />,
);

export const PaypalLogo = fillMake(
  <path d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z" />,
);

export const LineLogo = fillMake(
  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />,
);

/** 京东无公开矢量标，此处为 "JD" 字样（D 用 evenodd 挖空内孔） */
export const JdLogo = fillMake(
  <>
    <path d="M8.6 3.5h2.9v9.4c0 3.2-2 5.1-5 5.1-.75 0-1.5-.13-2.1-.36l.6-2.6c.4.16.85.26 1.25.26 1.3 0 2.35-.9 2.35-2.55V3.5z" />
    <path
      fillRule="evenodd"
      d="M14 3.5h3c3.4 0 5.5 2.6 5.5 7.25S20.4 18 17 18h-3V3.5zm2.7 2.8v8.9h.35c1.6 0 2.6-1.5 2.6-4.45S18.65 6.3 17.05 6.3h-.35z"
    />
  </>,
);

/* ---- 同系账户差异化语义图标（线性风，替代复用的品牌 logo） ---- */

/** 余额宝：钱袋 + ¥ */
export const YuebaoIcon = make(
  <>
    <path d="M9.2 7.2c0-1.6 1.2-2.7 2.8-2.7s2.8 1.1 2.8 2.7" />
    <path d="M7.6 7.2h8.8l1.6 2.8c.9 1.6 1.5 3.3 1.5 5a7.5 7.5 0 1 1-15 0c0-1.7.6-3.4 1.5-5z" />
    <path d="m9.8 12 2.2 2.4 2.2-2.4" />
    <path d="M12 14.4V18" />
    <path d="M10.2 15.6h3.6M10.2 17.1h3.6" />
  </>,
);

/** 余利宝：金币堆 + 上升箭头 */
export const YulibaoIcon = make(
  <>
    <ellipse cx="9.5" cy="6.8" rx="5.2" ry="2.3" />
    <path d="M4.3 6.8v3.6c0 1.3 2.3 2.3 5.2 2.3s5.2-1 5.2-2.3V6.8" />
    <path d="M4.3 10.4V14c0 1.3 2.3 2.3 5.2 2.3 1 0 1.9-.1 2.7-.3" />
    <path d="m14.5 16.5 5-5" />
    <path d="M15 11.5h4.5V16" />
  </>,
);

/** 小荷包：束口荷包 + 爱心 */
export const XiaohebaoIcon = make(
  <>
    <path d="M9 3.5 12 7l3-3.5" />
    <path d="M7 7c-1.6 1.7-2.6 3.7-2.6 6a7.6 7.6 0 0 0 15.2 0c0-2.3-1-4.3-2.6-6z" />
    <path d="M7 7c1.6 1 3.2 1.4 5 1.4s3.4-.4 5-1.4" />
    <path d="M12 17.2c-1.7-1.1-2.7-2.2-2.7-3.4 0-.8.6-1.4 1.3-1.4.5 0 .9.2 1.4.8.5-.6.9-.8 1.4-.8.7 0 1.3.6 1.3 1.4 0 1.2-1 2.3-2.7 3.4z" />
  </>,
);

/** 蚂蚁财富：圆圈 + 净值曲线 */
export const AntFortuneIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m6.5 15.5 3-3.2 2.5 2.2 4.5-5" />
    <path d="M13.5 9.5h3v3" />
  </>,
);

/** 微信零钱通：¥ 硬币 + 零钱 */
export const WechatChangeIcon = make(
  <>
    <circle cx="10" cy="11.5" r="6.8" />
    <path d="m7.6 9 2.4 2.6L12.4 9" />
    <path d="M10 11.6V15" />
    <path d="M8.2 12.8h3.6M8.2 14.2h3.6" />
    <path d="M15.9 15.3a3.8 3.8 0 1 0 .5 4" />
  </>,
);

/** 微粒贷：钞票 + 微粒 */
export const WeilidaiIcon = make(
  <>
    <rect x="2.5" y="9.5" width="15.5" height="9.5" rx="2" />
    <circle cx="10.2" cy="14.2" r="2.1" />
    <path d="M5.5 12.2h.01M15 16.2h.01" />
    <circle cx="19" cy="4.8" r="1" />
    <circle cx="21.2" cy="7.6" r="0.7" />
    <circle cx="16.6" cy="3.4" r="0.7" />
  </>,
);

/** 微信分付：分期饼图 */
export const WechatFenfuIcon = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 12V3.5" />
    <path d="m12 12 7.4-4.3" />
    <path d="m12 12-2.8 8" />
  </>,
);

/** 京东白条：欠条票据（锯齿边） */
export const JdBaitiaoIcon = make(
  <>
    <path d="M6.5 3h8L18 6.5V21l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6.5 21z" />
    <path d="M9.5 8.5h5.5M9.5 12h5.5M9.5 15.5h3.5" />
  </>,
);

/** 京东金条：金条堆 */
export const JdJintiaoIcon = make(
  <>
    <path d="m4 17.5 1.6-4.5h5.2l1.6 4.5z" />
    <path d="m11.6 17.5 1.6-4.5h5.2l1.6 4.5z" />
    <path d="m7.8 9 1.6-4.5h5.2L16.2 9z" />
  </>,
);

/** 京东小金库：保险箱 */
export const JdXjkIcon = make(
  <>
    <rect x="3.5" y="4.5" width="17" height="14.5" rx="2.5" />
    <circle cx="12" cy="11.7" r="3.1" />
    <path d="M12 8.6V7.6M12 15.8v-1M8.9 11.7h-1M16.1 11.7h-1" />
    <path d="M7 19v2M17 19v2" />
  </>,
);

/** 美团借钱：手托 ¥ 币 */
export const MtJieqianIcon = make(
  <>
    <circle cx="12" cy="7.5" r="4" />
    <path d="m10 5.7 2 2.2 2-2.2" />
    <path d="M12 7.9v3M10.3 9.4h3.4" />
    <path d="M3.5 15.8c1.8 0 2.8.5 4.2 1.4s2.6 1.3 4.3 1.3h6" />
    <path d="M3.5 15.8v3.2" />
  </>,
);

/** 美团月付：日历 + ¥ */
export const MtYuefuIcon = make(
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.8h17M8.5 3v3.5M15.5 3v3.5" />
    <path d="m9.4 13 2.6 2.6 2.6-2.6" />
    <path d="M12 15.6v2.4M10.3 16.8h3.4" />
  </>,
);

/** 抖音放心借：盾牌 + 对勾 */
export const DyFxjIcon = make(
  <>
    <path d="M12 2.8 19.5 5.6v5.9c0 5-3.2 8.3-7.5 9.7-4.3-1.4-7.5-4.7-7.5-9.7V5.6z" />
    <path d="m8.8 11.6 2.2 2.2 4.2-4.4" />
  </>,
);

/** 抖音月付：卡片 + 月牙 */
export const DyYuefuIcon = make(
  <>
    <rect x="2.5" y="5.5" width="19" height="13.5" rx="2.5" />
    <path d="M2.5 9.7h19" />
    <path d="M15.6 16.4a2.8 2.8 0 1 1 1.9-3.5 2.2 2.2 0 0 0-1.9 3.5z" />
  </>,
);

/** 京东超市卡：商店 */
export const JdMarketCardIcon = make(
  <>
    <path d="M4.5 9 5.6 4.5h12.8L19.5 9" />
    <path d="M4.5 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
    <path d="M6 11.4V20h12v-8.6" />
    <path d="M9.6 20v-4.6h4.8V20" />
  </>,
);

/** 京东 E 卡：卡片 + 星 */
export const JdEcardIcon = make(
  <>
    <rect x="2.5" y="5.5" width="19" height="13.5" rx="2.5" />
    <path d="M2.5 9.7h19" />
    <path d="m15.4 12.4.7 1.4 1.5.2-1.1 1.1.3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1.1 1.5-.2z" />
  </>,
);

/** 八达通：NFC 感应卡 */
export const OctopusIcon = make(
  <>
    <rect x="2.5" y="5.5" width="19" height="13.5" rx="2.5" />
    <path d="M8.2 10.2a3.2 3.2 0 0 1 0 4.6" />
    <path d="M10.8 8.8a6 6 0 0 1 0 7.4" />
    <path d="M13.4 7.5a8.6 8.6 0 0 1 0 10" />
  </>,
);

/** 其他充值卡：票券 */
export const PrepaidTicketIcon = make(
  <>
    <path d="M3 9.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5z" />
    <path d="M13.5 5v2.2M13.5 11v2M13.5 16.8V19" />
  </>,
);

/** ICOCA：芯片卡 */
export const IcocaIcon = make(
  <>
    <rect x="2.5" y="5.5" width="19" height="13.5" rx="2.5" />
    <rect x="5.5" y="9.5" width="5" height="4.5" rx="1" />
    <path d="M5.5 11.7h5M8 9.5V14" />
  </>,
);

/** Tmoney：T 地铁标 */
export const TmoneyIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 9.3h7" />
    <path d="M12 9.3v7" />
  </>,
);

/** 蚂蚁花呗：花朵（"花"呗） */
export const HuabeiIcon = make(
  <>
    <circle cx="12" cy="5.6" r="2.1" />
    <circle cx="8.3" cy="9.6" r="2.1" />
    <circle cx="15.7" cy="9.6" r="2.1" />
    <circle cx="12" cy="9" r="1.7" />
    <path d="M12 11.4V21" />
    <path d="M12 17.5c-1.8 0-3-.9-3.5-2.2M12 15.3c1.8 0 3-.9 3.5-2.2" />
  </>,
);

/** 蚂蚁借呗：箭头入钱包（借入） */
export const JiebeiIcon = make(
  <>
    <path d="M12 2.5V9" />
    <path d="m9.2 6.7 2.8 2.8 2.8-2.8" />
    <path d="M4 11.5h16V19a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19z" />
    <path d="M4 11.5 6 8.8M20 11.5 18 8.8" />
    <path d="M15.5 16h.01" />
  </>,
);

/** PASMO：圆角方块 + P */
export const PasmoIcon = make(
  <>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <path d="M9.5 16.5v-9h3.2a2.6 2.6 0 0 1 0 5.2H9.5" />
  </>,
);

/* ============ emoji → SVG 映射 ============ */

type IconCmp = (p: IconProps) => ReactNode;

/**
 * 数据层（分类 / 账本 / 账户）持久化的 emoji 字段 → 线性图标。
 * key 已去除 FE0F 变体选择符；未命中的值回退为原文本渲染（兼容用户老数据与导入数据）。
 */
const EMOJI_ICON_MAP: Record<string, IconCmp> = {
  // 账本
  '🏠': HomeIcon,
  '💼': BriefcaseIcon,
  '✈': PlaneIcon,
  '🎓': GradCapIcon,
  '🎁': GiftIcon,
  '🚗': CarIcon,
  '👶': BabyIcon,
  '💌': EnvelopeIcon,
  '📒': NotebookIcon,
  // 分类
  '🍜': UtensilsIcon,
  '🚇': SubwayIcon,
  '🛍': ShoppingBagIcon,
  '🎮': GamepadIcon,
  '💊': PillIcon,
  '📱': SmartphoneIcon,
  '☕': CoffeeIcon,
  '🎬': ClapperIcon,
  '📚': BookOpenIcon,
  '🐶': PawIcon,
  '💡': BulbIcon,
  '💰': CoinsIcon,
  '📈': TrendingUpIcon,
  '🧧': EnvelopeIcon,
  '💸': BanknoteIcon,
  '🪙': CoinIcon,
  '📦': PackageIcon,
  // 账户
  '💵': BanknoteIcon,
  '🏦': BankIcon,
  '💳': CreditCardIcon,
  '🐷': PiggyIcon,
  '🧾': FileTextIcon,
  '👛': WalletIcon,
  '🚌': BusIcon,
  '🍚': RiceIcon,
  '👑': CrownIcon,
  '⛽': FuelIcon,
  '🔒': LockIcon,
  '🍎': AppleIcon,
  '📊': BarChartIcon,
  '🛡': ShieldIcon,
  '🛢': OilIcon,
  '🤝': HandshakeIcon,
  '🙏': HeartHandshakeIcon,
  '₿': BitcoinIcon,
  // 流水类型 / 状态
  '🔁': SwapIcon,
  '⚙': GearIcon,
  '❓': QuestionIcon,
  '📝': FileTextIcon,
  '📅': CalendarIcon,
  // 空状态 / 杂项
  '🪹': InboxIcon,
  '🎯': TargetIcon,
  '⭐': StarIcon,
  '⚡': ZapIcon,
  '🛒': CartIcon,
  '✏': PencilIcon,
  '🗑': TrashIcon,
  '🔍': SearchIcon,
  '☀': SunIcon,
  '🌙': MoonIcon,
  '👁': EyeIcon,
  '🙈': EyeOffIcon,
  '♻': RotateCcwIcon,
};

/** 去掉 emoji 的 FE0F 变体选择符，统一映射 key */
export function normEmoji(s: string): string {
  return s.replace(/\uFE0F/g, '');
}

/**
 * 账户子类型 id → 图标。品牌账户给对应品牌 logo，其余给语义图标。
 * 品牌 logo 走 fillMake（单色填充），语义图标沿用线性风。
 */
const ACCOUNT_ICON_MAP: Record<string, IconCmp> = {
  // 资金账户
  alipay: AlipayLogo,
  yuebao: YuebaoIcon,
  yulibao: YulibaoIcon,
  xiaohebao: XiaohebaoIcon,
  ant_fortune: AntFortuneIcon,
  wechat: WechatLogo,
  wechat_change: WechatChangeIcon,
  tenpay: TrendingUpIcon,
  qq: QqLogo,
  douyin: DouyinLogo,
  eleme: UtensilsIcon,
  fliggy: PlaneIcon,
  macau_wallet: WalletIcon,
  dcep: CoinIcon,
  jd_finance: JdLogo,
  jd_xjk: JdXjkIcon,
  unionpay: ZapIcon,
  line_pay: LineLogo,
  paypay: BanknoteIcon,
  paypal: PaypalLogo,
  payme: BanknoteIcon,
  paga: BanknoteIcon,
  chipper: BanknoteIcon,
  youtrip: CreditCardIcon,
  tng: WalletIcon,
  usetimon: WalletIcon,
  gjj: HomeIcon,
  yibao: ShieldIcon,
  pension: PiggyIcon,
  passbook: NotebookIcon,
  other_asset: PackageIcon,
  // 信用账户
  loan: BankIcon,
  huabei: HuabeiIcon,
  jd_baitiao: JdBaitiaoIcon,
  jd_jintiao: JdJintiaoIcon,
  jiebei: JiebeiIcon,
  weilidai: WeilidaiIcon,
  mt_jieqian: MtJieqianIcon,
  mt_yuefu: MtYuefuIcon,
  dy_fxj: DyFxjIcon,
  dy_yuefu: DyYuefuIcon,
  wechat_fenfu: WechatFenfuIcon,
  beiyongjin: ZapIcon,
  family: HeartHandshakeIcon,
  other_credit: QuestionIcon,
  // 充值账户
  octopus: OctopusIcon,
  macau_pass: BusIcon,
  suica: SubwayIcon,
  icoca: IcocaIcon,
  pasmo: PasmoIcon,
  wowpass: CreditCardIcon,
  tmoney: TmoneyIcon,
  tmall_card: CartIcon,
  jd_market_card: JdMarketCardIcon,
  jd_ecard: JdEcardIcon,
  other_prepaid: PrepaidTicketIcon,
  // 理财账户
  other_invest: CoinsIcon,
};

interface LIconProps {
  /** 数据层存的 emoji，或账户子类型 id（如 alipay / wechat / jd_baitiao） */
  emoji?: string | null;
  size?: number;
  className?: string;
}

/**
 * 统一图标渲染：账户子类型 / emoji 命中映射 → SVG（currentColor 着色）；
 * 未命中 → 原文本渲染（用户自定义 emoji 与导入数据的优雅降级）。
 */
export function LIcon({ emoji, size = 18, className }: LIconProps) {
  const key = emoji ? normEmoji(emoji) : '';
  const Cmp = ACCOUNT_ICON_MAP[key] ?? EMOJI_ICON_MAP[key];
  if (Cmp) return <Cmp size={size} className={className} />;
  if (key) {
    return (
      <span
        className={className}
        style={{ fontSize: Math.round(size * 0.86), lineHeight: 1, fontWeight: 800 }}
      >
        {key}
      </span>
    );
  }
  return <QuestionIcon size={size} className={className} />;
}

/* ============ 底栏 Tab 主题图标（风格主题专用） ============ */
/* 贴纸风：面（固定色填充）+ 线（描边）分层，不参与 currentColor 着色，
   仅用于 Layout 的 tabbar / sidebar；GuideOverlay 等功能场景沿用基础图标。
   选中/未选中态由 CSS（.ticon）控制：未选中压灰去彩，选中还原彩色。
   注意：styles.css 的全局描边覆盖规则已用 :not(.ticon) 豁免本组图标。 */

/** 贴纸风图标基座：不带根级 stroke/fill，颜色全部落在各 path 上 */
function sticker(children: ReactNode, defaultSize = 22) {
  return function StickerIcon({ size = defaultSize, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `ticon ${className}` : 'ticon'}
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    );
  };
}

const CANDY = {
  line: '#c94470',
  pink: '#ff7096',
  soft: '#ffd9e5',
  cream: '#fff4f8',
  yellow: '#ffc24b',
  blue: '#4cc9f0',
  purple: '#9d6bff',
  caramel: '#cf9a5f',
};
const SAKURA = {
  line: '#a8558b',
  pink: '#f4a4c6',
  soft: '#fad5e5',
  deep: '#d97fb8',
  gold: '#ffd36e',
  goldDeep: '#f0b64c',
};
const JOURNAL = {
  line: '#7a5a3a',
  kraft: '#e9cd9c',
  cream: '#f8efd9',
  red: '#c25b4e',
  green: '#9db27c',
  tan: '#d9b48a',
};

/* ---- 糖果卡通：棒棒糖 / 花糖 / 冰棍 / 甜甜圈 ---- */

export const CandyLollipopIcon = sticker(
  <>
    <path d="M12 15v6.4" stroke={CANDY.caramel} strokeWidth={2.6} />
    <defs>
      <clipPath id="ticon-pop">
        <circle cx="12" cy="9.6" r="6.7" />
      </clipPath>
    </defs>
    <circle cx="12" cy="9.6" r="7" fill={CANDY.cream} />
    <g clipPath="url(#ticon-pop)">
      <path d="M12 9.6 12 2.4 A7.2 7.2 0 0 1 19.2 9.6 Z" fill={CANDY.pink} />
      <path d="M12 9.6 12 16.8 A7.2 7.2 0 0 1 4.8 9.6 Z" fill={CANDY.pink} />
    </g>
    <circle cx="12" cy="9.6" r="7" fill="none" stroke={CANDY.line} strokeWidth={1.9} />
    <path d="M7.4 7a5.2 5.2 0 0 1 2.4-2.3" stroke="#ffffff" strokeWidth={1.5} />
  </>,
);

export const CandySweetIcon = sticker(
  <>
    <path
      d="M7.6 11.2 3.4 8c-.9 2.6-.9 5.4 0 8l4.2-3.2z"
      fill={CANDY.yellow}
      stroke={CANDY.line}
      strokeWidth={1.8}
    />
    <path
      d="M16.4 11.2 20.6 8c.9 2.6.9 5.4 0 8l-4.2-3.2z"
      fill={CANDY.yellow}
      stroke={CANDY.line}
      strokeWidth={1.8}
    />
    <ellipse cx="12" cy="12" rx="4.9" ry="4.1" fill={CANDY.pink} stroke={CANDY.line} strokeWidth={1.9} />
    <path d="M12.8 8.6a4.5 3.6 0 0 1 0 6.8" stroke="#ff9db8" strokeWidth={1.3} fill="none" />
    <path d="M9 10.2a3.6 3.6 0 0 1 2.5-1.8" stroke="#ffffff" strokeWidth={1.5} fill="none" />
  </>,
);

export const CandyPopsicleIcon = sticker(
  <>
    <rect x="10.7" y="15.4" width="2.6" height="5.6" rx="1.3" fill={CANDY.caramel} stroke={CANDY.line} strokeWidth={1.5} />
    <defs>
      <clipPath id="ticon-ice">
        <rect x="8" y="3.2" width="8" height="13.2" rx="4" />
      </clipPath>
    </defs>
    <g clipPath="url(#ticon-ice)">
      <rect x="8" y="3.2" width="8" height="13.2" fill={CANDY.soft} />
      <path d="M8 3.2h8V9c-1.3 1.2-2.7-1.2-4 0s-2.7 1.2-4 0z" fill={CANDY.pink} />
      <path d="M10 5.4l1.2.7M13.4 6.2l1.2-.7" stroke="#ffffff" strokeWidth={1.2} />
    </g>
    <rect x="8" y="3.2" width="8" height="13.2" rx="4" fill="none" stroke={CANDY.line} strokeWidth={1.9} />
  </>,
);

export const CandyDonutIcon = sticker(
  <>
    <defs>
      <clipPath id="ticon-donut">
        <circle cx="12" cy="12" r="7.7" />
      </clipPath>
    </defs>
    <circle cx="12" cy="12" r="8" fill="#f2b266" />
    <g clipPath="url(#ticon-donut)">
      <path
        d="M4 12a8 8 0 0 1 16 0c-.6 1.2-1.7 1-2.3 1.9-.6.8-1.7.8-2.3 0-.7-.8-1.9-.7-2.5.2-.6.8-1.8.7-2.4-.2-.6-.8-1.4-.5-2-1.3-.4-.6-1.4-.4-2-1.2-.8.5-2 .2-2.5.6z"
        fill={CANDY.pink}
      />
      <path d="M7.6 7l1.5.8" stroke={CANDY.blue} strokeWidth={1.4} />
      <path d="M12.4 5.2l.6 1.6" stroke="#ffffff" strokeWidth={1.4} />
      <path d="M15.9 7.2l-1.3 1" stroke={CANDY.purple} strokeWidth={1.4} />
      <path d="M9 9.9l1.5-.5" stroke={CANDY.yellow} strokeWidth={1.4} />
    </g>
    <circle cx="12" cy="12" r="8" fill="none" stroke={CANDY.line} strokeWidth={1.9} />
    <circle cx="12" cy="12" r="3" fill={CANDY.cream} stroke={CANDY.line} strokeWidth={1.7} />
  </>,
);

/* ---- 樱花少女：五瓣樱 / 爱心 / 蝴蝶结 / 星芒 ---- */

const SAKURA_PETAL =
  'M12 11.2c-1.8-1.3-2.7-3.2-2.1-5.1.2-.8.7-1.5 1.4-1.9l.7.8.7-.8c.7.4 1.2 1.1 1.4 1.9.6 1.9-.3 3.8-2.1 5.1z';
const SAKURA_STAMEN_DEGS = [36, 108, 180, 252, 324];

export const SakuraBlossomIcon = sticker(
  <>
    {[0, 72, 144, 216, 288].map((deg) => (
      <path
        key={deg}
        d={SAKURA_PETAL}
        fill={SAKURA.soft}
        stroke={SAKURA.line}
        strokeWidth={1.5}
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
    {SAKURA_STAMEN_DEGS.map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return (
        <circle
          key={deg}
          cx={12 + 2.9 * Math.cos(rad)}
          cy={12 - 2.9 * Math.sin(rad)}
          r="0.55"
          fill={SAKURA.goldDeep}
          stroke="none"
        />
      );
    })}
    <circle cx="12" cy="12" r="1.6" fill={SAKURA.gold} stroke={SAKURA.line} strokeWidth={1.1} />
  </>,
);

export const SakuraHeartIcon = sticker(
  <>
    <path
      d="M12 20.4C7.5 17.4 4.4 14.2 4.4 10.5 4.4 7.8 6.4 5.8 9 5.8c1.5 0 2.6.8 3 2 .4-1.2 1.5-2 3-2 2.6 0 4.6 2 4.6 4.7 0 3.7-3.1 6.9-7.6 9.9z"
      fill={SAKURA.pink}
      stroke={SAKURA.line}
      strokeWidth={1.8}
    />
    <path d="M7.6 9.2a2.4 2.4 0 0 1 2.4-2.1" stroke="#ffffff" strokeWidth={1.5} fill="none" />
    <path
      d="M18.7 2.8c.25 1.3.85 1.9 2.1 2.15-1.25.25-1.85.85-2.1 2.15-.25-1.3-.85-1.9-2.1-2.15 1.25-.25 1.85-.85 2.1-2.15z"
      fill={SAKURA.gold}
      stroke={SAKURA.line}
      strokeWidth={0.9}
    />
  </>,
);

export const SakuraBowIcon = sticker(
  <>
    <path
      d="M10.6 13.3 8.2 18.1l1.7-1.5 1.2 1.6 1.1-4.5z"
      fill={SAKURA.soft}
      stroke={SAKURA.line}
      strokeWidth={1.4}
    />
    <path
      d="M13.4 13.3 15.8 18.1l-1.7-1.5-1.2 1.6-1.1-4.5z"
      fill={SAKURA.soft}
      stroke={SAKURA.line}
      strokeWidth={1.4}
    />
    <path
      d="M10.9 12 4.6 8.5C3.2 10.7 3.2 13.3 4.6 15.5Z"
      fill={SAKURA.soft}
      stroke={SAKURA.line}
      strokeWidth={1.6}
    />
    <path
      d="M13.1 12 19.4 8.5C20.8 10.7 20.8 13.3 19.4 15.5Z"
      fill={SAKURA.soft}
      stroke={SAKURA.line}
      strokeWidth={1.6}
    />
    <path d="M10.5 12.1 6.6 10.4M13.5 12.1 17.4 10.4" stroke={SAKURA.line} strokeWidth={1} opacity={0.55} fill="none" />
    <rect x="10.5" y="10.2" width="3" height="3.8" rx="1.5" fill={SAKURA.deep} stroke={SAKURA.line} strokeWidth={1.5} />
  </>,
);

export const SakuraSparkleIcon = sticker(
  <>
    <path
      d="M10.4 3.6c.6 3.9 2.2 5.5 6.1 6.1-3.9.6-5.5 2.2-6.1 6.1-.6-3.9-2.2-5.5-6.1-6.1 3.9-.6 5.5-2.2 6.1-6.1z"
      fill={SAKURA.gold}
      stroke={SAKURA.line}
      strokeWidth={1.5}
    />
    <path
      d="M17.8 13.2c.4 2.4 1.4 3.4 3.7 3.8-2.3.4-3.3 1.4-3.7 3.8-.4-2.4-1.4-3.4-3.7-3.8 2.3-.4 3.3-1.4 3.7-3.8z"
      fill={SAKURA.pink}
      stroke={SAKURA.line}
      strokeWidth={1.3}
    />
    <circle cx="18.6" cy="5.4" r="1" fill={SAKURA.pink} stroke="none" />
    <circle cx="5.2" cy="17.8" r="0.9" fill={SAKURA.goldDeep} stroke="none" />
  </>,
);

/* ---- 手账时光：钢笔 / 和纸胶带 / 手帐本 / 木尺 ---- */

export const JournalPenIcon = sticker(
  <>
    <path
      d="M19.3 4.7c-1.2-1.2-3.1-1.2-4.3 0l-6.3 6.3 4.3 4.3 6.3-6.3c1.2-1.2 1.2-3.1 0-4.3z"
      fill={JOURNAL.tan}
      stroke={JOURNAL.line}
      strokeWidth={1.6}
    />
    <path d="M10.2 9.5l4.3 4.3" stroke={JOURNAL.line} strokeWidth={1.2} opacity={0.55} fill="none" />
    <path d="M8.7 11 5.9 18.1 13 15.3z" fill={JOURNAL.cream} stroke={JOURNAL.line} strokeWidth={1.6} />
    <path d="M7.2 16.7l2.3-2.3" stroke={JOURNAL.line} strokeWidth={1.2} fill="none" />
    <circle cx="9.7" cy="14.3" r="0.95" fill={JOURNAL.line} stroke="none" />
  </>,
);

export const JournalTapeIcon = sticker(
  <g transform="rotate(-24 12 12)">
    <defs>
      <clipPath id="ticon-tape">
        <path d="M4.4 9h15.2l-1.6 2 1.6 2-1.6 2H4.4l1.6-2-1.6-2z" />
      </clipPath>
    </defs>
    <path
      d="M4.4 9h15.2l-1.6 2 1.6 2-1.6 2H4.4l1.6-2-1.6-2z"
      fill={JOURNAL.green}
      stroke={JOURNAL.line}
      strokeWidth={1.5}
    />
    <g clipPath="url(#ticon-tape)" stroke="#ffffff" strokeWidth={1.1} opacity={0.85}>
      <path d="M8.4 7.6 6 16.4" />
      <path d="M12.4 7.6 10 16.4" />
      <path d="M16.4 7.6 14 16.4" />
    </g>
  </g>,
);

export const JournalNotebookIcon = sticker(
  <>
    <rect x="5" y="4.4" width="14" height="15.6" rx="2.6" fill={JOURNAL.cream} stroke={JOURNAL.line} strokeWidth={1.6} />
    <path d="M8.8 2.8v3.4M12 2.8v3.4M15.2 2.8v3.4" stroke={JOURNAL.line} strokeWidth={1.7} fill="none" />
    <path d="M17.6 4.4V20" stroke={JOURNAL.red} strokeWidth={1.3} opacity={0.85} fill="none" />
    <path
      d="M12 16.4c-2.1-1.4-3.3-2.7-3.3-4.2 0-1.1.8-2 1.9-2 .6 0 1.1.4 1.4 1 .3-.6.8-1 1.4-1 1.1 0 1.9.9 1.9 2 0 1.5-1.2 2.8-3.3 4.2z"
      fill={JOURNAL.red}
      stroke={JOURNAL.line}
      strokeWidth={1.3}
    />
  </>,
);

export const JournalRulerIcon = sticker(
  <g transform="rotate(30 12 12)">
    <rect x="3.5" y="9.2" width="17" height="5.6" rx="1.1" fill={JOURNAL.kraft} stroke={JOURNAL.line} strokeWidth={1.6} />
    <path d="M7 9.2v2.4M10.4 9.2v3.4M13.8 9.2v2.4M17.2 9.2v3.4" stroke={JOURNAL.line} strokeWidth={1.4} fill="none" />
    <circle cx="5.7" cy="12" r="0.85" fill={JOURNAL.cream} stroke={JOURNAL.line} strokeWidth={1} />
  </g>,
);

/** 一套底栏图标（明细 / 资产 / 日历 / 图表） */
export interface TabIconSet {
  detail: ReturnType<typeof make>;
  assets: ReturnType<typeof make>;
  calendar: ReturnType<typeof make>;
  stats: ReturnType<typeof make>;
}

/**
 * 按主题取底栏图标：简约浅/深沿用基础线性图标，
 * 三套风格主题各配一套主题化图标（糖果 / 樱花 / 手账）。
 */
export const TAB_ICON_SETS: Record<ThemeId, TabIconSet> = {
  light: { detail: BookIcon, assets: WalletIcon, calendar: CalendarIcon, stats: ChartIcon },
  dark: { detail: BookIcon, assets: WalletIcon, calendar: CalendarIcon, stats: ChartIcon },
  candy: {
    detail: CandyLollipopIcon,
    assets: CandySweetIcon,
    calendar: CandyPopsicleIcon,
    stats: CandyDonutIcon,
  },
  sakura: {
    detail: SakuraBlossomIcon,
    assets: SakuraHeartIcon,
    calendar: SakuraBowIcon,
    stats: SakuraSparkleIcon,
  },
  journal: {
    detail: JournalPenIcon,
    assets: JournalTapeIcon,
    calendar: JournalNotebookIcon,
    stats: JournalRulerIcon,
  },
};
