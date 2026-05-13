'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/scan', label: '掃描', icon: '📷' },
  { href: '/invoices', label: '發票', icon: '📄' },
  { href: '/lottery', label: '兌獎', icon: '🎰' },
  { href: '/stats', label: '統計', icon: '📊' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Navigation() {
  const pathname = usePathname();
  return (
    <>
      <header className="hidden md:block sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-rose-500 text-base font-bold text-white shadow-md">M</div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">MyInvois 掃描站</div>
              <div className="text-[10px] uppercase text-zinc-500">Malaysia e-Invoice Companion</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(l => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                    active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  <span className="mr-1">{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur-md">
        <ul className="grid grid-cols-5">
          {links.map(l => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={clsx(
                    'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                    active ? 'text-brand-600' : 'text-zinc-500'
                  )}
                >
                  <span className="text-lg">{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
