import { Fragment } from 'react';
import type { LocaleConfig, SiteData, DefaultThemeConfig } from 'shared/types';
import { NavScreen } from '../NavScreen';
import { useNav } from '../../logic/useNav';
import styles from './index.module.scss';

interface Props {
  localeData: LocaleConfig;
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
}

export function NavHamburger(props: Props) {
  const { localeData, siteData, pathname } = props;
  const { isScreenOpen, toggleScreen } = useNav();
  return (
    <Fragment>
      <button
        onClick={toggleScreen}
        className={`${isScreenOpen ? styles.active : ''} ${
          styles.navHamburger
        }`}
      >
        <span className={styles.container}>
          <span className={styles.top} />
          <span className={styles.middle} />
          <span className={styles.bottom} />
        </span>
      </button>
      <NavScreen
        isScreenOpen={isScreenOpen}
        localeData={localeData}
        siteData={siteData}
        pathname={pathname}
      />
    </Fragment>
  );
}
