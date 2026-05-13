import { Invoice, LotteryPrize, MatchType } from './db';

export const PRIZE_TIERS: { tier: string; matchType: MatchType; amount: number }[] = [
  { tier: '特別獎', matchType: 'exact',   amount: 1_000_000 },
  { tier: '特獎',   matchType: 'exact',   amount: 200_000 },
  { tier: '頭獎',   matchType: 'exact',   amount: 20_000 },
  { tier: '二獎',   matchType: 'suffix7', amount: 4_000 },
  { tier: '三獎',   matchType: 'suffix6', amount: 1_000 },
  { tier: '四獎',   matchType: 'suffix5', amount: 400 },
  { tier: '五獎',   matchType: 'suffix4', amount: 100 },
  { tier: '六獎',   matchType: 'suffix3', amount: 20 },
];

export function lotteryCode(uuid: string): string {
  return uuid.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-8);
}

export function matchTypeLength(t: MatchType): number {
  return t === 'exact' ? 8
       : t === 'suffix7' ? 7
       : t === 'suffix6' ? 6
       : t === 'suffix5' ? 5
       : t === 'suffix4' ? 4
       : 3;
}

export interface MatchResult {
  tier: string;
  amount: number;
  matchedNumber: string;
  matchLength: number;
}

export function checkInvoice(invoice: Invoice, prizes: LotteryPrize[]): MatchResult | null {
  const code = lotteryCode(invoice.uuid);
  for (const p of prizes) {
    const n = matchTypeLength(p.matchType);
    const target = p.number.toUpperCase().slice(-n);
    if (code.slice(-n) === target) {
      return { tier: p.tier, amount: p.amount, matchedNumber: p.number, matchLength: n };
    }
  }
  return null;
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function randomCode(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

export function generateRandomDraw(): LotteryPrize[] {
  return PRIZE_TIERS.map(t => ({
    tier: t.tier,
    matchType: t.matchType,
    number: randomCode(matchTypeLength(t.matchType)),
    amount: t.amount,
  }));
}

export function generateRiggedDraw(winnerUuid: string, winningTier: string = '特別獎'): LotteryPrize[] {
  const winnerCode = lotteryCode(winnerUuid);
  return PRIZE_TIERS.map(t => {
    const n = matchTypeLength(t.matchType);
    if (t.tier === winningTier) {
      return {
        tier: t.tier,
        matchType: t.matchType,
        number: t.matchType === 'exact' ? winnerCode : winnerCode.slice(-n),
        amount: t.amount,
      };
    }
    let candidate;
    do {
      candidate = randomCode(n);
    } while (winnerCode.slice(-n) === candidate);
    return {
      tier: t.tier,
      matchType: t.matchType,
      number: candidate,
      amount: t.amount,
    };
  });
}
