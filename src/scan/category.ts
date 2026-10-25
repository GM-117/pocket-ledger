import type { Account, Category, CategoryType } from '../types';
import { fmtISO } from '../utils';

/**
 * 分类 id 由首次运行时随机生成，跨设备完全不同，所以这里只按「名称」匹配，
 * 规则表也一律用默认分类名书写，最后再解析回本机的那条实例。
 */
export interface CategoryRule {
  re: RegExp;
  /** 默认分类名 */
  cat: string;
  type: CategoryType;
}

/** 顺序即优先级：先具体后宽泛 */
export const CATEGORY_RULES: CategoryRule[] = [
  { type: 'expense', cat: '交通', re: /滴滴|高德打车|T3出行|地铁|公交|12306|铁路|火车|机票|航空|加油|中石化|中石油|停车|打车|哈啰|共享单车|ETC|出租/ },
  { type: 'expense', cat: '通讯', re: /中国移动|中国联通|中国电信|话费|流量包|充值中心|宽带费/ },
  { type: 'expense', cat: '医疗', re: /药店|药房|医院|挂号|门诊|急诊|体检|疫苗/ },
  // 餐饮排在旅行前：账单里「外卖/馄饨」远比真正的住宿消费常见，
  // 而美团那一行「外卖团购特价美食酒店电影」会同时命中两边的词。
  { type: 'expense', cat: '餐饮', re: /美团|饿了么|口碑|火锅|外卖|咖啡|餐厅|饭店|麦当劳|肯德基|星巴克|瑞幸|奶茶|烧烤|午饭|晚饭|夜宵|食堂|便利店|馄饨|炸鸡|小吃/ },
  { type: 'expense', cat: '旅行', re: /携程|飞猪|去哪儿|马蜂窝|民宿|门票|景区|度假村|酒店|住宿/ },
  { type: 'expense', cat: '娱乐', re: /电影|影院|淘票票|猫眼|游戏|Steam|演出|演唱会|KTV|剧本杀|健身|视频会员|音频会员/ },
  { type: 'expense', cat: '购物', re: /淘宝|天猫|拼多多|京东|得物|唯品会|苏宁|当当|闲鱼|抖音商城|超市|商场|服饰|服装|数码|家电/ },
  { type: 'expense', cat: '居住', re: /房租|物业费?|水电费?|燃气|电费|水费|装修|链家|贝壳|中介费/ },
  { type: 'income', cat: '工资', re: /工资|薪资|发薪|月薪|税前|税后/ },
  { type: 'income', cat: '理财收益', re: /余额宝.*收益|零钱通.*收益|基金|分红|利息|结息|收益到账/ },
  { type: 'income', cat: '红包', re: /红包/ },
  { type: 'income', cat: '兼职', re: /兼职|外包|稿酬|打赏|劳务费/ },
];

/** 支付宝 / 微信在账单里自己标的分类，比按商户名猜准得多，优先采纳。
 *  OCR 版式里标签与值常被拆成两行（Vision 会先吐左列再吐右列），且值带 ＞〉 之类垃圾尾字符。 */
const BILL_CATEGORY = /(?:账单分类|交易类型|费用类型)\s*[：:]?\s*([^\s，。;；、]{2,8})/;

/** 去掉 OCR 粘在分类词尾部的箭头 / 括号 / 标点 */
const trimCategory = (s: string) => s.replace(/[^一-鿿A-Za-z0-9]+$/g, '').replace(/^[^一-鿿A-Za-z0-9]+/g, '');

const BILL_CATEGORY_MAP: Record<string, string> = {
  交通出行: '交通', 餐饮美食: '餐饮', 文化休闲: '娱乐', 休闲娱乐: '娱乐',
  购物百货: '购物', 服饰美妆: '购物', 日用百货: '购物', 数码电器: '购物',
  食品餐饮: '餐饮', 交通: '交通', 日用相关: '购物', 美容美发: '购物',
  日常开销: '居住', 居家用物: '居住', 水电煤物业: '居住', 物业水电: '居住',
  通讯物流: '通讯', 通讯网络: '通讯', 医疗保健: '医疗', 保险: '医疗',
  酒店旅游: '旅行', 旅游: '旅行', 教育培训: '娱乐', 人情往来: '购物',
  工资: '工资', 奖金: '工资', 理财: '理财收益', 收入: '工资',
};

/** tier 0：直接采纳账单自带分类；命中不到返回 null 交给后续层 */
function matchBillCategory(pool: Category[], text: string): Category | null {
  const label = trimCategory(BILL_CATEGORY.exec(text)?.[1] ?? '');
  if (!label) return null;
  const direct = pool.find((c) => c.name === label);
  if (direct) return direct;
  const mapped = BILL_CATEGORY_MAP[label];
  if (!mapped) return null;
  return pool.find((c) => c.name === mapped) ?? null;
}

/** 按名称匹配分类；命中不到返回 null（绝不凭空造 id） */
export function matchCategoryByName(
  categories: Category[],
  text: string,
  type: CategoryType,
): Category | null {
  const pool = categories.filter((c) => c.type === type && !c.hidden);
  if (!pool.length || !text) return null;
  const bill = matchBillCategory(pool, text);
  if (bill) return bill;
  // tier 1：用户自己的分类名直接出现在文本里，长名优先（避免「餐」抢走「餐饮」的命中）
  const named = pool
    .filter((c) => c.name.length >= 2 && text.includes(c.name))
    .sort((a, b) => b.name.length - a.name.length);
  if (named.length) return named[0];
  // tier 2：关键词规则表 → 默认分类名 → 本机实例
  for (const rule of CATEGORY_RULES) {
    if (rule.type !== type || !rule.re.test(text)) continue;
    const hit = pool.find((c) => c.name === rule.cat);
    if (hit) return hit;
  }
  return null;
}

const MERCHANT_LABELS = '商户名称|商户全称|商户|商品说明|商品信息|商品|收款方|付款方|对方|店铺|交易对方|备注';

/** 商户名：优先标签后的值，其次最长的纯中文串 */
export function extractMerchant(lines: string[], amountLine: number): string {
  for (let i = 0; i < lines.length; i++) {
    if (i === amountLine) continue;
    const m = new RegExp(`(?:${MERCHANT_LABELS})(?![一-鿿])\\s*[:：]?\\s*(\\S[^\\n]*)`).exec(lines[i]);
    const val = m?.[1]?.trim();
    if (val && val.length <= 30) return cleanMerchant(val);
  }
  let best = '';
  for (let i = 0; i < lines.length; i++) {
    if (i === amountLine) continue;
    for (const m of lines[i].matchAll(/[一-鿿]{2,12}/g)) {
      if (m[0].length > best.length) best = m[0];
    }
  }
  return best ? cleanMerchant(best) : '';
}

const MERCHANT_JUNK =
  /^(支付成功|付款成功|交易成功|已完成|账单详情|交易详情|收款方|付款方式|支付方式|订单|返回|完成|详情|更多|说明|提示|零钱|余额|余额宝|花呗|信用卡|储蓄卡|银行卡|微信|支付宝|云闪付|金额|时间|状态|类型)/;

function cleanMerchant(s: string): string {
  return s.replace(/[¥￥$]/g, '').replace(/-$/, '').trim().slice(0, 24).replace(MERCHANT_JUNK, '').trim();
}

/**
 * 付款方式 → 账户：只认「付款方式」那一行。
 * 全局搜账户名会被品牌词带歪（截图页眉的「支付宝」不是出资账户），
 * 而选错账户比留空更糟 —— 留空时记账面板本就会落到默认账户，用户一眼就能改。
 */
export function inferAccountId(accounts: Account[], text: string, bookId: string): string {
  if (!text) return '';
  const pool = accounts.filter((a) => a.canSelect !== false && a.bookId === bookId && a.name.length >= 2);
  const methodLine = /(?:付款方式|支付方式|支付渠道|付款账户|扣款方式|扣款账户|出账方式)([^\n]*)/.exec(text)?.[1];
  if (!methodLine) return '';
  const named = pool
    .filter((a) => methodLine.includes(a.name))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (named) return named.id;
  // 别名 → 账户名片段（用户账户通常叫「微信零钱」「招行储蓄卡」）
  const ALIAS: { re: RegExp; keys: string[] }[] = [
    { re: /零钱|微信/, keys: ['零钱', '微信'] },
    { re: /余额宝|支付宝/, keys: ['余额宝', '支付宝'] },
    { re: /花呗/, keys: ['花呗'] },
    { re: /储蓄卡|借记卡|工资卡/, keys: ['储蓄卡', '借记卡', '工资卡'] },
    { re: /信用卡/, keys: ['信用卡'] },
  ];
  for (const a of ALIAS) {
    if (!a.re.test(methodLine)) continue;
    const cand = pool.find((x) => a.keys.some((k) => x.name.includes(k)));
    if (cand) return cand.id;
  }
  return '';
}

/** 截图日期：识别不到就用今天；识别到未来日期一律回退（OCR 误读年月很常见） */
export function extractDate(text: string, now = new Date()): string {
  if (!text) return fmtISO(now);
  const todayISO = fmtISO(now);
  const clamp = (iso: string) => (iso > todayISO ? todayISO : iso);
  const build = (y: number, mo: number, d: number) => {
    if (!(y >= 2000 && y <= 2100) || mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    const dt = new Date(y, mo - 1, d, 12);
    // 拒绝 2月31日 这类会被 Date 悄悄滚到下个月的假日期
    if (dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  let m = /(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/.exec(text);
  if (m) {
    const iso = build(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) return clamp(iso);
  }
  m = /(?:^|[^\d])(20\d{2})(\d{2})(\d{2})(?!\d)/.exec(text);
  if (m) {
    const iso = build(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) return clamp(iso);
  }
  if (/前天/.test(text)) return clamp(fmtISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 12)));
  if (/昨天/.test(text)) return clamp(fmtISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12)));
  m = /(\d{1,2})月(\d{1,2})[日号]?/.exec(text);
  if (m) {
    const iso = build(now.getFullYear(), Number(m[1]), Number(m[2]));
    if (iso) return clamp(iso);
  }
  m = /(?:^|[^\d:])(\d{1,2})[-/](\d{1,2})(?![\d:])/.exec(text);
  if (m) {
    const iso = build(now.getFullYear(), Number(m[1]), Number(m[2]));
    if (iso) return clamp(iso);
  }
  return todayISO;
}
