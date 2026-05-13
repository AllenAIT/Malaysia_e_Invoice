'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useState, useMemo } from 'react';
import { InvoiceCard } from '@/components/InvoiceCard';
import { getClassification } from '@/lib/classifications';
import clsx from 'clsx';

export default function InvoicesPage() {
  const invoices = useLiveQuery(() => db.invoices.orderBy('issueDate').reverse().toArray(), [], []);
  const [filterCode, setFilterCode] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const usedCategories = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invoices || []) for (const it of inv.items) set.add(it.classificationCode);
    return Array.from(set).sort();
  }, [invoices]);

  const filtered = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      if (filterCode && !inv.items.some(it => it.classificationCode === filterCode)) return false;
      if (search) {
        const s = search.toLowerCase();
        const text = `${inv.supplierName} ${inv.uuid} ${inv.documentCode || ''} ${inv.items.map(i => i.description).join(' ')}`.toLowerCase();
        if (!text.includes(s)) return false;
      }
      return true;
    });
  }, [invoices, filterCode, search]);

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-xl font-bold tracking-tight">發票收藏</h1>
        <p className="text-xs text-zinc-500">{invoices?.length ?? 0} 張總計</p>
      </header>

      <input
        type="search"
        placeholder="搜尋商家、UUID、品項..."
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={!filterCode} onClick={() => setFilterCode(null)}>全部</Chip>
        {usedCategories.map(code => {
          const c = getClassification(code);
          return (
            <Chip key={code} active={filterCode === code} onClick={() => setFilterCode(filterCode === code ? null : code)}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </Chip>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            沒有符合條件的發票
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition',
        active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      )}
    >
      {children}
    </button>
  );
}
