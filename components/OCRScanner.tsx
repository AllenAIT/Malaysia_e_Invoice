'use client';
import { useState } from 'react';

interface Props {
  onResult: (text: string, imageDataUrl: string) => void;
}

export function OCRScanner({ onResult }: Props) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    setProgress(0);
    setStatus('載入 OCR 引擎…');

    const dataUrl: string = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    setPreview(dataUrl);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status) setStatus(translateStatus(m.status));
          if (typeof m.progress === 'number') setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(dataUrl);
      await worker.terminate();
      setStatus('完成');
      onResult(data.text, dataUrl);
    } catch (err: any) {
      setError(err?.message || 'OCR 失敗');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <div className="cursor-pointer rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center hover:border-brand-400 hover:bg-brand-50/40">
          <div className="text-3xl">📷</div>
          <div className="mt-2 text-sm font-medium">點擊上傳發票圖 / 拍照</div>
          <div className="mt-1 text-xs text-zinc-500">支援 JPG、PNG。建議發票畫面清晰、文字水平。</div>
          <div className="mt-1 text-[10px] text-zinc-400">首次使用會下載英文 OCR 字庫約 2MB</div>
        </div>
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={busy} />
      </label>

      {preview && (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <img src={preview} alt="預覽" className="w-full max-h-96 object-contain bg-zinc-50" />
        </div>
      )}

      {busy && (
        <div className="rounded-xl bg-zinc-100 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{status}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
    </div>
  );
}

function translateStatus(s: string): string {
  const map: Record<string, string> = {
    'loading tesseract core': '載入 OCR 核心',
    'initializing tesseract': '初始化引擎',
    'loading language traineddata': '下載語言檔',
    'initializing api': '初始化 API',
    'recognizing text': '辨識文字中…',
    'done': '完成',
  };
  return map[s] || s;
}
