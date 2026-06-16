'use client';

import React from 'react';
import { LiffProvider } from '@/lib/liffContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LiffProvider>{children}</LiffProvider>;
}
