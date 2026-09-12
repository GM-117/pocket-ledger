import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { fmtISO, lockBodyScroll, unlockBodyScroll } from '../utils';
import { ChevronLeftIcon, DownloadIcon, RotateCcwIcon, TrashIcon, UploadIcon } from './icons';

/**
 * 模拟数据仅供演示 / 测试；面向真实用户发布时改为 false，
 * 即隐藏「刷新模拟数据」入口（导入 / 导出 / 清空不受影响）
 */
const SHOW_MOCK_DATA = true;

interface SettingsPanelProps {
  onClose: () => void;
}

/** 设置页（顶栏 ⚙ 进入）：数据管理 —— 导出 / 导入 / 刷新模拟数据 / 清空 */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const loadDemo = useStore((s) => s.loadDemo);
  const resetAll = useStore((s) => s.resetAll);

  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // 覆盖页打开期间锁定背景滚动（计数式，叠加页共用）
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocket-ledger-${fmtISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('已导出备份文件 ✓');
  };

  const onImportFile = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const err = importJSON(String(r.result));
      setMsg(err ?? '导入成功 ✓');
    };
    r.readAsText(f);
  };

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-page">
        <div className="page-head">
          <button className="page-back" onClick={onClose}>
            <ChevronLeftIcon size={17} /> 返回
          </button>
          <span className="page-title">设置</span>
          {/* 与「返回」等宽的占位，保证标题居中 */}
          <span className="page-head-ph" aria-hidden />
        </div>

        <div className="page-body">
          <div className="settings-group">
            <div className="settings-group-title">数据管理</div>
            <div className="card settings-card">
              <button className="settings-row" onClick={doExport}>
                <span className="icon-circle" style={{ background: '#5b7cfa22', color: '#5b7cfa' }}>
                  <DownloadIcon size={16} />
                </span>
                <span className="settings-row-main">
                  <b>导出数据</b>
                  <small>下载 JSON 备份文件，可随时导入恢复</small>
                </span>
              </button>
              <button className="settings-row" onClick={() => fileRef.current?.click()}>
                <span className="icon-circle" style={{ background: '#10b98122', color: '#10b981' }}>
                  <UploadIcon size={16} />
                </span>
                <span className="settings-row-main">
                  <b>导入数据</b>
                  <small>从备份文件恢复，覆盖当前全部数据</small>
                </span>
              </button>
              {SHOW_MOCK_DATA && (
                <button
                  className="settings-row"
                  onClick={() => {
                    if (window.confirm('载入模拟数据？当前所有数据将被覆盖。')) {
                      loadDemo();
                      setMsg('已载入模拟数据 ✓');
                    }
                  }}
                >
                  <span className="icon-circle" style={{ background: '#5b7cfa22', color: '#5b7cfa' }}>
                    <RotateCcwIcon size={16} />
                  </span>
                  <span className="settings-row-main">
                    <b>刷新模拟数据</b>
                    <small>载入一套演示账目（仅测试体验用）</small>
                  </span>
                </button>
              )}
              <button
                className="settings-row danger"
                onClick={() => {
                  if (
                    window.confirm(
                      '清空全部数据并恢复到初始状态？所有账本、账户与账单将被删除且无法恢复，建议先导出备份。',
                    )
                  ) {
                    resetAll();
                    setMsg('已清空，恢复为初始状态 ✓');
                  }
                }}
              >
                <span className="icon-circle" style={{ background: '#e5484d22', color: '#e5484d' }}>
                  <TrashIcon size={16} />
                </span>
                <span className="settings-row-main">
                  <b>清空数据</b>
                  <small>删除全部数据，恢复到初始状态</small>
                </span>
              </button>
            </div>
            {msg && <p className="settings-msg">{msg}</p>}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              onImportFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </>
  );
}
