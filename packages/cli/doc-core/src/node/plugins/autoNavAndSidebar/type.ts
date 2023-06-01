import { NavItem } from '@/shared/types';

export type NavMeta = NavItem[];

export type SideMetaItem =
  | string
  | {
      type: 'file' | 'dir';
      name: string;
      // Use the h1 title as the sidebar title by default
      label?: string;
      collapsible?: boolean;
      collapsed?: boolean;
    };

export type SideMeta = SideMetaItem[];
