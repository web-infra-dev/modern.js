import React, { ReactNode } from 'react';
import _ from 'lodash';
import { Flex } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import type { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import { Location, useLocation, useMatches } from '@modern-js/runtime/router';
import styles from './Breadcrumbs.module.scss';
import { Link } from './Link';

export type BreadcrumbProps = FlexProps & React.RefAttributes<HTMLDivElement>;

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
  const { location } = match;
  let breadcrumb = _.get(match, 'handle.breadcrumb') as unknown;
  if (_.isFunction(breadcrumb)) {
    breadcrumb = breadcrumb({ location });
  }
  if (!_.isObject(breadcrumb) || _.isNull(breadcrumb)) return null;
  if (!('title' in breadcrumb)) return null;
  if (!breadcrumb.title) return null;
  const ret: BreadcrumbItem = {
    id: match.id,
    title: breadcrumb.title as any,
    pathname: match.pathname,
  };
  if ('pathname' in breadcrumb && _.isString(breadcrumb.pathname)) {
    ret.pathname = breadcrumb.pathname;
  }
  return ret;
};

export const Breadcrumbs: React.FC<BreadcrumbProps> = props => {
  const elements: React.ReactElement[] = [];

  const matches = useMatches();
  const location = useLocation();
  const items: BreadcrumbItem[] = [];
  for (const match of matches) {
    const item = normalizeBreadcrumb({
      ...match,
      location,
    });
    item && items.push(item);
  }
  if (location.state && 'breadcrumb' in location.state) {
    const item = normalizeBreadcrumb({
      handle: location.state.breadcrumb,
      pathname: location.pathname,
      id: `external/${location.pathname}`,
      location,
    });
    item && items.push(item);
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
    <Flex align="center" height="8" gap="1" px="4" {...props}>
      {elements}
    </Flex>
  );
};
