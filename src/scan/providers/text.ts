import { analyzeText } from '../analyze';
import { normText } from '../normalize';
import type { ScanProvider } from '../types';

/** 零网络兜底路：账单详情页的文字长按选中即可复制，粘贴进来命中率反而是最高的一档 */
export const textProvider: ScanProvider = {
  id: 'text',
  label: '粘贴文字',
  needsKey: false,
  readsImage: false,
  uploadsImage: false,
  available: () => true,
  async run(q) {
    const t0 = Date.now();
    const n = normText(q.text ?? '');
    if (!n.lines.length) {
      return {
        ok: false,
        engine: 'text',
        text: '',
        error: '没有可识别的文字，请到账单详情页长按选中文字后复制',
        ms: Date.now() - t0,
      };
    }
    return analyzeText(n, 'text', t0);
  },
};
