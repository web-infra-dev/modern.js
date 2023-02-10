import { useEffect, useRef } from 'react';
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import { LocaleConfig, NavItem, DefaultThemeConfig } from 'shared/types';
import type { SiteData } from 'shared/types';
import {
  NavScreenMenuGroup,
  NavScreenMenuGroupItem,
} from '../NavScreenMenuGroup/NavScreenMenuGroup';
import { NavMenuSingleItem } from '../Nav/NavMenuSingleItem';
import { SwitchAppearance } from '../SwitchAppearance';
import Translator from '../../assets/translator.svg';
import { SocialLinks } from '../SocialLinks';
import styles from './index.module.scss';

interface Props {
  isScreenOpen: boolean;
  localeData: LocaleConfig;
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
}

const NavScreenTranslations = ({
  translationMenuData,
}: {
  translationMenuData: NavScreenMenuGroupItem;
}) => {
  return (
    <div
      className={styles.navTranslations}
      flex="~"
      text="sm"
      font="bold"
      justify="center"
    >
      <div m="x-1.5 y-1">
        <NavScreenMenuGroup {...translationMenuData} />
      </div>
    </div>
  );
};

export function NavScreen(props: Props) {
  const { isScreenOpen, localeData, siteData, pathname } = props;
  const screen = useRef<HTMLDivElement | null>(null);
  const localesData = siteData.themeConfig.locales || [];
  const hasMultiLanguage = localesData.length > 1;
  const menuItems = localeData.nav || [];
  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false;
  const socialLinks = siteData?.themeConfig?.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const langs = localesData.map(item => item.lang || 'zh') || [];
  const { base } = siteData;

  const translationMenuData = hasMultiLanguage
    ? {
        text: <Translator w="18px" h="18px" />,
        items: localesData.map(item => ({
          text: item.label,
          link: `/${item.lang}`,
        })),
        activeIndex: localesData.findIndex(
          item => item.lang === localeData.lang,
        ),
      }
    : null;
  const NavScreenAppearance = () => {
    return (
      <div className={`mt-2 ${styles.navAppearance}`} flex="~" justify="center">
        <SwitchAppearance />
      </div>
    );
  };
  const NavScreenMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className={styles.navMenu}>
        {menuItems.map((item, index) => {
          return (
            <div key={index} w="full" className={styles.navMenuItem}>
              {'link' in item ? (
                <NavMenuSingleItem
                  pathname={pathname}
                  key={index}
                  base={base}
                  langs={langs}
                  {...item}
                />
              ) : (
                <div m="x-3" last="mr-0" key={index}>
                  <NavScreenMenuGroup {...item} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  useEffect(() => {
    screen.current &&
      isScreenOpen &&
      disableBodyScroll(screen.current, { reserveScrollBarGap: true });
    return () => {
      clearAllBodyScrollLocks();
    };
  }, [isScreenOpen]);
  return (
    <div
      className={`${styles.navScreen} ${isScreenOpen ? styles.active : ''}`}
      ref={screen}
      id="navScreen"
    >
      <div className={styles.container}>
        <NavScreenMenu menuItems={menuItems} />
        <div className="flex-center flex-col">
          {hasAppearanceSwitch && <NavScreenAppearance />}
          {hasMultiLanguage && (
            <NavScreenTranslations translationMenuData={translationMenuData!} />
          )}
          {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
        </div>
      </div>
    </div>
  );
}
