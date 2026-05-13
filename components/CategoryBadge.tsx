import clsx from 'clsx';
import { getClassification } from '@/lib/classifications';

export function CategoryBadge({ code, size = 'sm' }: { code: string; size?: 'sm' | 'md' }) {
  const c = getClassification(code);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        c.color,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span>{c.icon}</span>
      <span>{c.label}</span>
      <span className="opacity-50">·{code}</span>
    </span>
  );
}
