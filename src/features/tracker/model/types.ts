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
