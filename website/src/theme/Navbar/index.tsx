import React, { ComponentProps } from 'react';
import type NavbarType from '@theme/Navbar';
import Navbar from '@theme-original/Navbar';

import { useHistory, useLocation } from '@docusaurus/router';
import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import navbar from '../../../navbar';
import styles from './styles.module.css';

type Props = ComponentProps<typeof NavbarType>;

export default function NavbarWrapper(props: Props): JSX.Element {
  const history = useHistory();
  const jump = href => {
    history.push(href);
  };
  const { pathname } = useLocation();
  const getSecondNavList = navbar => {
    const curNavList = navbar.items.filter(item => {
      return item.category === pathname.split('/').slice(2, 3).join('');
    });
    return curNavList?.[0]?.secondnav;
  };

  const isCurNav = (url: string) => {
    return pathname.startsWith(url.replace('/overview', ''));
  };

  const secondNavList = getSecondNavList(navbar);
  return (
    <>
      <Navbar {...props} />
      {secondNavList && (
        <div className={styles['second-nav']}>
          {secondNavList.map(nav => (
            <div
              key={nav.url}
              onClick={() => jump(nav.url)}
              className={clsx(styles['second-nav-item'], {
                [styles['second-nav-item__selected']]: isCurNav(nav.url),
              })}
            >
              <Translate id={`second-nav-item-${nav.key}`}>
                {nav.label}
              </Translate>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
