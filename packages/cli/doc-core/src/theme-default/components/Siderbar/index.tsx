import React, { useEffect, useRef, useState } from 'react';
import { SidebarGroup, SidebarItem } from 'shared/types';
import { matchRoutes, useNavigate } from 'react-router-dom';
import { routes } from 'virtual-routes';
import { Link } from '../Link';
import { isActive } from '../../logic';
import styles from './index.module.scss';
import { removeBase, normalizeHref } from '@/runtime';

interface Props {
  isSidebarOpen?: boolean;
  pathname: string;
  langRoutePrefix: string;
  sidebarData: (SidebarGroup | SidebarItem)[];
}

const SINGLE_MENU_ITEM_HEIGHT = 32;
const MENU_ITEM_MARGIN = 4;
const singleItemHeight = SINGLE_MENU_ITEM_HEIGHT + MENU_ITEM_MARGIN;

interface SidebarItemProps {
  id: string;
  item: SidebarItem | SidebarGroup;
  depth: number;
  activeMatcher: (link: string) => boolean;
  collapsed?: boolean;
  setSidebarData: React.Dispatch<
    React.SetStateAction<(SidebarGroup | SidebarItem)[]>
  >;
  preloadLink: (link: string) => void;
}

// Notice: we must compute the height of children here, otherwise the animation of collapse will not work
const getHeight = (item: SidebarGroup | SidebarItem): number => {
  if ('items' in item) {
    return item.collapsed
      ? singleItemHeight
      : singleItemHeight +
          item.items.reduce((acc, item) => {
            return acc + getHeight(item);
          }, 0);
  } else {
    return singleItemHeight;
  }
};

export function SidebarItemComp(props: SidebarItemProps) {
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;
  const active = item.link && activeMatcher(item.link);
  if ('items' in item) {
    return (
      <SidebarGroupComp
        id={id}
        key={item.text}
        item={item}
        depth={depth}
        activeMatcher={activeMatcher}
        collapsed={item.collapsed}
        setSidebarData={setSidebarData}
        preloadLink={props.preloadLink}
      />
    );
  } else {
    return (
      <Link href={normalizeHref(item.link)} className={styles.menuLink}>
        <div
          m="t-1"
          p="y-1.5 x-2"
          block="~"
          text="sm"
          rounded="sm"
          font-medium="~"
          onMouseEnter={() => props.preloadLink(item.link)}
          className={active ? styles.menuItemActive : styles.menuItem}
        >
          {item.text}
        </div>
      </Link>
    );
  }
}

export function SidebarGroupComp(props: SidebarItemProps) {
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const active = item.link && activeMatcher(item.link);
  const { collapsed } = item as SidebarGroup;
  const collapsibleIcon = (
    <div
      className="i-carbon-chevron-right"
      cursor-pointer="~"
      style={{
        transition: 'transform 0.2s ease-out',
        transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
      }}
    ></div>
  );

  const toggleCollapse = (): void => {
    // update collapsed state
    setSidebarData(sidebarData => {
      const newSidebarData = [...sidebarData];
      const indexes = id.split('-').map(Number);
      const initialIndex = indexes.shift()!;
      const root = newSidebarData[initialIndex];
      let current = root;
      for (const index of indexes) {
        current = (current as SidebarGroup).items[index];
      }
      if ('items' in current) {
        current.collapsed = !current.collapsed;
      }
      return newSidebarData;
    });

    if (item.link) {
      item.link && navigate(normalizeHref(item.link));
    }
  };

  return (
    <section key={item.text} block="~">
      <div
        m="t-1"
        p="r-1"
        flex="~"
        justify="between"
        items-start="~"
        cursor-pointer="~"
        className={`items-center ${
          active ? styles.menuItemActive : styles.menuItem
        }`}
        onMouseEnter={() => item.link && props.preloadLink(item.link)}
        onClick={toggleCollapse}
      >
        <h2 p="y-1.5 x-2" text="sm" font="semibold">
          {item.text}
        </h2>
        {collapsibleIcon}
      </div>
      <div
        ref={containerRef}
        style={{
          transition: 'height 0.2s ease-in-out',
          overflow: 'hidden',
          height: collapsed ? '0px' : `${getHeight(item) - singleItemHeight}px`,
        }}
      >
        {(item as SidebarGroup)?.items?.map((item, index) => (
          <div key={item.link} mb="last:0.5" ml="4">
            <SidebarItemComp
              {...props}
              item={item}
              depth={depth + 1}
              id={`${id}-${index}`}
              preloadLink={props.preloadLink}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SideBar(props: Props) {
  const {
    isSidebarOpen,
    langRoutePrefix,
    pathname,
    sidebarData: rawSidebarData,
  } = props;
  const [sidebarData, setSidebarData] = useState<
    (SidebarItem | SidebarGroup)[]
  >(rawSidebarData.filter(Boolean).flat());
  useEffect(() => {
    // 1. Update sidebarData when pathname changes
    // 2. For current active item, expand its parent group
    // Cache, Avoid redundant calculation
    const matchCache = new WeakMap<SidebarGroup | SidebarItem, boolean>();
    const match = (item: SidebarGroup | SidebarItem) => {
      if (matchCache.has(item)) {
        return matchCache.get(item);
      }
      if (item.link && activeMatcher(item.link)) {
        matchCache.set(item, true);
        return true;
      }
      if ('items' in item) {
        const result = item.items.some(child => match(child));
        if (result) {
          matchCache.set(item, true);
          return true;
        }
      }
      matchCache.set(item, false);
      return false;
    };
    const traverse = (item: SidebarGroup | SidebarItem) => {
      if ('items' in item) {
        item.items.forEach(traverse);
        if (match(item)) {
          item.collapsed = false;
        }
      }
    };
    sidebarData.forEach(traverse);
    setSidebarData(rawSidebarData.filter(Boolean).flat());
  }, [props.sidebarData]);

  const removeLangPrefix = (path: string) => {
    return path.replace(langRoutePrefix, '');
  };
  const activeMatcher = (path: string) =>
    isActive(
      removeBase(removeLangPrefix(pathname)),
      removeLangPrefix(path),
      true,
    );
  const preloadLink = (link: string) => {
    const match = matchRoutes(routes, link);
    if (match?.length) {
      const { route } = match[0];
      route.preload();
    }
  };
  return (
    <aside
      className={`${styles.sidebar} ${
        isSidebarOpen ? styles.open : ''
      } divider-right`}
    >
      <nav>
        {sidebarData.map((item: SidebarGroup | SidebarItem, index: number) => (
          <SidebarItemComp
            id={String(index)}
            item={item}
            depth={0}
            activeMatcher={activeMatcher}
            key={item.text}
            collapsed={(item as SidebarGroup).collapsed ?? true}
            setSidebarData={setSidebarData}
            preloadLink={preloadLink}
          />
        ))}
      </nav>
    </aside>
  );
}
