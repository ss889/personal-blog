'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function ScrollAnimationProvider({ children }: { children: React.ReactNode }) {
  useScrollAnimation();
  return <>{children}</>;
}
