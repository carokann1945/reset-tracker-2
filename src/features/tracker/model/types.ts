// tab 타입
export type Tab = {
  id: string;
  name: string;
  position: number;
};

export type TabState = {
  version: 1;
  tabs: Tab[];
  activeTabId: string | null;
};

// task 타입
export type SimpleTask = {
  id: string;
  tabId: string;
  kind: 'simple';
  title: string;
  note?: string;
  checks: [boolean];
  completedAt?: string;
  position: number;
  updatedAt: string;
};

export type RepeatTask = {
  id: string;
  tabId: string;
  kind: 'repeat';
  title: string;
  note?: string;
  timezone: string;
  startAnchor: string;
  // 인터벌 설정 (프리셋 + 커스텀)
  intervalPreset: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customIntervalDays?: number;
  // 한 사이클당 체크할 횟수 선택, 체크 여부 기록, 완료 시점 기록
  targetCount: number;
  checks: boolean[];
  completedAt?: string;
  // 현재 체크들이 속한 "주기(cycle)" 인덱스 (자동 리셋용)
  lastCycle: number;
  position: number;
  updatedAt: string;
};

export type Task = SimpleTask | RepeatTask;

export type TaskState = {
  version: 1;
  tasks: Task[];
};

// 폼에서 입력중인 상태를 담는 임시 타입. id, createdAt, 이런 폼에서 입력할 수 없는건 빠져있음
export type TaskDraft =
  | {
      kind: 'simple';
      title: string;
      note?: string;
    }
  | {
      kind: 'repeat';
      title: string;
      note?: string;
      timezone: string;
      startAnchor: string;
      intervalPreset: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
      customIntervalDays?: number;
      targetCount: number;
    };
