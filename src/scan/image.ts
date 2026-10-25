import type { ScanImage } from './types';

/** 视觉模型看付款截图 1280px 足够；顺带解决 iOS 原图 3~5MB 直传超时，以及 HEIC 兼容 */
const MAX_EDGE = 1280;
/** base64 上限，超过就拒绝发送（约 4MB 原图） */
const MAX_B64 = 5.5 * 1024 * 1024;

export interface FileImageOptions {
  maxEdge?: number;
  quality?: number;
}

export async function fileToScanImage(file: File, opts: FileImageOptions = {}): Promise<ScanImage> {
  const maxEdge = opts.maxEdge ?? MAX_EDGE;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      const dataUrl = canvas.toDataURL('image/jpeg', opts.quality ?? 0.85);
      return finish(dataUrl, 'image/jpeg');
    }
    bitmap.close();
  } catch {
    /* createImageBitmap 不支持（HEIC / 旧内核）时退回原图直传 */
  }
  const dataUrl = await readAsDataURL(file);
  return finish(dataUrl, file.type || 'image/jpeg');
}

function finish(dataUrl: string, mime: string): ScanImage {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  if (!base64) throw new Error('图片读取失败，请换一张试试');
  if (base64.length > MAX_B64) throw new Error('图片过大，请先裁剪或压缩后再识别');
  return { base64, mime };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(new Error('图片读取失败，请换一张试试'));
    r.readAsDataURL(file);
  });
}
