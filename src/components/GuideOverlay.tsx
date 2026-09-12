import { useEffect } from 'react';
import {
  BookIcon,
  CalendarIcon,
  ChartIcon,
  ChevronLeftIcon,
  CoinsIcon,
  WalletIcon,
} from './icons';
import { lockBodyScroll, unlockBodyScroll } from '../utils';

interface GuideOverlayProps {
  onClose: () => void;
}

const FEATURES = [
  {
    icon: <BookIcon />,
    title: '明细',
    desc: '多账本流水、月度预算、模板快捷记账、周期账单自动补齐、多维账单搜索',
  },
  {
    icon: <WalletIcon />,
    title: '资产',
    desc: '六大账户类型总览净资产，借入 / 借出独立管理，支持隐私模式隐藏金额',
  },
  {
    icon: <CalendarIcon />,
    title: '日历',
    desc: '收支日历：每天花了多少钱、收了多少钱，点开日期即看当日明细',
  },
  {
    icon: <ChartIcon />,
    title: '图表',
    desc: '周 / 月 / 年收支趋势、支出与收入构成、净资产走势，一眼看清钱去了哪',
  },
];

const STEPS = [
  { n: '1', title: '添加账户', desc: '到「资产」页添加你的银行卡、支付宝、微信钱包等账户' },
  { n: '2', title: '记一笔', desc: '点右下角「＋」，输入金额、选个分类，两秒完成记账' },
  { n: '3', title: '自动汇总', desc: '明细、日历、图表与预算随每笔账自动更新，无需手动整理' },
];

/** 首次使用引导：介绍四大模块与上手三步，仅在首次打开时自动弹出 */
export function GuideOverlay({ onClose }: GuideOverlayProps) {
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  return (
    <>
      <div className="overlay-backdrop" />
      <div className="overlay-page guide-page">
        <div className="page-head">
          <span className="page-title">欢迎使用口袋记账</span>
          <button className="page-back" onClick={onClose}>
            跳过 <ChevronLeftIcon size={15} className="flip-x" />
          </button>
        </div>

        <div className="page-body">
          <div className="guide-hero">
            <span className="brand-logo guide-logo">
              <CoinsIcon size={30} />
            </span>
            <h2>口袋记账 PocketLedger</h2>
            <p>多账本明细 · 资产管理 · 收支日历 · 统计图表，数据全部保存在你自己的设备上</p>
          </div>

          <div className="guide-section">
            <h3>三步开始记账</h3>
            <div className="guide-steps">
              {STEPS.map((s) => (
                <div className="guide-step" key={s.n}>
                  <span className="guide-step-n">{s.n}</span>
                  <span className="guide-step-main">
                    <b>{s.title}</b>
                    <span>{s.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="guide-section">
            <h3>四大功能模块</h3>
            <div className="guide-grid">
              {FEATURES.map((f) => (
                <div className="guide-card" key={f.title}>
                  <div className="guide-card-head">
                    <span className="guide-card-icon">{f.icon}</span>
                    <b>{f.title}</b>
                  </div>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="guide-section">
            <h3>小贴士</h3>
            <ul className="guide-tips">
              <li>数据仅保存在本机浏览器，不上传任何服务器；顶栏「⚙ 设置 → 数据管理」支持导出备份与导入恢复</li>
              <li>想先随便看看？在「设置 → 数据管理」可一键载入模拟数据，也可以随时清空重新开始</li>
              <li>顶栏按钮可切换深浅主题、隐藏金额、再次打开本引导</li>
            </ul>
          </div>

          <button className="btn primary guide-cta" onClick={onClose}>
            开始使用
          </button>
        </div>
      </div>
    </>
  );
}
