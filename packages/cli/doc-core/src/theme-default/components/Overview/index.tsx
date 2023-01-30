import { useMemo } from 'react';
import { Header, NormalizedSidebarGroup, SidebarItem } from 'shared/types';
import { useSidebarData } from '../../logic';
import { Link } from '../Link';
import { isEqualPath } from '../../logic/utils';
import styles from './index.module.scss';
import { usePageData, normalizeHref, withBase } from '@/runtime';

interface GroupItem {
  text?: string;
  link?: string;
  headers?: Header[];
}

interface Group {
  name: string;
  items: GroupItem[];
}

export function Overview() {
  const { routePath, siteData } = usePageData();
  const { pages } = siteData;
  const overviewModules = pages.filter(
    page =>
      page.routePath.startsWith(routePath.replace(/overview$/, '')) &&
      page.routePath !== routePath,
  );
  const { items: overviewSidebarGroups } = useSidebarData() as {
    items: (NormalizedSidebarGroup | SidebarItem)[];
  };
  const groups = useMemo(() => {
    return overviewSidebarGroups
      .filter(item => 'items' in item)
      .map(sidebarGroup => ({
        name: sidebarGroup.text || '',
        items: (sidebarGroup as NormalizedSidebarGroup).items.map(
          (item: NormalizedSidebarGroup | SidebarItem) => {
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
              headers:
                (pageModule?.toc as Header[])?.filter(
                  header => header.depth === 2,
                ) || [],
            };
          },
        ),
      })) as Group[];
  }, [overviewSidebarGroups]);

  return (
    <div className="overview-index" m="x-auto" p="x-8">
      <div flex="~" align-items-center="~" justify="between">
        <h1>Overview</h1>
      </div>

      {groups.map(group => (
        <div m="b-16" key={group.name}>
          <h2>{group.name}</h2>
          <div className={styles.overviewGroups}>
            {group.items.map(item => (
              <div className={styles.overviewGroup} key={item.link}>
                <div flex="~">
                  <h3 style={{ marginBottom: 8 }}>
                    <Link href={normalizeHref(item.link)}>{item.text}</Link>
                  </h3>
                </div>
                <ul list="none">
                  {item.headers?.map(header => (
                    <li
                      key={header.id}
                      m="first:t-2"
                      className={`${styles.overviewGroupLi} ${
                        styles[`level${header.depth}`]
                      }`}
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
