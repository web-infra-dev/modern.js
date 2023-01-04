import {
  NormalizedSidebar,
  NormalizedSidebarGroup,
  SidebarItem,
} from 'shared/types';
import { useLocation } from 'react-router-dom';
import { useLocaleSiteData } from './useLocaleSiteData';
import { isEqualPath } from './utils';

export function usePrevNextPage() {
  const { pathname } = useLocation();
  const localesData = useLocaleSiteData();
  const sidebar = localesData.sidebar || {};
  const flattenTitles: SidebarItem[] = [];

  const walkThroughSidebar = (sidebar: NormalizedSidebar) => {
    const walk = (sidebarItem: NormalizedSidebarGroup | SidebarItem) => {
      if ('items' in sidebarItem) {
        if (sidebarItem.link) {
          flattenTitles.push({
            text: sidebarItem.text,
            link: sidebarItem.link,
          });
        }
        sidebarItem.items.forEach(item => {
          walk(item);
        });
      } else {
        flattenTitles.push(sidebarItem);
      }
    };

    Object.values(sidebar).forEach(sidebarItem => {
      sidebarItem.forEach(item => {
        walk(item);
      });
    });
  };

  walkThroughSidebar(sidebar);

  const pageIndex = flattenTitles.findIndex(item =>
    isEqualPath(item.link, pathname),
  );

  const prevPage = flattenTitles[pageIndex - 1] || null;
  const nextPage = flattenTitles[pageIndex + 1] || null;

  return {
    prevPage,
    nextPage,
  };
}
