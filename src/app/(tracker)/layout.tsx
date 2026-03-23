import React from 'react';
import TrackerPersistenceProvider from '@/features/tracker/model/TrackerPersistenceProvider';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <TrackerPersistenceProvider>{children}</TrackerPersistenceProvider>;
}
