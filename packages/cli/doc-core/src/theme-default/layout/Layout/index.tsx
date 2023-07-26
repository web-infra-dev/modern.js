import 'nprogress/nprogress.css';
import '../../styles';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Theme, { Nav } from '@theme';
import globalComponents from 'virtual-global-components';
import { DocLayout, DocLayoutProps } from '../DocLayout';
import { HomeLayoutProps } from '../HomeLayout';
import type { NavProps } from '../../components/Nav';
import { usePageData, Content, removeBase, withBase } from '@/runtime';
import { useLocaleSiteData } from '@/theme-default/logic';

export type LayoutProps = {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
} & DocLayoutProps &
  HomeLayoutProps &
  NavProps;

export const Layout: React.FC<LayoutProps> = props => {
  const {
    top,
    bottom,
    beforeDocFooter,
    beforeDoc,
    afterDoc,
    beforeOutline,
    afterOutline,
    beforeNavTitle,
    afterNavTitle,
    beforeNav,
  } = props;
  const docProps: DocLayoutProps = {
    beforeDocFooter,
    beforeDoc,
    afterDoc,
    beforeOutline,
    afterOutline,
  };
  const { siteData, page } = usePageData();
  const { themeConfig } = siteData;
  const {
    pageType,
    lang: currentLang,
    // Inject by remark-plugin-toc
    title: articleTitle,
    frontmatter,
  } = page;
  const localesData = useLocaleSiteData();
  const defaultLang = siteData.lang || '';
  const hideNavbar =
    frontmatter?.hideNavbar ?? themeConfig?.hideNavbar ?? false;

  // Priority: front matter title > h1 title
  let title = (frontmatter?.title as string) ?? articleTitle;
  const mainTitle = siteData.title || localesData.title;
  const localeLanguages = Object.values(siteData.themeConfig.locales || {});
  const langs = localeLanguages.map(item => item.lang) || [];

  if (title && pageType === 'doc') {
    // append main title as a suffix
    title = `${title} - ${mainTitle}`;
  } else {
    title = mainTitle;
  }
  const description =
    (frontmatter?.description as string) ||
    siteData.description ||
    localesData.description;
  // Use doc layout by default
  const getContentLayout = () => {
    switch (pageType) {
      case 'home':
        return <Theme.HomeLayout />;
      case 'doc':
        return <DocLayout {...docProps} />;
      case '404':
        return <Theme.NotFoundLayout />;
      // The custom pageType will have navbar while the blank pageType will not.
      case 'custom':
      case 'blank':
        return <Content />;
      default:
        return <DocLayout {...docProps} />;
    }
  };

  useEffect(() => {
    if (!defaultLang) {
      // Check the window.navigator.language to determine the default language
      // If the default language is not the same as the current language, redirect to the default language
      // The default language will not have a lang prefix in the URL
      return;
    }
    // Normalize current url, to ensure that the home url is always with a trailing slash
    const { pathname } = window.location;
    const cleanPathname = removeBase(pathname);
    // Check if the user is visiting the site for the first time
    const FIRST_VISIT_KEY = 'modern-doc-visited';
    const visited = localStorage.getItem(FIRST_VISIT_KEY);
    if (visited) {
      return;
    } else {
      localStorage.setItem(FIRST_VISIT_KEY, '1');
    }
    const targetLang = window.navigator.language.split('-')[0];
    if (!langs.includes(targetLang)) {
      return;
    }
    if (targetLang !== currentLang) {
      if (targetLang === defaultLang) {
        // Redirect to the default language
        window.location.replace(pathname.replace(`/${currentLang}`, ''));
      } else if (currentLang === defaultLang) {
        // Redirect to the current language
        window.location.replace(withBase(`/${targetLang}${cleanPathname}`));
      } else {
        // Redirect to the current language
        window.location.replace(
          pathname.replace(`/${currentLang}`, `/${targetLang}`),
        );
      }
    }
  }, []);
  return (
    <div>
      <Helmet>
        {title ? <title>{title}</title> : null}
        {description ? <meta name="description" content={description} /> : null}
      </Helmet>
      {top}
      {pageType !== 'blank' && !hideNavbar && (
        <Nav
          beforeNavTitle={beforeNavTitle}
          afterNavTitle={afterNavTitle}
          beforeNav={beforeNav}
        />
      )}

      <section>{getContentLayout()}</section>
      {bottom}
      {
        // Global UI
        globalComponents.map((Component, index) => (
          // The component order is stable
          // eslint-disable-next-line react/no-array-index-key
          <Component key={index} />
        ))
      }
    </div>
  );
};
