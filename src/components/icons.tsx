import type { ReactNode } from 'react';

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

interface LIconProps {
  /** 数据层存的 emoji（或账户的 1-2 个汉字品牌符，如「微」「支」） */
  emoji?: string | null;
  size?: number;
  className?: string;
}

/**
 * 统一图标渲染：emoji 命中映射 → 线性 SVG（currentColor 着色）；
 * 未命中 → 原文本渲染（汉字品牌符 / 用户自定义 emoji 的优雅降级）。
 */
export function LIcon({ emoji, size = 18, className }: LIconProps) {
  const key = emoji ? normEmoji(emoji) : '';
  const Cmp = EMOJI_ICON_MAP[key];
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
