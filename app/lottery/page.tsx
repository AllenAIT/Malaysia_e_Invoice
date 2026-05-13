'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LotteryDraw, Invoice } from '@/lib/db';
import { useState } from 'react';
import {
  checkInvoice,
  generateRiggedDraw,
  generateRandomDraw,
  lotteryCode,
  matchTypeLength,
  MatchResult,
} from '@/lib/lottery';
import { formatRM } from '@/lib/formatters';
import { WinAnimation } from '@/components/WinAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Link from 'next/link';

interface RowResult {
  invoice: Invoice;
  win: MatchResult | null;
}

export default function LotteryPage() {
  const draws = useLiveQuery(() => db.draws.orderBy('drawnAt').reverse().toArray(), [], []);
  const invoices = useLiveQuery(() => db.invoices.toArray(), [], []);

  const [running, setRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);
  const [winInfo, setWinInfo] = useState<{
    tier: string;
    amount: number;
    matchedNumber: string;
    invoiceCode: string;
    matchLength: number;
    supplierName: string;
  } | null>(null);

  if (!draws || !invoices) return null;
  const latest: LotteryDraw | undefined = draws[0];

  // Iterate newest first so Envisage (the seeded winner, 2024-08) comes LAST → suspense
  const checkOrder = [...invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  const newDraw = async (rig: boolean) => {
    const winner = checkOrder[checkOrder.length - 1] || invoices[0];
    const prizes = rig && winner
      ? generateRiggedDraw(winner.uuid, '特別獎')
      : generateRandomDraw();
    const draw: LotteryDraw = {
      period: new Date().toISOString().slice(0, 7),
      drawnAt: new Date().toISOString(),
      prizes,
    };
    await db.draws.add(draw);
    setResults([]);
  };

  const checkAll = async () => {
    if (!latest || running) return;
    setRunning(true);
    setResults([]);
    setCurrentIdx(0);

    for (let i = 0; i < checkOrder.length; i++) {
      setCurrentIdx(i);
      await sleep(550);
      const inv = checkOrder[i];
      const win = checkInvoice(inv, latest.prizes);
      setResults(prev => [...prev, { invoice: inv, win }]);

      if (win) {
        await sleep(150);
        setWinInfo({
          tier: win.tier,
          amount: win.amount,
          matchedNumber: win.matchedNumber,
          invoiceCode: lotteryCode(inv.uuid),
          matchLength: win.matchLength,
          supplierName: inv.supplierName,
        });
        // continue checking remaining quietly? Or stop. Taiwan-style: each invoice can win independently.
        // Stop on first win to keep animation focused; user can click again to continue.
        break;
      }
    }
    setRunning(false);
  };

  const totalWinAmount = results.reduce((s, r) => s + (r.win?.amount || 0), 0);

  return (
    <div className="space-y-5 pt-2">
      <header className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-300">本期獎號</div>
            <div className="text-sm text-white/80">{latest?.period || '尚未開獎'}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-white/60">獎金最高</div>
            <div className="text-xl font-bold text-amber-300">{formatRM(1_000_000)}</div>
          </div>
        </div>

        {latest && (
          <div className="mt-4 space-y-1.5">
            {latest.prizes.map(p => (
              <div key={p.tier} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex w-32 items-center gap-2">
                  <span className="rounded bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-900">{p.tier}</span>
                  <span className="text-[10px] text-white/60">
                    {matchTypeLength(p.matchType) === 8 ? '全中' : `末${matchTypeLength(p.matchType)}碼`}
                  </span>
                </div>
                <div className="flex-1 text-center font-mono text-base font-bold tracking-widest">
                  {p.number}
                </div>
                <div className="w-24 text-right text-xs text-white/70">{formatRM(p.amount)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => newDraw(false)} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30">
            🎲 隨機重新開獎
          </button>
          <button onClick={() => newDraw(true)} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-amber-300">
            🎯 Demo 模式（保證有人中）
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">對獎你的 {invoices.length} 張發票</h2>
            <p className="text-xs text-zinc-500">中獎才彈動畫，沒中靜悄悄</p>
          </div>
          <button
            onClick={checkAll}
            disabled={running || !latest || invoices.length === 0}
            className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white shadow disabled:opacity-50"
          >
            {running ? '對獎中...' : '開始對獎'}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {results.map(r => (
              <motion.div
                key={r.invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={clsx(
                  'flex items-center justify-between rounded-xl border p-3',
                  r.win ? 'border-amber-300 bg-amber-50' : 'border-zinc-200 bg-white'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.invoice.supplierName}</div>
                  <div className="font-mono text-xs text-zinc-500">{lotteryCode(r.invoice.uuid)}</div>
                </div>
                {r.win ? (
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-600">🎉 {r.win.tier}</div>
                    <div className="text-sm font-bold">{formatRM(r.win.amount)}</div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400">未中</div>
                )}
              </motion.div>
            ))}
            {running && currentIdx < checkOrder.length && results.length < checkOrder.length && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-dashed border-brand-300 bg-brand-50 p-3 text-center text-sm text-brand-700"
              >
                ⌛ 正在比對：<span className="font-medium">{checkOrder[currentIdx]?.supplierName}</span>
                <span className="ml-2 font-mono text-xs">{lotteryCode(checkOrder[currentIdx]?.uuid || '')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {totalWinAmount > 0 && !running && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-200 to-rose-200 p-3 text-center">
            <span className="text-xs text-zinc-700">累計獎金</span>
            <span className="ml-2 text-lg font-black text-rose-700">{formatRM(totalWinAmount)}</span>
          </div>
        )}

        {invoices.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            還沒有發票，<Link className="text-brand-600 underline" href="/scan">先去掃 →</Link>
          </div>
        )}
      </section>

      <WinAnimation
        open={!!winInfo}
        tier={winInfo?.tier || ''}
        amount={winInfo?.amount || 0}
        matchedNumber={winInfo?.matchedNumber || ''}
        invoiceCode={winInfo?.invoiceCode || ''}
        matchLength={winInfo?.matchLength || 0}
        supplierName={winInfo?.supplierName || ''}
        onClose={() => setWinInfo(null)}
      />
    </div>
  );
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
