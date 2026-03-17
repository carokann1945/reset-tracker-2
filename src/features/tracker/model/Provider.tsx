'use client';

import { useEffect } from 'react';
import { useTabStore } from './tabStore';

export default function Provider({ children }: { children: React.ReactNode }) {
  const hydrate = useTabStore((store) => store.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}
