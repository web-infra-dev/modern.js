import { NavItem } from 'shared/types';
import { useLocation } from 'react-router-dom';
import { Search } from '@theme';
import { useContext, useEffect, useState } from 'react';
import { getLogoUrl, isMobileDevice, useLocaleSiteData } from '../../logic';
import { NavHamburger } from '../NavHambmger';
import { SocialLinks } from '../SocialLinks';
import { SwitchAppearance } from '../SwitchAppearance';
import { NavMenuGroup, NavMenuGroupItem } from './NavMenuGroup';
import { NavMenuSingleItem } from './NavMenuSingleItem';
import styles from './index.module.scss';
import { ThemeContext, usePageData, withBase } from '@/runtime';
import { replaceLang } from '@/shared/utils';

export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;
}

interface NavBarTitleProps {
  title: string;
  langRoutePrefix: string;
  logo?: string;
}

const NavBarTitle = ({ title, langRoutePrefix, logo }: NavBarTitleProps) => {
  return (
    <div className={`${styles.navBarTitle}`}>
      <a
        href={withBase(langRoutePrefix)}
        className="flex items-center w-full h-full text-base font-semibold transition-opacity duration-300 hover:opacity-60"
      >
        {logo ? (
          <img
            src={logo}
            alt="logo"
            id="logo"
            className="w-24 mr-4 modern-doc-logo"
          />
        ) : (
          <span>{title}</span>
        )}
      </a>
    </div>
  );
};

const NavTranslations = ({
  translationMenuData,
}: {
  translationMenuData: NavMenuGroupItem;
}) => {
  return (
    <div
      className={`translation ${styles.menuItem} flex text-sm font-bold items-center px-3 py-2`}
    >
      <div>
        <NavMenuGroup {...translationMenuData} isTranslation />
      </div>
    </div>
  );
};

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNav } = props;
  const { siteData, page } = usePageData();
  const { logo: rawLogo, base } = siteData;
  const { pathname } = useLocation();
  const { theme } = useContext(ThemeContext);
  const localeData = useLocaleSiteData();
  const [isMobile, setIsMobile] = useState(false);
  const localeLanguages = Object.values(siteData.themeConfig.locales || {});
  const hasMultiLanguage = localeLanguages.length > 1;
  const socialLinks = siteData?.themeConfig?.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const defaultLang = siteData.lang || 'zh';
  const { lang } = page;
  const langs = localeLanguages.map(item => item.lang || 'zh') || [];
  const [logo, setLogo] = useState(getLogoUrl(rawLogo, theme));

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map(item => ({
          text: item?.label,
          link: replaceLang(pathname, item.lang, defaultLang, langs, base),
        })),
        activeValue: localeLanguages.find(item => lang === item.lang)?.label,
      }
    : null;

  useEffect(() => {
    setLogo(getLogoUrl(rawLogo, theme));
  }, [theme]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const NavMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className="menu h-14">
        {menuItems.map(item => {
          return 'items' in item || Array.isArray(item) ? (
            <div key={item.text} className="mx-3 last:mr-0">
              <NavMenuGroup
                {...item}
                items={'items' in item ? item.items : item}
              />
            </div>
          ) : (
            <NavMenuSingleItem
              pathname={pathname}
              langs={langs}
              base={base}
              key={item.link}
              {...item}
            />
          );
        })}
      </div>
    );
  };

  const menuItems = localeData.nav || [];
  const hasSearch = siteData?.themeConfig?.search !== false;

  const title = localeData.title ?? siteData.title;
  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false;

  const rightNav = () => {
    return (
      <div className={styles.rightNav}>
        {hasSearch && (
          <div className="flex sm:flex-1 items-center sm:pl-4 sm:pr-2">
            <Search />
          </div>
        )}
        <NavMenu menuItems={menuItems} />
        <div className="flex-center flex-row">
          {hasMultiLanguage && (
            <NavTranslations translationMenuData={translationMenuData} />
          )}
          {hasAppearanceSwitch && (
            <div className="mx-2">
              <SwitchAppearance />
            </div>
          )}
          {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
        </div>
      </div>
    );
  };
  return (
    <header
      className={`top-0 left-0 md:fixed w-full`}
      style={{
        zIndex: 'var(--modern-z-index-nav)',
        background: 'var(--modern-c-bg)',
      }}
    >
      {beforeNav}
      <div className={`${styles.navContainer} modern-doc-nav px-6`}>
        <div
          className={`${styles.container} flex justify-between items-center h-full`}
        >
          {beforeNavTitle}
          <NavBarTitle
            title={title}
            langRoutePrefix={localeData.langRoutePrefix || '/'}
            logo={logo}
          />
          {afterNavTitle}
          <div
            className={`${styles.content} flex flex-1 justify-end items-center`}
          >
            {rightNav()}

            <div className={styles.mobileNavMenu}>
              {isMobile && <Search />}
              <NavHamburger
                localeData={localeData}
                siteData={siteData}
                pathname={pathname}
                setLogo={setLogo}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
