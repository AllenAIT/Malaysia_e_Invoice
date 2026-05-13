import Link from 'next/link';
import { Invoice } from '@/lib/db';
import { CategoryBadge } from './CategoryBadge';
import { formatRM, formatDate } from '@/lib/formatters';
import { lotteryCode } from '@/lib/lottery';

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const topCategories = Array.from(new Set(invoice.items.map(i => i.classificationCode))).slice(0, 3);
  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-zinc-900">{invoice.supplierName}</div>
          <div className="mt-0.5 text-[11px] text-zinc-500">
            {formatDate(invoice.issueDate)} · {invoice.documentCode || invoice.uuid.slice(0, 12)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold tracking-tight">{formatRM(invoice.totalIncludingTax)}</div>
          <div className="text-[10px] uppercase text-zinc-400">{invoice.currency}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {topCategories.map(c => (
            <CategoryBadge key={c} code={c} />
          ))}
        </div>
        <div className="font-mono text-[10px] text-zinc-400">{lotteryCode(invoice.uuid)}</div>
      </div>
    </Link>
  );
}
