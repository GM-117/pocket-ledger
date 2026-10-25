import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { TRANSFER_CATEGORY_ID, type Txn, type TxnType } from '../types';
import { evalAmount, fmtISO, round2 } from '../utils';
import { accountIcon } from '../accountCatalog';
import { matchCategoryByName } from '../scan/category';
import { fileToScanImage } from '../scan/image';
import {
  CONFIDENCE_GATE,
  parsePaymentImage,
  availableProviders,
  defaultEngine,
  getProvider,
  hostOf,
  loadApiKey,
  loadSettings,
  scanResultToPreset,
  type ScanEngineId,
  type ScanImage,
  type ScanResult,
} from '../scan';
import { DateEditModal, OptionPickerModal } from './EditModals';
import { Modal } from './Modal';
import { CameraIcon, LIcon } from './icons';

interface ScanModalProps {
  onClose: () => void;
  /** 交回预填记录，由 App 关闭本弹窗后再打开记账面板 */
  onDone: (preset: Txn) => void;
}

type Stage = 'source' | 'consent' | 'busy' | 'review';

/** 截图/文字记账：识别只负责预填，账户与分类始终由用户过一眼再落库 */
export function ScanModal({ onClose, onDone }: ScanModalProps) {
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const activeBookId = useStore((s) => s.activeBookId);

  const settings = useMemo(() => loadSettings(), []);
  const hasKey = useMemo(() => !!loadApiKey(), []);
  const engines = useMemo(() => availableProviders(settings, hasKey), [settings, hasKey]);

  const [engine, setEngine] = useState<ScanEngineId>(() => defaultEngine(settings, hasKey));
  const [stage, setStage] = useState<Stage>('source');
  const [status, setStatus] = useState('正在识别…');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxnType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(fmtISO(new Date()));
  const [note, setNote] = useState('');
  const [accOpen, setAccOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [img, setImg] = useState<ScanImage | null>(null);
  /** 每次换图都要重新同意一次上传，不做长期勾选 */
  const [consented, setConsented] = useState(false);
  const [consentHost, setConsentHost] = useState('');
  const pendingRef = useRef<{ text?: string; image?: ScanImage } | null>(null);
  /** 图片只用 objectURL 预览，卸载即 revoke，绝不落盘 */
  const [preview, setPreview] = useState('');
  const previewRef = useRef('');
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    abortRef.current?.abort();
  }, []);

  const selectable = useMemo(
    () => accounts.filter((a) => a.canSelect !== false && a.bookId === activeBookId),
    [accounts, activeBookId],
  );
  const cats = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense') && !c.hidden);
  const guess = result?.amount;
  /** 置信度不足或并列歧义时不预填金额，只给候选，必须用户点一下 */
  const needsPick = !!guess && (guess.confidence < CONFIDENCE_GATE || guess.ambiguous);

  const recognize = async (input: { text?: string; image?: ScanImage }, forced = false) => {
    const provider = getProvider(engine);
    if (!forced && provider?.uploadsImage && input.image && !consented) {
      pendingRef.current = input;
      setConsentHost(hostOf(settings.baseUrl));
      setError('');
      setStage('consent');
      return;
    }
    setError('');
    setStatus('正在识别…');
    setStage('busy');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // 云端识别挂死要有兜底；本机 OCR 首次要下载几 MB 文字包，不设看门狗
    const watchdog = provider?.uploadsImage ? setTimeout(() => ctrl.abort(), 60_000) : null;
    const r = await parsePaymentImage(input, {
      settings,
      key: loadApiKey(),
      engine,
      signal: ctrl.signal,
      onStatus: setStatus,
    });
    if (watchdog) clearTimeout(watchdog);
    abortRef.current = null;
    if (!r.ok) {
      setStage('source');
      setResult(null);
      setError(r.error ?? '识别失败');
      return;
    }
    applyResult(r);
  };

  const applyResult = (r: ScanResult) => {
    const p = scanResultToPreset(r, { categories, accounts, activeBookId });
    setResult(r);
    setType(p.type);
    const g = r.amount;
    setAmount(g && g.confidence >= CONFIDENCE_GATE && !g.ambiguous ? String(p.amount) : '');
    setCategoryId(p.categoryId);
    setAccountId(p.accountId);
    setDate(p.date);
    setNote(p.note);
    setError('');
    setStage('review');
  };

  const switchType = (t: TxnType) => {
    setType(t);
    if (t === 'transfer') return setCategoryId('');
    /** 换收支方向后原分类可能属于另一侧，按新方向重新匹配一次 */
    const hay = result?.categoryName ? `${result.text}\n${result.categoryName}` : (result?.text ?? '');
    setCategoryId(matchCategoryByName(categories, hay, t === 'income' ? 'income' : 'expense')?.id ?? '');
  };

  const pickCandidate = (v: number) => {
    setAmount(String(v));
    setError('');
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    try {
      const next = await fileToScanImage(f);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = URL.createObjectURL(f);
      setPreview(previewRef.current);
      setImg(next);
      setConsented(false);
      // 能读图的引擎（本机 OCR 或云端）在场时自动开跑；纯粘贴引擎留给用户改走文字
      if (getProvider(engine)?.readsImage) void recognize({ image: next });
    } catch (err) {
      setImg(null);
      setError((err as Error).message || '图片读取失败');
    }
  };

  const start = () => {
    const t = text.trim();
    if (!t && !img) return setError('请先粘贴账单文字，或选择一张付款截图');
    void recognize({ text: t || undefined, image: img ?? undefined });
  };

  const runConsented = () => {
    const input = pendingRef.current ?? {};
    pendingRef.current = null;
    setConsented(true);
    void recognize(input, true);
  };

  const confirm = () => {
    const amt = evalAmount(amount.trim());
    if (!amount.trim() || Number.isNaN(amt) || amt <= 0) return setError('请确认这笔的金额');
    if (type !== 'transfer' && !categoryId) return setError('请选择分类');
    onDone({
      id: '',
      bookId: activeBookId,
      accountId,
      categoryId: type === 'transfer' ? TRANSFER_CATEGORY_ID : categoryId,
      type,
      amount: round2(amt),
      date,
      note: note.trim(),
      createdAt: '',
    });
  };

  const dateLabel =
    date === fmtISO(new Date()) ? '今天' : `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const selectedAcc = accounts.find((a) => a.id === accountId);

  return (
    <Modal title="截图记账" onClose={onClose} className="scan-modal">
      {stage === 'source' && (
        <>
          {engines.length > 1 && (
            <div className="seg scan-engines">
              {engines.map((e) => (
                <button
                  key={e.id}
                  className={engine === e.id ? 'active' : ''}
                  onClick={() => setEngine(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          )}
          <div className="scan-sources">
            <button className="btn ghost scan-source-btn" onClick={() => fileRef.current?.click()}>
              <CameraIcon size={16} /> 选择付款截图
            </button>
            <span className="scan-or">或</span>
          </div>
          <label className="field scan-field">
            <span>粘贴账单文字</span>
            <textarea
              rows={6}
              value={text}
              placeholder={'到支付宝/微信的账单详情页长按选中文字复制，粘贴到这里\n例如：\n支付成功\n实付款 ¥28.50\n商户 星巴克咖啡'}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
            />
          </label>
          {preview && <img className="scan-preview" src={preview} alt="待识别图片" />}
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="btn ghost" onClick={onClose}>
              取消
            </button>
            <button className="btn primary" onClick={start}>
              开始识别
            </button>
          </div>
          <p className="scan-hint">
            粘贴文字与本机识别都不联网上传图片，数据不出设备。本机识别首次使用需联网下载离线文字包（约 5MB），之后可离线。
          </p>
        </>
      )}

      {stage === 'consent' && (
        <>
          <p className="scan-consent-title">图片将发送到外部服务识别</p>
          <p className="scan-note">目标端点：{consentHost || '未配置'}</p>
          <ul className="scan-consent-list">
            <li>本项目没有自己的服务器，用的是你自己在设置里填写的端点与密钥</li>
            <li>图片只在内存里压缩后发送，不会保存到本机，也不会进入导出备份</li>
            <li>识别结果会先让你过一眼，绝不会自动记账</li>
          </ul>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              className="btn ghost"
              onClick={() => {
                pendingRef.current = null;
                setStage('source');
              }}
            >
              取消
            </button>
            <button className="btn primary" onClick={runConsented}>
              同意并识别
            </button>
          </div>
          <button className="scan-raw-toggle" onClick={() => setStage('source')}>
            改用粘贴文字（不联网）
          </button>
        </>
      )}

      {stage === 'busy' && (
        <div className="scan-busy">
          <span className="scan-spin" aria-hidden="true" />
          <p>{status}</p>
          <button
            className="btn ghost"
            onClick={() => {
              abortRef.current?.abort();
              setStage('source');
            }}
          >
            取消
          </button>
        </div>
      )}

      {stage === 'review' && result && (
        <>
          <div className={'scan-amount ' + type}>
            <span className="scan-cny">¥</span>
            <input
              className="scan-amount-input"
              inputMode="decimal"
              placeholder={needsPick ? '点下方候选，或手动输入' : '金额'}
              value={amount}
              aria-label="金额"
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
            />
          </div>
          {guess ? (
            needsPick ? (
              <div className="scan-cands">
                <p className="scan-note">
                  {guess.ambiguous
                    ? '金额有多个可能值（分数并列），请确认：'
                    : guess.candidates.length > 1
                      ? `置信度 ${Math.round(guess.confidence * 100)}%，请确认金额：`
                      : `置信度较低（${Math.round(guess.confidence * 100)}%），请核对：`}
                </p>
                {guess.candidates.map((c) => (
                  <button
                    key={c.value}
                    className={'chip' + (amount === String(c.value) ? ' active' : '')}
                    onClick={() => pickCandidate(c.value)}
                  >
                    ¥{c.value.toFixed(2)}
                    {c.anchor ? ` · ${c.anchor}` : ''}
                  </button>
                ))}
              </div>
            ) : (
              <p className="scan-note">
                依据「{guess.anchor || '页面上部数字'}」识别，置信度 {Math.round(guess.confidence * 100)}%，可直接改
              </p>
            )
          ) : (
            <p className="scan-note">没找到金额，手动填一下即可</p>
          )}

          <div className="seg scan-type">
            <button className={type === 'expense' ? 'active expense' : ''} onClick={() => switchType('expense')}>
              支出
            </button>
            <button className={type === 'income' ? 'active income' : ''} onClick={() => switchType('income')}>
              收入
            </button>
            <button className={type === 'transfer' ? 'active transfer' : ''} onClick={() => switchType('transfer')}>
              转账
            </button>
          </div>

          {type !== 'transfer' && (
            <div className="cat-grid scan-cats">
              {cats.map((c) => (
                <button
                  key={c.id}
                  className={'cat-chip' + (categoryId === c.id ? ' active' : '')}
                  onClick={() => {
                    setCategoryId(c.id);
                    setError('');
                  }}
                >
                  <span>
                    <LIcon emoji={c.emoji} size={21} />
                  </span>
                  {c.name}
                </button>
              ))}
              {cats.length === 0 && <p className="empty-text">暂无{type === 'income' ? '收入' : '支出'}分类</p>}
            </div>
          )}

          <div className="kp-meta">
            <button className="kp-meta-chip" onClick={() => setDateOpen(true)}>
              <span className="kp-meta-label">日期</span>
              {dateLabel}
            </button>
            {type !== 'transfer' && (
              <button className="kp-meta-chip" onClick={() => setAccOpen(true)}>
                <span className="kp-meta-label">账户</span>
                <span className="kp-meta-value">
                  {selectedAcc ? (
                    <>
                      <LIcon emoji={accountIcon(selectedAcc).icon} size={13} /> {selectedAcc.name}
                    </>
                  ) : (
                    '选择账户'
                  )}
                </span>
              </button>
            )}
          </div>

          <label className="field scan-field">
            <span>备注</span>
            <input value={note} placeholder="商户 / 说明" onChange={(e) => setNote(e.target.value)} />
          </label>

          <button className="scan-raw-toggle" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? '收起识别原文' : '查看识别原文'}
          </button>
          {showRaw && <pre className="scan-raw">{result.text}</pre>}

          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="btn ghost" onClick={() => setStage('source')}>
              重新识别
            </button>
            <button className="btn primary" onClick={confirm}>
              去记一笔
            </button>
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFile}
      />
      {dateOpen && (
        <DateEditModal
          date={date}
          onSave={(d) => {
            setDate(d);
            setDateOpen(false);
          }}
          onClose={() => setDateOpen(false)}
        />
      )}
      {accOpen && (
        <OptionPickerModal
          title="选择账户"
          options={selectable.map((a) => ({ id: a.id, label: a.name, emoji: accountIcon(a).icon }))}
          selectedId={accountId}
          onPick={(id) => {
            setAccountId(id);
            setAccOpen(false);
          }}
          onClose={() => setAccOpen(false)}
        />
      )}
    </Modal>
  );
}
