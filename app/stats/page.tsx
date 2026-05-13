'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMemo } from 'react';
import { getClassification } from '@/lib/classifications';
import { formatRM } from '@/lib/formatters';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';

const COLORS = ['#f97316', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export default function StatsPage() {
  const invoices = useLiveQuery(() => db.invoices.toArray(), [], []);

  const pieData = useMemo(() => {
    if (!invoices) return [];
    const byCat: Record<string, number> = {};
    for (const inv of invoices) {
      for (const it of inv.items) {
        byCat[it.classificationCode] = (byCat[it.classificationCode] || 0) + it.totalIncludingTax;
      }
    }
    return Object.entries(byCat)
      .map(([code, value]) => ({ code, name: getClassification(code).label, value }))
      .sort((a, b) => b.value - a.value);
  }, [invoices]);

  const barData = useMemo(() => {
    if (!invoices) return [];
    const byMonth: Record<string, number> = {};
    for (const inv of invoices) {
      const m = inv.issueDate.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + inv.totalIncludingTax;
    }
    return Object.entries(byMonth).sort().map(([month, amount]) => ({ month, amount }));
  }, [invoices]);

  if (!invoices) return null;

  const total = invoices.reduce((s, i) => s + i.totalIncludingTax, 0);
  const totalTax = invoices.reduce((s, i) => s + i.taxAmount, 0);

  return (
    <div className="space-y-5 pt-2">
      <header>
        <h1 className="text-xl font-bold tracking-tight">支出統計</h1>
        <p className="text-xs text-zinc-500">{invoices.length} 張發票 · 共 {formatRM(total)}</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="總支出" value={formatRM(total)} accent />
        <Stat label="已繳稅" value={formatRM(totalTax)} />
        <Stat label="平均單張" value={invoices.length ? formatRM(total / invoices.length) : 'RM 0'} />
      </div>

      {pieData.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">分類占比</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={42} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatRM(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {pieData.map((d, i) => (
              <div key={d.code} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{getClassification(d.code).icon} {d.name}</span>
                </div>
                <span className="font-medium">
                  {formatRM(d.value)} ({((d.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {barData.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">月份支出</h2>
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatRM(v)} />
                <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${accent ? 'bg-gradient-to-br from-brand-500 to-rose-500 text-white' : 'border border-zinc-200 bg-white'}`}>
      <div className={`text-[10px] uppercase tracking-widest ${accent ? 'text-white/80' : 'text-zinc-500'}`}>{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
