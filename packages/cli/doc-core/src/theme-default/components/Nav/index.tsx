import { NavItem } from 'shared/types';
import { useLocation } from 'react-router-dom';
import { Search } from '@theme';
import { useLocaleSiteData } from '../../logic';
import { SwitchAppearance } from '../SwitchAppearance';
import { NavHamburger } from '../NavHambmger';
import { SocialLinks } from '../SocialLinks';
import { NavMenuGroup, NavMenuGroupItem } from './NavMenuGroup';
import { NavMenuSingleItem } from './NavMenuSingleItem';
import styles from './index.module.scss';
import { usePageData, withBase } from '@/runtime';
import { replaceLang } from '@/shared/utils';

export interface NavProps {
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
    <div shrink="0" className={`${styles.navBarTitle}`}>
      <a
        href={withBase(langRoutePrefix)}
        w="full"
        h="full"
        text="1rem"
        font="semibold"
        transition="opacity duration-300"
        hover="opacity-60"
        className="flex items-center"
      >
        {logo ? (
          <img src={logo} alt="logo" id="logo" mr="4" className="w-24" />
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
      flex="~"
      text="sm"
      font="bold"
      align="items-center"
      className={`translation ${styles.menuItem}`}
    >
      <div m="x-1.5">
        <NavMenuGroup {...translationMenuData} isTranslation />
      </div>
    </div>
  );
};

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle } = props;
  const { siteData } = usePageData();
  const { pathname } = useLocation();
  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false;
  const localeData = useLocaleSiteData();
  const localeLanguages = Object.values(siteData.themeConfig.locales || {});
  const hasMultiLanguage = localeLanguages.length > 1;
  const socialLinks = siteData?.themeConfig?.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const defaultLang = siteData.lang || 'zh';
  const langs = localeLanguages.map(item => item.lang || 'zh') || [];
  const { logo } = siteData;

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map(item => ({
          text: item.label,
          link: replaceLang(pathname, item.lang, defaultLang, langs),
        })),
        activeIndex: localeLanguages.findIndex(
          item => item.lang === localeData.lang,
        ),
      }
    : null;
  const NavAppearance = () => {
    return (
      <div
        className={`appearance ${styles.menuItem}`}
        display="none sm:flex"
        align-items-center="center"
      >
        <SwitchAppearance />
      </div>
    );
  };
  const NavMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className="menu" h="14">
        {menuItems.map(item =>
          'link' in item ? (
            <NavMenuSingleItem pathname={pathname} key={item.link} {...item} />
          ) : (
            <div m="x-3" last="mr-0" key={item.text}>
              <NavMenuGroup {...item} />
            </div>
          ),
        )}
      </div>
    );
  };
  const menuItems = localeData.nav || [];
  const hasSearch = siteData?.themeConfig?.search !== false;

  const title = localeData.title ?? siteData.title;

  const rightNav = () => {
    return (
      <div className={styles.rightNav}>
        {hasSearch && (
          <div className="search" flex="sm:1" pl="sm:8">
            <Search
              langRoutePrefix={localeData.langRoutePrefix || ''}
              defaultLang={defaultLang}
              langs={langs}
            />
          </div>
        )}
        <NavMenu menuItems={menuItems} />
        {hasMultiLanguage && (
          <NavTranslations translationMenuData={translationMenuData!} />
        )}
        {hasAppearanceSwitch && <NavAppearance />}
        {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
      </div>
    );
  };
  return (
    <header
      relative="~"
      z="4"
      fixed="md:~"
      className="top-0 left-0 md:border-b lg:border-b"
      style={{
        borderBottom: '1px solid var(--modern-c-divider-light)',
      }}
      w="full"
    >
      <div relative="~" p="x-6" transition="background-color duration-500">
        <div
          flex="~"
          justify="between"
          align="items-center"
          h="full"
          className={`${styles.container}`}
        >
          {beforeNavTitle}
          <NavBarTitle
            title={title}
            langRoutePrefix={localeData.langRoutePrefix || '/'}
            logo={logo}
          />
          {afterNavTitle}
          <div
            className={styles.content}
            flex="~ 1"
            justify="end"
            align-items-center="~"
          >
            {rightNav()}
            <NavHamburger
              localeData={localeData}
              siteData={siteData}
              pathname={pathname}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
