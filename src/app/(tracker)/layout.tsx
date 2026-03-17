import Provider from '@/features/tracker/model/Provider';
import React from 'react';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
