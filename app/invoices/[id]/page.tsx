'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { CategoryBadge } from '@/components/CategoryBadge';
import { formatRM, formatDateTime } from '@/lib/formatters';
import { lotteryCode } from '@/lib/lottery';
import Link from 'next/link';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const router = useRouter();
  const invoice = useLiveQuery(() => db.invoices.get(id), [id]);

  if (invoice === undefined) return <div className="pt-4 text-sm text-zinc-500">載入中...</div>;
  if (!invoice) {
    return (
      <div className="pt-4">
        找不到發票 <Link className="text-brand-600 underline" href="/invoices">返回列表</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm('確認刪除此發票？')) return;
    await db.invoices.delete(id);
    router.push('/invoices');
  };

  return (
    <div className="space-y-5 pt-2">
      <Link href="/invoices" className="text-xs text-zinc-500 hover:underline">← 返回列表</Link>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">E-Invoice</div>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">{invoice.supplierName}</h1>
            <div className="mt-1 text-xs text-zinc-500">
              {invoice.documentCode && <>Doc {invoice.documentCode} · </>}
              {formatDateTime(invoice.issueDate)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black tracking-tight">{formatRM(invoice.totalIncludingTax)}</div>
            <div className="text-[10px] uppercase text-zinc-400">含稅</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-4 text-white">
          <div className="text-[10px] uppercase tracking-widest text-white/60">抽獎代碼（UUID 末 8 碼）</div>
          <div className="mt-1 font-mono text-2xl font-black tracking-wider">{lotteryCode(invoice.uuid)}</div>
          <div className="mt-2 break-all font-mono text-[10px] text-white/50">{invoice.uuid}</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <Field label="來源" value={sourceLabel(invoice.source)} />
          <Field label="Supplier TIN" value={invoice.supplierTIN} mono />
          <Field label="MSIC" value={invoice.supplierMSIC} mono />
          {invoice.buyerName && <Field label="Buyer" value={invoice.buyerName} />}
          {invoice.buyerTIN && <Field label="Buyer TIN" value={invoice.buyerTIN} mono />}
          {invoice.paymentMode && <Field label="付款" value={invoice.paymentMode} />}
          {invoice.eInvoiceVersion && <Field label="版本" value={`v${invoice.eInvoiceVersion}`} />}
          {invoice.taxType && <Field label="稅別" value={`${invoice.taxType} ${invoice.taxRate ?? ''}${invoice.taxRate ? '%' : ''}`} />}
        </div>
      </section>

      {invoice.items.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">明細</h2>
          <div className="mt-3 divide-y divide-zinc-100">
            {invoice.items.map((it, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{it.description}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <CategoryBadge code={it.classificationCode} />
                    <span>× {it.quantity}</span>
                    <span>單價 {formatRM(it.unitPrice)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatRM(it.totalIncludingTax)}</div>
                  {it.taxAmount > 0 && <div className="text-[10px] text-zinc-400">稅 {formatRM(it.taxAmount)}</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-zinc-200 pt-3 text-sm">
            <Line label="小計" value={formatRM(invoice.totalExcludingTax)} />
            <Line label="稅額" value={formatRM(invoice.taxAmount)} />
            <Line label="總計" value={formatRM(invoice.totalIncludingTax)} bold />
          </div>
        </section>
      )}

      {invoice.validationUrl && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold">MyInvois 驗證連結</div>
          <a href={invoice.validationUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono text-[11px] text-brand-600 hover:underline">
            {invoice.validationUrl}
          </a>
        </section>
      )}

      {invoice.digitalSignature && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold">Digital Signature</div>
          <div className="mt-1 break-all font-mono text-[10px] text-zinc-500">{invoice.digitalSignature}</div>
        </section>
      )}

      <div className="flex gap-2">
        <Link href="/lottery" className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-center text-sm font-medium text-white">去對獎</Link>
        <button onClick={handleDelete} className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100">刪除</button>
      </div>
    </div>
  );
}

function sourceLabel(s: string) {
  const map: Record<string, string> = {
    qr: 'QR 掃描',
    'qr+ocr': 'QR + OCR',
    ocr: 'OCR',
    manual: '手動',
    consolidated: 'Consolidated',
  };
  return map[s] || s;
}

function Field({ label, value, mono }: { label: string; value?: string | number; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-zinc-400">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : 'font-medium'}`}>
        {value || <span className="text-zinc-300">—</span>}
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-base font-bold' : 'text-zinc-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
