'use client';
import { useEffect } from 'react';
import { seedIfEmpty } from '@/lib/seed';

export function SeedLoader() {
  useEffect(() => {
    seedIfEmpty().catch(console.error);
  }, []);
  return null;
}
