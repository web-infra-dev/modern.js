import React, { useEffect, useRef, useState } from 'react';
import { NormalizedSidebarGroup, SidebarItem } from 'shared/types';
import { matchRoutes, useNavigate } from 'react-router-dom';
import { routes } from 'virtual-routes';
import { Link } from '../Link';
import { isActive } from '../../logic';
import ArrowRight from '../../assets/arrow-right.svg';
import styles from './index.module.scss';
import { removeBase, normalizeHref } from '@/runtime';

interface Props {
  isSidebarOpen?: boolean;
  pathname: string;
  langRoutePrefix: string;
  sidebarData: (NormalizedSidebarGroup | SidebarItem)[];
}

const textEllipsisStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

interface SidebarItemProps {
  id: string;
  item: SidebarItem | NormalizedSidebarGroup;
  depth: number;
  activeMatcher: (link: string) => boolean;
  collapsed?: boolean;
  setSidebarData: React.Dispatch<
    React.SetStateAction<(NormalizedSidebarGroup | SidebarItem)[]>
  >;
  preloadLink: (link: string) => void;
}

export function SidebarItemComp(props: SidebarItemProps) {
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;
  const active = item.link && activeMatcher(item.link);
  if ('items' in item) {
    return (
      <SidebarGroupComp
        id={id}
        key={id}
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
          p="y-1 x-2"
          block="~"
          border="rounded-sm"
          font-medium="~"
          onMouseEnter={() => props.preloadLink(item.link)}
          className={active ? styles.menuItemActive : styles.menuItem}
          style={textEllipsisStyle}
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
  const transitionRef = useRef<any>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  const initialState = useRef((item as NormalizedSidebarGroup).collapsed);

  const active = item.link && activeMatcher(item.link);
  const { collapsed, collapsible = true } = item as NormalizedSidebarGroup;
  const collapsibleIcon = (
    <div
      cursor-pointer="~"
      style={{
        transition: 'transform 0.2s ease-out',
        transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
      }}
    >
      <ArrowRight />
    </div>
  );

  useEffect(() => {
    if (initialRender.current) {
      return;
    }

    if (!containerRef.current || !innerRef.current) {
      return;
    }

    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
    }

    const container = containerRef.current;
    const inner = innerRef.current;
    // We should add the margin-top(4px) of first item in list, which is a part of the height of the container
    const contentHeight = inner.clientHeight + 4;
    if (collapsed) {
      container.style.maxHeight = `${contentHeight}px`;
      container.style.transitionDuration = '0.5s';
      inner.style.opacity = '0';

      transitionRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.maxHeight = '0px';
        }
      }, 0);
    } else {
      container.style.maxHeight = `${contentHeight}px`;
      container.style.transitionDuration = '0.3s';
      inner.style.opacity = '1';

      transitionRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.removeProperty('max-height');
        }
      }, 300);
    }
  }, [collapsed]);

  useEffect(() => {
    initialRender.current = false;
  }, []);

  const toggleCollapse: React.MouseEventHandler<HTMLDivElement> = (e): void => {
    e.stopPropagation();
    // update collapsed state
    setSidebarData(sidebarData => {
      const newSidebarData = [...sidebarData];
      const indexes = id.split('-').map(Number);
      const initialIndex = indexes.shift()!;
      const root = newSidebarData[initialIndex];
      let current = root;
      for (const index of indexes) {
        current = (current as NormalizedSidebarGroup).items[index];
      }
      if ('items' in current) {
        current.collapsed = !current.collapsed;
      }
      return newSidebarData;
    });
  };

  return (
    <section key={id} block="~" className="mt-1">
      <div
        flex="~"
        justify="between"
        items-start="~"
        cursor={collapsible ? 'pointer' : 'none'}
        className={`items-center ${
          // eslint-disable-next-line no-nested-ternary
          active
            ? styles.menuItemActive
            : collapsible
            ? styles.menuItem
            : styles.menuItemStatic
        }`}
        onMouseEnter={() => item.link && props.preloadLink(item.link)}
        onClick={e => {
          if (item.link) {
            navigate(normalizeHref(item.link));
            collapsed && toggleCollapse(e);
          } else {
            collapsible && toggleCollapse(e);
          }
        }}
      >
        <h2 p="y-1 x-2 h-8" text="sm" font="semibold" style={textEllipsisStyle}>
          {item.text}
        </h2>
        {collapsible && (
          <div
            p="2"
            className={styles.collapseContainer}
            onClick={toggleCollapse}
          >
            {collapsibleIcon}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="transition-all duration-300 ease-in-out"
        style={{
          overflow: 'hidden',
          maxHeight: initialState.current ? 0 : undefined,
        }}
      >
        <div
          ref={innerRef}
          className="transition-opacity duration-500 ease-in-out"
          style={{
            opacity: initialState.current ? 0 : 1,
          }}
        >
          {(item as NormalizedSidebarGroup)?.items?.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} m="l-4">
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
    (SidebarItem | NormalizedSidebarGroup)[]
  >(rawSidebarData.filter(Boolean).flat());
  useEffect(() => {
    // 1. Update sidebarData when pathname changes
    // 2. For current active item, expand its parent group
    // Cache, Avoid redundant calculation
    const matchCache = new WeakMap<
      NormalizedSidebarGroup | SidebarItem,
      boolean
    >();
    const match = (item: NormalizedSidebarGroup | SidebarItem) => {
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
    const traverse = (item: NormalizedSidebarGroup | SidebarItem) => {
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
    <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
      <nav m="t-1">
        {sidebarData.map(
          (item: NormalizedSidebarGroup | SidebarItem, index: number) => (
            <SidebarItemComp
              id={String(index)}
              item={item}
              depth={0}
              activeMatcher={activeMatcher}
              // The siderbarData is stable, so it's safe to use index as key
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              collapsed={(item as NormalizedSidebarGroup).collapsed ?? true}
              setSidebarData={setSidebarData}
              preloadLink={preloadLink}
            />
          ),
        )}
      </nav>
    </aside>
  );
}
