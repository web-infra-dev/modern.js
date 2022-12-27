import { useState } from 'react';
import { Header, SidebarGroup, SidebarItem } from 'shared/types';
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
  const { subModules: overviewPageModules = [] } = usePageData();
  const { items: overviewSidebarGroups } = useSidebarData() as {
    items: (SidebarGroup | SidebarItem)[];
  };
  const initialGroups: Group[] = overviewSidebarGroups
    .filter(item => 'items' in item)
    .map(sidebarGroup => ({
      name: sidebarGroup.text || '',
      items: (sidebarGroup as SidebarGroup).items.map(
        (item: SidebarGroup | SidebarItem) => {
          const pageModule = overviewPageModules.find(m =>
            isEqualPath(m.routePath as string, withBase(item.link || '')),
          );
          const getChildLink = (
            traverseItem: SidebarItem | SidebarGroup,
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

  const [groups] = useState(initialGroups);

  return (
    <div className="overview-index max-w-712px" m="x-auto" p="y-8 x-8">
      <div flex="" items-center="" justify="between">
        <h1>Overview</h1>
      </div>

      {groups.map(group => (
        <div mb="16" key={group.name}>
          <h2>{group.name}</h2>
          <div className={styles.overviewGroups}>
            {group.items.map(item => (
              <div className={styles.overviewGroup} key={item.link}>
                <div flex="center">
                  <h3 style={{ marginBottom: 0 }}>
                    <Link href={normalizeHref(item.link)}>{item.text}</Link>
                  </h3>
                </div>
                <ul list="none">
                  {item.headers?.map(header => (
                    <li
                      key={header.id}
                      mt="first:2"
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
