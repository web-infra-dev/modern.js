import React, { ReactNode } from 'react';
import _ from 'lodash';
import { Flex } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import type { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import { Location, useLocation, useMatches } from '@modern-js/runtime/router';
import styles from './Breadcrumbs.module.scss';
import { Link } from './Link';

export type BreadcrumbProps = FlexProps & React.RefAttributes<HTMLDivElement>;

export interface BreadcrumbOptions {
  title: ReactNode;
  pathname?: string;
}

export type BreadcrumbUserOptions =
  | BreadcrumbOptions
  | BreadcrumbOptions[]
  | ((arg: { location: Location }) => BreadcrumbOptions | BreadcrumbOptions[]);

export interface BreadcrumbItem {
  id: string;
  title: ReactNode;
  pathname: string;
}

export interface BreadcrumbRouteMatch {
  id: string;
  pathname: string;
  handle: unknown;
  location: Location;
}

const normalizeBreadcrumb = (match: BreadcrumbRouteMatch) => {
  const { location, handle } = match;
  if (!_.isObject(handle) && _.isNil(handle)) return [];
  const { breadcrumb: opts } = handle as any;
  const raw: object[] = [];
  if (_.isFunction(opts)) {
    raw.push(..._.castArray(opts({ location })));
  } else {
    raw.push(..._.castArray(opts));
  }

  const ret: BreadcrumbItem[] = [];
  for (const item of raw) {
    if (!_.isObject(item) || _.isNull(item)) continue;
    if (!('title' in item)) continue;
    const breadcrumb: BreadcrumbItem = {
      id: match.id,
      title: item.title as any,
      pathname: match.pathname,
    };
    if ('pathname' in item && _.isString(item.pathname)) {
      breadcrumb.pathname = item.pathname;
    }
    ret.push(breadcrumb);
  }
  return ret;
};

export const Breadcrumbs: React.FC<BreadcrumbProps> = props => {
  const elements: React.ReactElement[] = [];

  const matches = useMatches();
  const location = useLocation();
  const items: BreadcrumbItem[] = [];
  for (const match of matches) {
    items.push(
      ...normalizeBreadcrumb({
        ...match,
        location,
      }),
    );
  }
  if (location.state && 'breadcrumb' in location.state) {
    items.push(
      ...normalizeBreadcrumb({
        handle: location.state.breadcrumb,
        pathname: location.pathname,
        id: `external/${location.pathname}`,
        location,
      }),
    );
  }

  for (const [i, item] of Object.entries(items)) {
    const keyParts = [item.id, item.pathname, i];
    elements.push(
      <Link key={keyParts.join('_')} color="gray" size="2" to={item.pathname}>
        {item.title}
      </Link>,
    );
    if (item !== items.at(-1)) {
      keyParts.push('#connector');
      elements.push(
        <ChevronRightIcon
          key={keyParts.join('_')}
          className={styles.connector}
        />,
      );
    }
  }
  return (
    <Flex align="center" height="var(--space-8)" gap="1" px="4" {...props}>
      {elements}
    </Flex>
  );
};
