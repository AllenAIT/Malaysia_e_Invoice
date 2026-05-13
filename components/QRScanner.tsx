'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan: (payload: string) => void;
}

const READER_ID = 'qr-reader';
const FILE_READER_ID = 'qr-file-reader';

export function QRScanner({ onScan }: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  const stop = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}
    setRunning(false);
  };

  const start = async () => {
    setError(null);
    try {
      const mod = await import('html5-qrcode');
      const scanner = new mod.Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text: string) => {
          onScan(text);
          stop();
        },
        () => {}
      );
      setRunning(true);
    } catch (e: any) {
      setError(e?.message || '無法開啟相機，請確認權限或使用上傳檔案。');
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    try {
      const mod = await import('html5-qrcode');
      const scanner = new mod.Html5Qrcode(FILE_READER_ID);
      const text = await scanner.scanFile(file, false);
      await scanner.clear();
      onScan(text);
    } catch {
      setFileError('未在圖中偵測到 QR Code');
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div id={READER_ID} className="overflow-hidden rounded-xl bg-zinc-900 aspect-video" />

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        {!running ? (
          <button onClick={start} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            開始掃描
          </button>
        ) : (
          <button onClick={stop} className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300">
            停止
          </button>
        )}

        <label className="cursor-pointer rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200">
          📁 從圖片掃 QR
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>

        {fileError && <span className="text-xs text-red-600">{fileError}</span>}
      </div>

      <div id={FILE_READER_ID} style={{ width: 0, height: 0, overflow: 'hidden' }} />

      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500">
        提示：MyInvois 的 QR 是驗證連結 (
        <span className="font-mono">myinvois.hasil.gov.my/...</span>
        )，掃描後會得到 Unique Identifier No，再到下一步補完明細。
      </div>
    </div>
  );
}
