import {
  NormalizedSidebarGroup,
  SidebarItem,
  NormalizedSidebar,
} from 'shared/types/default-theme';
import { useEffect, useState } from 'react';
import { useLocaleSiteData } from './useLocaleSiteData';
import { isEqualPath } from './utils';
import { useLocation, withBase } from '@/runtime';

interface SidebarData {
  // The group name for the sidebar
  group: string;
  items: (NormalizedSidebarGroup | SidebarItem)[];
}

export const getSidebarGroupData = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
) => {
  for (const name of Object.keys(sidebar)) {
    // Such as `/api/`，it will return all the sidebar group
    if (isEqualPath(withBase(name), currentPathname)) {
      return {
        group: 'Documentation',
        items: sidebar[name],
      };
    }
    // Such as `/guide/getting-started`, it will return the guide groups and the group name `Introduction`
    const result = sidebar[name].find(group => {
      const match = (item: NormalizedSidebarGroup | SidebarItem): boolean => {
        const equalFunc = () =>
          isEqualPath(withBase(item.link), currentPathname);
        if ('items' in item) {
          // If the current path is the same as the group link, return true
          if (equalFunc()) {
            return true;
          }
          return item.items.some(i => match(i));
        } else {
          return equalFunc();
        }
      };
      return match(group);
    });

    if (result) {
      const sidebarGroup = sidebar[name];
      return {
        group: result.text || '',
        items: sidebarGroup,
      };
    }
  }
  return {
    group: 'Documentation',
    items: [],
  };
};
export function useSidebarData(): SidebarData {
  const localeData = useLocaleSiteData();
  const sidebar = localeData.sidebar ?? {};
  const { pathname } = useLocation();
  const [sidebarData, setSidebarData] = useState<SidebarData>(
    getSidebarGroupData(sidebar, pathname),
  );
  useEffect(() => {
    const newSidebarData = getSidebarGroupData(sidebar, pathname);
    setSidebarData(newSidebarData);
  }, [pathname, sidebar]);

  return sidebarData;
}
