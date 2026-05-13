'use client';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { parseMyInvoisQR, ParsedQR } from '@/lib/parseMyInvois';

interface Props {
  onResult: (text: string, imageDataUrl: string, qr: ParsedQR | null) => void;
}

const HIDDEN_QR_ID = 'hidden-qr-from-ocr';

export function OCRScanner({ onResult }: Props) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pastedHint, setPastedHint] = useState(false);

  const processFile = async (file: File) => {
    setError(null);
    setBusy(true);
    setProgress(0);
    setStatus('載入引擎…');

    const dataUrl: string = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    setPreview(dataUrl);

    let qr: ParsedQR | null = null;
    try {
      setStatus('偵測 QR Code…');
      const qrMod = await import('html5-qrcode');
      const qrScanner = new qrMod.Html5Qrcode(HIDDEN_QR_ID);
      const qrText = await qrScanner.scanFile(file, false);
      await qrScanner.clear();
      qr = parseMyInvoisQR(qrText);
    } catch {
      // No QR in image — OCR will still run
    }

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
      onResult(data.text, dataUrl, qr);
    } catch (err: any) {
      setError(err?.message || 'OCR 失敗');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('請拖曳圖片檔案');
      return;
    }
    processFile(file);
  };

  // Listen for clipboard paste (Ctrl+V) anywhere on the page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (busy) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setPastedHint(true);
            processFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [busy]);

  return (
    <div className="space-y-3">
      <label
        className="block"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div
          className={clsx(
            'cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition',
            dragOver
              ? 'border-brand-500 bg-brand-50 scale-[1.01]'
              : 'border-zinc-300 bg-zinc-50 hover:border-brand-400 hover:bg-brand-50/40'
          )}
        >
          <div className="text-3xl">{dragOver ? '⬇️' : busy ? '⏳' : '📤'}</div>
          <div className="mt-2 text-sm font-medium">
            {dragOver ? '放開上傳' : '點擊上傳、拖曳檔案，或 Ctrl+V 貼上截圖'}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            同時偵測 QR Code + OCR 文字明細
          </div>
          <div className="mt-1 text-[10px] text-zinc-400">
            首次使用會下載英文 OCR 字庫約 2MB
          </div>
        </div>
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={busy} />
      </label>

      {pastedHint && !busy && !error && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          ✓ 偵測到剪貼簿圖片，已開始處理
        </div>
      )}

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

      <div className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800">
        💡 從電腦掃發票？把發票畫面截圖（Win+Shift+S）後直接 <kbd className="rounded bg-white px-1 font-mono">Ctrl+V</kbd> 貼到這裡即可，不用存檔。
      </div>

      <div id={HIDDEN_QR_ID} style={{ width: 0, height: 0, overflow: 'hidden' }} />
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
