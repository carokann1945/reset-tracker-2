'use server';

import {
  createEmptySnapshot,
  isEmptySnapshot,
  type TrackerSnapshotPayload,
} from '@/features/tracker/model/persistence';
import type { TabState, TaskState } from '@/features/tracker/model/types';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export type BootstrapTrackerResult = {
  mode: 'local' | 'db';
  snapshot: TrackerSnapshotPayload;
};

// 같은 변환 로직을 여러 군데서 반복하지 않게 분리
function toSnapshotPayload(record: { tabState: unknown; taskState: unknown }): TrackerSnapshotPayload {
  return {
    tabState: record.tabState as TabState,
    taskState: record.taskState as TaskState,
  };
}

// 경쟁 상태에서 동시에 create() 하면 늦은 쪽이 P2002를 받게 됨
function isTrackerSnapshotUserIdConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes('userId')
  );
}

export async function bootstrapTracker(localSnapshot: TrackerSnapshotPayload): Promise<BootstrapTrackerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      mode: 'local',
      snapshot: localSnapshot,
    };
  }

  const existing = await prisma.trackerSnapshot.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return {
      mode: 'db',
      snapshot: toSnapshotPayload(existing),
    };
  }

  const snapshot = isEmptySnapshot(localSnapshot) ? createEmptySnapshot() : localSnapshot;

  try {
    const created = await prisma.trackerSnapshot.create({
      data: {
        userId: user.id,
        tabState: snapshot.tabState,
        taskState: snapshot.taskState,
      },
    });

    return {
      mode: 'db',
      snapshot: toSnapshotPayload(created),
    };
  } catch (error) {
    if (!isTrackerSnapshotUserIdConflict(error)) {
      throw error;
    }

    const raced = await prisma.trackerSnapshot.findUnique({
      where: { userId: user.id },
    });

    if (!raced) {
      throw error;
    }

    return {
      mode: 'db',
      snapshot: toSnapshotPayload(raced),
    };
  }
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
    },
  });

  return { ok: true as const };
}
