import { useMemo } from 'react';
import { Header, NormalizedSidebarGroup, SidebarItem } from 'shared/types';
import { useSidebarData } from '../../logic';
import { Link } from '../Link';
import styles from './index.module.scss';
import { usePageData, normalizeHref, withBase, isEqualPath } from '@/runtime';

interface GroupItem {
  text?: string;
  link?: string;
  headers?: Header[];
}

interface Group {
  name: string;
  items: GroupItem[];
}

// The sidebar data include two types: sidebar item and sidebar group.
// In overpage page, we select all the related sidebar groups and show the groups in the page.
// In the meantime, some sidebar items also should be shown in the page, we collect them in the group named 'Others' and show them in the page.
const DEFAULT_GROUP = 'Others';

export function Overview() {
  const {
    siteData,
    page: { routePath },
  } = usePageData();
  const { pages } = siteData;
  const overviewModules = pages.filter(
    page =>
      page.routePath.startsWith(routePath.replace(/overview$/, '')) &&
      page.routePath !== routePath,
  );
  const { items: overviewSidebarGroups } = useSidebarData() as {
    items: (NormalizedSidebarGroup | SidebarItem)[];
  };
  function normalizeSidebarItem(item: NormalizedSidebarGroup | SidebarItem) {
    const pageModule = overviewModules.find(m =>
      isEqualPath(m.routePath, withBase(item.link || '')),
    );
    const getChildLink = (
      traverseItem: SidebarItem | NormalizedSidebarGroup,
    ): string => {
      if (traverseItem.link) {
        return traverseItem.link;
      }
      if ('items' in traverseItem) {
        return getChildLink(traverseItem.items[0]);
      }
      return '';
    };
    const link = getChildLink(item);
    return {
      ...item,
      link,
      headers: pageModule?.toc?.filter(header => header.depth === 2) || [],
    };
  }
  const groups = useMemo(() => {
    const group = overviewSidebarGroups
      .filter(item => 'items' in item)
      .map(sidebarGroup => ({
        name: sidebarGroup.text || '',
        items: (sidebarGroup as NormalizedSidebarGroup).items
          .map(normalizeSidebarItem)
          .filter(Boolean),
      })) as Group[];
    const singleLinks = overviewSidebarGroups.filter(
      item => !('items' in item) && !isEqualPath(item.link || '', routePath),
    );
    return [
      ...group,
      ...(singleLinks.length > 0
        ? [
            {
              name: DEFAULT_GROUP,
              items: singleLinks.map(normalizeSidebarItem),
            },
          ]
        : []),
    ];
  }, [overviewSidebarGroups]);

  return (
    <div className="overview-index mx-auto px-8">
      <div className="flex items-center justify-between">
        <h1>Overview</h1>
      </div>

      {groups.map(group => (
        <div className="mb-16" key={group.name}>
          {/* If there is no sidebar group, we show the sidebar items directly and hide the group name */}
          {group.name === DEFAULT_GROUP && groups.length === 1 ? (
            <h2 style={{ paddingTop: 0 }}></h2>
          ) : (
            <h2>{group.name}</h2>
          )}

          <div className={styles.overviewGroups}>
            {group.items.map(item => (
              <div className={styles.overviewGroup} key={item.link}>
                <div className="flex">
                  <h3 style={{ marginBottom: 8 }}>
                    <Link href={normalizeHref(item.link)}>{item.text}</Link>
                  </h3>
                </div>
                <ul className="list-none">
                  {item.headers?.map(header => (
                    <li
                      key={header.id}
                      className={`${styles.overviewGroupLi} ${
                        styles[`level${header.depth}`]
                      } first:mt-2`}
                    >
                      <Link href={`${normalizeHref(item.link)}#${header.id}`}>
                        {header.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
