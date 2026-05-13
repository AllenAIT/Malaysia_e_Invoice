'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { QRScanner } from '@/components/QRScanner';
import { OCRScanner } from '@/components/OCRScanner';
import { ManualEntry } from '@/components/ManualEntry';
import { parseMyInvoisQR } from '@/lib/parseMyInvois';
import { parseInvoiceText, ParsedOCR } from '@/lib/ocrParse';
import { db, Invoice } from '@/lib/db';
import { classifyByKeyword } from '@/lib/classifications';
import { useRouter } from 'next/navigation';

type Tab = 'qr' | 'ocr' | 'manual';

type QRResult = { type: 'qr'; data: ReturnType<typeof parseMyInvoisQR> & { rawPayload: string } };
type OCRResult = { type: 'ocr'; data: ParsedOCR };

export default function ScanPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('qr');
  const [result, setResult] = useState<QRResult | OCRResult | null>(null);

  const handleQR = (payload: string) => {
    const parsed = parseMyInvoisQR(payload);
    setResult({ type: 'qr', data: { ...parsed, rawPayload: payload } });
  };

  const handleOCR = (text: string) => {
    const parsed = parseInvoiceText(text);
    setResult({ type: 'ocr', data: parsed });
  };

  const saveQR = async () => {
    if (!result || result.type !== 'qr') return;
    const { uuid, validationUrl, rawPayload } = result.data;
    const inv: Invoice = {
      uuid,
      validationUrl,
      source: 'qr',
      supplierName: '掃描的發票（待補明細）',
      issueDate: new Date().toISOString(),
      scannedAt: new Date().toISOString(),
      currency: 'MYR',
      totalExcludingTax: 0,
      taxAmount: 0,
      totalIncludingTax: 0,
      items: [],
      rawQrPayload: rawPayload,
    };
    const id = await db.invoices.add(inv);
    router.push(`/invoices/${id}`);
  };

  const saveOCR = async () => {
    if (!result || result.type !== 'ocr') return;
    const d = result.data;
    const items = d.items.length > 0
      ? d.items
      : [{
          classificationCode: classifyByKeyword(d.supplierName || d.rawText),
          description: d.supplierName || '雜項',
          quantity: 1,
          unitPrice: d.totalExcludingTax || d.totalIncludingTax || 0,
          taxAmount: d.taxAmount || 0,
          totalIncludingTax: d.totalIncludingTax || 0,
        }];
    const inv: Invoice = {
      uuid: d.uuid || `OCR-${Date.now().toString(36).toUpperCase()}`,
      documentCode: d.documentCode,
      source: 'ocr',
      supplierName: d.supplierName || '未識別商家',
      supplierTIN: d.supplierTIN,
      supplierMSIC: d.supplierMSIC,
      buyerTIN: d.buyerTIN,
      issueDate: d.issueDate ? parseDateMY(d.issueDate) : new Date().toISOString(),
      scannedAt: new Date().toISOString(),
      currency: 'MYR',
      totalExcludingTax: d.totalExcludingTax || 0,
      taxAmount: d.taxAmount || 0,
      totalIncludingTax: d.totalIncludingTax || 0,
      paymentMode: d.paymentMode,
      items,
      rawOcrText: d.rawText,
    };
    const id = await db.invoices.add(inv);
    router.push(`/invoices/${id}`);
  };

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-xl font-bold tracking-tight">掃描發票</h1>
        <p className="mt-1 text-xs text-zinc-500">支援 MyInvois QR Code、紙本發票 OCR、手動輸入</p>
      </header>

      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {(['qr', 'ocr', 'manual'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(null); }}
            className={clsx(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
              tab === t ? 'bg-white text-zinc-900 shadow' : 'text-zinc-600'
            )}
          >
            {t === 'qr' ? '📱 QR 掃描' : t === 'ocr' ? '📷 OCR 拍照' : '✍️ 手動'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        {tab === 'qr' && !result && <QRScanner onScan={handleQR} />}
        {tab === 'ocr' && !result && <OCRScanner onResult={handleOCR} />}
        {tab === 'manual' && <ManualEntry />}

        {result?.type === 'qr' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              ✅ 掃描成功！
              {result.data.isMyInvois
                ? <div className="mt-1 text-xs">已識別為 MyInvois 官方驗證連結</div>
                : <div className="mt-1 text-xs text-emerald-800/80">非標準連結 — 將以原始內容作為 UUID</div>}
            </div>
            <Row label="Unique Identifier" value={result.data.uuid} mono />
            <Row label="Validation URL" value={result.data.validationUrl} mono small />
            <button onClick={saveQR} className="w-full rounded-lg bg-brand-500 py-2.5 font-medium text-white hover:bg-brand-600">
              儲存並進入詳情頁
            </button>
            <button onClick={() => setResult(null)} className="w-full rounded-lg bg-zinc-100 py-2 text-sm text-zinc-700">
              重新掃描
            </button>
          </div>
        )}

        {result?.type === 'ocr' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              ✅ OCR 完成，已抽取以下欄位（之後可在詳情頁編輯）
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Row label="Supplier" value={result.data.supplierName} />
              <Row label="UUID" value={result.data.uuid} mono />
              <Row label="Total" value={result.data.totalIncludingTax ? `RM ${result.data.totalIncludingTax}` : undefined} />
              <Row label="Tax" value={result.data.taxAmount ? `RM ${result.data.taxAmount}` : undefined} />
              <Row label="Date" value={result.data.issueDate} />
              <Row label="Payment" value={result.data.paymentMode} />
            </div>
            <details className="rounded-lg bg-zinc-50 p-2">
              <summary className="cursor-pointer text-xs text-zinc-500">原始 OCR 文字</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] text-zinc-600">{result.data.rawText}</pre>
            </details>
            <button onClick={saveOCR} className="w-full rounded-lg bg-brand-500 py-2.5 font-medium text-white hover:bg-brand-600">
              儲存發票
            </button>
            <button onClick={() => setResult(null)} className="w-full rounded-lg bg-zinc-100 py-2 text-sm text-zinc-700">
              重來
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, small }: { label: string; value?: string | number; mono?: boolean; small?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-zinc-500">{label}</div>
      <div className={clsx('break-all', mono && 'font-mono', small ? 'text-[11px]' : 'text-sm font-medium')}>
        {value || <span className="text-zinc-400">—</span>}
      </div>
    </div>
  );
}

function parseDateMY(s: string): string {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).toISOString();
  return new Date().toISOString();
}
