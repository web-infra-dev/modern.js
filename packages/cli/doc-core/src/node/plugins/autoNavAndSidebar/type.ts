import { NavItem } from '@/shared/types';

export type NavMeta = NavItem[];

export type SideMetaItem =
  | string
  | {
      type: 'file' | 'dir' | 'custom-link';
      name: string;
      link?: string;
      // Use the h1 title as the sidebar title by default
      label?: string;
      collapsible?: boolean;
      collapsed?: boolean;
    };

export type SideMeta = SideMetaItem[];
