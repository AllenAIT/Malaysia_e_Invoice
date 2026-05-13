import './globals.css';
import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { SeedLoader } from '@/components/SeedLoader';

export const metadata: Metadata = {
  title: 'MyInvois 掃描站 — 馬來西亞電子發票',
  description: 'Scan, collect, win — Malaysia e-Invoice companion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-dvh pb-16 md:pb-0">
        <SeedLoader />
        <Navigation />
        <main className="mx-auto max-w-5xl px-4 pb-6 pt-4">{children}</main>
      </body>
    </html>
  );
}
