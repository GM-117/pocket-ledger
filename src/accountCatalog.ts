import type { Account, AccountKind, AccountType } from './types';

/** 账户子类型：icon 为 emoji，或与 id 同名的图标 key（由 ACCOUNT_ICON_MAP 渲染，品牌 logo / 语义图标） */
export interface Subtype {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface KindMeta {
  id: AccountKind;
  label: string;
  /** 分组右侧汇总口径 */
  sum: 'balance' | 'debt';
  subtypes: Subtype[];
}

const y = '#f59e0b'; // iCost 式黄色圆底

export const ACCOUNT_KINDS: KindMeta[] = [
  {
    id: 'fund',
    label: '资金账户',
    sum: 'balance',
    subtypes: [
      { id: 'cash', label: '现金钱包', icon: '👛', color: y },
      { id: 'savings', label: '储蓄卡', icon: '💳', color: y },
      { id: 'alipay', label: '支付宝', icon: 'alipay', color: '#1677ff' },
      { id: 'yuebao', label: '余额宝', icon: 'yuebao', color: '#1677ff' },
      { id: 'yulibao', label: '余利宝', icon: 'yulibao', color: '#3b82f6' },
      { id: 'xiaohebao', label: '小荷包', icon: 'xiaohebao', color: '#f97316' },
      { id: 'ant_fortune', label: '蚂蚁财富', icon: 'ant_fortune', color: '#1677ff' },
      { id: 'wechat', label: '微信钱包', icon: 'wechat', color: '#22c55e' },
      { id: 'wechat_change', label: '微信零钱通', icon: 'wechat_change', color: '#22c55e' },
      { id: 'tenpay', label: '腾讯理财通', icon: 'tenpay', color: '#3b82f6' },
      { id: 'qq', label: 'QQ钱包', icon: 'qq', color: '#3b82f6' },
      { id: 'douyin', label: '抖音钱包', icon: 'douyin', color: '#ef4444' },
      { id: 'eleme', label: '饿了么钱包', icon: 'eleme', color: '#0ea5e9' },
      { id: 'fliggy', label: '飞猪钱包', icon: 'fliggy', color: '#ff9800' },
      { id: 'macau_wallet', label: '澳门钱包', icon: 'macau_wallet', color: y },
      { id: 'dcep', label: '数字人民币', icon: 'dcep', color: '#f43f5e' },
      { id: 'jd_finance', label: '京东金融', icon: 'jd_finance', color: '#e1251b' },
      { id: 'jd_xjk', label: '京东小金库', icon: 'jd_xjk', color: '#e1251b' },
      { id: 'unionpay', label: '云闪付', icon: 'unionpay', color: '#2563eb' },
      { id: 'line_pay', label: 'LINE Pay', icon: 'line_pay', color: '#06c755' },
      { id: 'paypay', label: 'PayPay', icon: 'paypay', color: '#ff0033' },
      { id: 'paypal', label: 'PayPal', icon: 'paypal', color: '#1d4ed8' },
      { id: 'payme', label: 'PayMe', icon: 'payme', color: '#0ea5e9' },
      { id: 'paga', label: 'Paga', icon: 'paga', color: y },
      { id: 'chipper', label: 'Chipper Cash', icon: 'chipper', color: '#16a34a' },
      { id: 'youtrip', label: 'YouTrip', icon: 'youtrip', color: '#7c3aed' },
      { id: 'tng', label: 'TNG eWallet', icon: 'tng', color: '#06b6d4' },
      { id: 'usetimon', label: 'UseTimon', icon: 'usetimon', color: '#64748b' },
      { id: 'gjj', label: '公积金', icon: 'gjj', color: y },
      { id: 'yibao', label: '医保卡', icon: 'yibao', color: y },
      { id: 'pension', label: '养老金', icon: 'pension', color: y },
      { id: 'passbook', label: '存折', icon: 'passbook', color: y },
      { id: 'other_asset', label: '其他资产', icon: 'other_asset', color: y },
    ],
  },
  {
    id: 'credit',
    label: '信用账户',
    sum: 'debt',
    subtypes: [
      { id: 'credit_card', label: '信用卡', icon: '💳', color: y },
      { id: 'loan', label: '贷款', icon: 'loan', color: y },
      { id: 'huabei', label: '蚂蚁花呗', icon: 'huabei', color: '#1677ff' },
      { id: 'jd_baitiao', label: '京东白条', icon: 'jd_baitiao', color: '#e1251b' },
      { id: 'jd_jintiao', label: '京东金条', icon: 'jd_jintiao', color: '#e1251b' },
      { id: 'jiebei', label: '借呗', icon: 'jiebei', color: '#1677ff' },
      { id: 'weilidai', label: '微粒贷', icon: 'weilidai', color: '#22c55e' },
      { id: 'mt_jieqian', label: '美团借钱', icon: 'mt_jieqian', color: y },
      { id: 'mt_yuefu', label: '美团月付', icon: 'mt_yuefu', color: y },
      { id: 'dy_fxj', label: '抖音放心借', icon: 'dy_fxj', color: '#ef4444' },
      { id: 'dy_yuefu', label: '抖音月付', icon: 'dy_yuefu', color: '#ef4444' },
      { id: 'wechat_fenfu', label: '微信分付', icon: 'wechat_fenfu', color: '#22c55e' },
      { id: 'beiyongjin', label: '备用金', icon: 'beiyongjin', color: '#3b82f6' },
      { id: 'family', label: '亲情账户', icon: 'family', color: y },
      { id: 'other_credit', label: '其他信用', icon: 'other_credit', color: y },
    ],
  },
  {
    id: 'recharge',
    label: '充值账户',
    sum: 'balance',
    subtypes: [
      { id: 'bus_card', label: '公交卡', icon: '🚌', color: y },
      { id: 'meal_card', label: '饭卡', icon: '🍚', color: y },
      { id: 'phone_bill', label: '话费', icon: '📱', color: y },
      { id: 'vip_card', label: '会员卡', icon: '👑', color: y },
      { id: 'fuel_card', label: '加油卡', icon: '⛽', color: y },
      { id: 'deposit', label: '押金', icon: '🔒', color: y },
      { id: 'apple_id', label: 'Apple ID', icon: '🍎', color: y },
      { id: 'octopus', label: '八达通', icon: 'octopus', color: '#f97316' },
      { id: 'macau_pass', label: '澳门通', icon: 'macau_pass', color: '#22c55e' },
      { id: 'suica', label: 'Suica', icon: 'suica', color: '#22c55e' },
      { id: 'icoca', label: 'ICOCA', icon: 'icoca', color: '#3b82f6' },
      { id: 'pasmo', label: 'PASMO', icon: 'pasmo', color: '#ec4899' },
      { id: 'wowpass', label: 'WOWPASS', icon: 'wowpass', color: '#ef4444' },
      { id: 'tmoney', label: 'Tmoney', icon: 'tmoney', color: '#06b6d4' },
      { id: 'tmall_card', label: '天猫超市卡', icon: 'tmall_card', color: '#f97316' },
      { id: 'jd_market_card', label: '京东超市卡', icon: 'jd_market_card', color: '#e1251b' },
      { id: 'jd_ecard', label: '京东E卡', icon: 'jd_ecard', color: '#e1251b' },
      { id: 'other_prepaid', label: '其他充值卡', icon: 'other_prepaid', color: y },
    ],
  },
  {
    id: 'invest',
    label: '理财账户',
    sum: 'balance',
    subtypes: [
      { id: 'stock', label: '股票', icon: '📈', color: '#ef4444' },
      { id: 'fund', label: '基金', icon: '📊', color: y },
      { id: 'gold', label: '黄金', icon: '🪙', color: y },
      { id: 'insurance', label: '保险', icon: '🛡️', color: y },
      { id: 'futures', label: '期货', icon: '🛢️', color: y },
      { id: 'crypto', label: '数字货币', icon: '₿', color: '#f7931a' },
      { id: 'deposit_fixed', label: '定期存款', icon: '🏦', color: y },
      { id: 'other_invest', label: '其它理财', icon: 'other_invest', color: y },
    ],
  },
  {
    id: 'receivable',
    label: '应收账户',
    sum: 'balance',
    subtypes: [
      { id: 'lend_out', label: '借出', icon: '🤝', color: y },
      { id: 'other_receivable', label: '其他应收', icon: '🧾', color: y },
    ],
  },
  {
    id: 'payable',
    label: '应付账户',
    sum: 'debt',
    subtypes: [
      { id: 'borrow_in', label: '借入', icon: '🙏', color: y },
      { id: 'other_payable', label: '其他应付', icon: '🧾', color: y },
    ],
  },
];

export const KIND_MAP: Record<AccountKind, KindMeta> = Object.fromEntries(
  ACCOUNT_KINDS.map((k) => [k.id, k]),
) as Record<AccountKind, KindMeta>;

export function subtypeOf(kind: AccountKind, subtypeId: string): Subtype {
  const ks = KIND_MAP[kind];
  return ks.subtypes.find((s) => s.id === subtypeId) ?? ks.subtypes[ks.subtypes.length - 1];
}

/** 账户大类 → 资产 / 负债归属 */
export function kindToType(kind: AccountKind): AccountType {
  return kind === 'credit' || kind === 'payable' ? 'liability' : 'asset';
}

export function accountIcon(a: Account): { icon: string; color: string } {
  const st = subtypeOf(a.kind, a.subtype);
  return { icon: st.icon || a.emoji, color: st.color };
}

/** 旧数据 / 导入数据的账户字段补全（kind/subtype 等缺失时按 type 推导） */
export function normalizeAccount(a: Partial<Account> & Pick<Account, 'id' | 'name'>): Account {
  const kind: AccountKind =
    a.kind && KIND_MAP[a.kind] ? a.kind : a.type === 'liability' ? 'credit' : 'fund';
  const ks = KIND_MAP[kind];
  const st = a.subtype && ks.subtypes.some((s) => s.id === a.subtype)
    ? a.subtype
    : kind === 'fund'
      ? 'other_asset'
      : kind === 'credit'
        ? 'other_credit'
        : kind === 'recharge'
          ? 'other_prepaid'
          : kind === 'invest'
            ? 'other_invest'
            : kind === 'receivable'
              ? 'other_receivable'
              : 'other_payable';
  return {
    id: a.id,
    name: a.name,
    emoji: a.emoji ?? '💵',
    type: kindToType(kind),
    initialBalance: a.initialBalance ?? 0,
    bookId: a.bookId ?? '',
    createdAt: a.createdAt ?? new Date().toISOString(),
    kind,
    subtype: st,
    note: a.note,
    includeInNet: a.includeInNet ?? true,
    canSelect: a.canSelect ?? true,
    lendDate: a.lendDate,
  };
}
