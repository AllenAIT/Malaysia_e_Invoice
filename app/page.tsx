'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatRM } from '@/lib/formatters';
import { InvoiceCard } from '@/components/InvoiceCard';
import { getClassification } from '@/lib/classifications';
import { resetToDemo } from '@/lib/seed';

export default function Home() {
  const invoices = useLiveQuery(() => db.invoices.orderBy('issueDate').reverse().toArray(), [], []);
  const draws = useLiveQuery(() => db.draws.orderBy('drawnAt').reverse().toArray(), [], []);

  if (invoices === undefined || draws === undefined) return null;

  const monthTotal = invoices.reduce((sum, i) => sum + i.totalIncludingTax, 0);
  const latestDraw = draws[0];

  const byCategory: Record<string, number> = {};
  for (const inv of invoices) {
    for (const it of inv.items) {
      byCategory[it.classificationCode] = (byCategory[it.classificationCode] || 0) + it.totalIncludingTax;
    }
  }
  const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6 pt-2">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-rose-500 to-pink-600 p-6 text-white shadow-lg">
        <div className="text-xs uppercase tracking-widest text-white/80">蒐集合計</div>
        <div className="mt-2 text-4xl font-black tracking-tight">{formatRM(monthTotal)}</div>
        <div className="mt-1 text-sm text-white/90">{invoices.length} 張發票已蒐集</div>
        <div className="mt-4 flex gap-2">
          <Link href="/scan" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow">
            📷 掃發票
          </Link>
          <Link href="/lottery" className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            🎰 立即對獎
          </Link>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-12 bottom-0 h-32 w-32 rounded-full bg-white/10" />
      </section>

      {latestDraw && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">本期獎號（{latestDraw.period}）</div>
            <Link href="/lottery" className="text-xs text-brand-600 hover:underline">完整獎號 →</Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {latestDraw.prizes.slice(0, 4).map(p => (
              <div key={p.tier} className="rounded-lg bg-zinc-50 p-2">
                <div className="text-[10px] text-zinc-500">{p.tier}</div>
                <div className="font-mono text-sm font-bold tracking-wider">{p.number}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topCats.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">分類支出</h2>
            <Link href="/stats" className="text-xs text-brand-600 hover:underline">詳細統計 →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {topCats.map(([code, total]) => {
              const c = getClassification(code);
              return (
                <div key={code} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="text-2xl">{c.icon}</div>
                  <div className="mt-1 text-xs font-medium text-zinc-600">{c.label}</div>
                  <div className="mt-0.5 text-sm font-bold">{formatRM(total)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">最近的發票</h2>
          <Link href="/invoices" className="text-xs text-brand-600 hover:underline">全部 →</Link>
        </div>
        <div className="space-y-2">
          {invoices.slice(0, 4).map(inv => (
            <InvoiceCard key={inv.id} invoice={inv} />
          ))}
          {invoices.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              還沒有發票，
              <Link href="/scan" className="font-medium text-brand-600">開始掃描 →</Link>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold">重置示範資料</div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              清空所有發票與獎號，只留一張保證中特別獎的 Envisage Telco 示範發票。
            </p>
          </div>
          <button
            onClick={async () => {
              if (!confirm('將清空所有發票（含你掃過的），只保留一張示範發票。確定？')) return;
              await resetToDemo();
              alert('已重置 — 現在只有 Envisage Telco 一張示範發票');
            }}
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            🔄 重置
          </button>
        </div>
      </section>
    </div>
  );
}
