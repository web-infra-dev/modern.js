import { Fragment } from 'react';
import type { LocaleConfig, SiteData, DefaultThemeConfig } from 'shared/types';
import { NavScreen } from '../NavScreen';
import { useNav } from '../../logic/useNav';
import SmallMenu from '../../assets/small-menu.svg';
import styles from './index.module.scss';

interface Props {
  localeData: LocaleConfig;
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
  setLogo: (logo: string) => void;
}

export function NavHamburger(props: Props) {
  const { localeData, siteData, pathname, setLogo } = props;
  const { isScreenOpen, toggleScreen } = useNav();
  return (
    <Fragment>
      <NavScreen
        isScreenOpen={isScreenOpen}
        localeData={localeData}
        siteData={siteData}
        pathname={pathname}
        setLogo={setLogo}
      />
      <button
        onClick={toggleScreen}
        className={`${isScreenOpen ? styles.active : ''} ${
          styles.navHamburger
        } text-gray-500`}
      >
        <SmallMenu fill="currentColor" />
      </button>
    </Fragment>
  );
}
