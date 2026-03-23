'use server';

import {
  createEmptySnapshot,
  isEmptySnapshot,
  type TrackerSnapshotPayload,
} from '@/features/tracker/model/persistence';
import type { TabState, TaskState } from '@/features/tracker/model/types';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export type BootstrapTrackerResult = {
  mode: 'local' | 'db';
  sourceKey: string;
  snapshot: TrackerSnapshotPayload;
};

export async function bootstrapTracker(localSnapshot: TrackerSnapshotPayload): Promise<BootstrapTrackerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('bootstrapTracker user:', user?.id);
  console.log('bootstrapTracker auth error:', Error);

  if (!user) {
    return {
      mode: 'local',
      sourceKey: 'local:guest',
      snapshot: localSnapshot,
    };
  }

  const existing = await prisma.trackerSnapshot.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return {
      mode: 'db',
      sourceKey: `db:${user.id}`,
      snapshot: {
        tabState: existing.tabState as TabState,
        taskState: existing.taskState as TaskState,
      },
    };
  }

  const snapshot = isEmptySnapshot(localSnapshot) ? createEmptySnapshot() : localSnapshot;

  await prisma.trackerSnapshot.create({
    data: {
      userId: user.id,
      tabState: snapshot.tabState,
      taskState: snapshot.taskState,
      migrationCompletedAt: new Date(),
    },
  });

  return {
    mode: 'db',
    sourceKey: `db:${user.id}`,
    snapshot,
  };
}

export async function saveTrackerSnapshot(snapshot: TrackerSnapshotPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: 'unauthorized' as const };
  }

  await prisma.trackerSnapshot.upsert({
    where: { userId: user.id },
    update: {
      tabState: snapshot.tabState,
      taskState: snapshot.taskState,
    },
    create: {
      userId: user.id,
      tabState: snapshot.tabState,
      taskState: snapshot.taskState,
      migrationCompletedAt: new Date(),
    },
  });

  return { ok: true as const };
}
