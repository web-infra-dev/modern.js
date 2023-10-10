import React, { ReactNode } from 'react';
import _ from 'lodash';
import { Flex } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import type { ButtonProps } from '@radix-ui/themes/dist/cjs/components/button';
import { useMatches } from '@modern-js/runtime/router';
import styles from './Breadcrumbs.module.scss';
import { Link } from './Link';

export type BreadcrumbButtonProps = ButtonProps &
  React.RefAttributes<HTMLButtonElement>;

export const Breadcrumbs: React.FC = () => {
  const elements: React.ReactElement[] = [];
  const items: { pathname: string; title: ReactNode; id: string }[] = [];

  for (const match of useMatches()) {
    const raw: unknown = _.get(match, 'handle.breadcrumb');
    if (!raw) continue;
    const breadcrumbs = _.castArray(raw).filter(_.isObject);
    for (const breadcrumb of breadcrumbs) {
      if (!('title' in breadcrumb)) continue;
      const pathname =
        'pathname' in breadcrumb && _.isString(breadcrumb.pathname)
          ? breadcrumb.pathname
          : match.pathname;
      items.push({
        title: breadcrumb.title as any,
        pathname,
        id: match.id,
      });
    }
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
    <Flex align="center" height="8" gap="1" mx="4">
      {elements}
    </Flex>
  );
};
