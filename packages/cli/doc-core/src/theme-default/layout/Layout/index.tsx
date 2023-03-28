import 'nprogress/nprogress.css';
import '../../index.css';
import 'virtual-global-styles';
import globalComponents from 'virtual-global-components';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Theme, { Nav } from '@theme';
import highlight from 'highlight.js';
import mediumZoom from 'medium-zoom';
import { DocLayout, DocLayoutProps } from '../DocLayout';
import { HomeLayoutProps } from '../HomeLayout';
import type { NavProps } from '../../components/Nav';
import { usePageData, Content, useLocation } from '@/runtime';
import { useLocaleSiteData } from '@/theme-default/logic';
import '../../styles/highlight-theme.css';

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
  const {
    // Inject by remark-plugin-toc
    title: articleTitle,
    frontmatter,
    siteData,
    pageType,
  } = usePageData();
  const localesData = useLocaleSiteData();
  const { pathname } = useLocation();

  // Priority: front matter title > h1 title
  let title = frontmatter?.title ?? articleTitle;
  const mainTitle = siteData.title || localesData.title;

  if (title && pageType === 'doc') {
    // append main title as a suffix
    title = `${title} - ${mainTitle}`;
  } else {
    title = mainTitle;
  }

  const description =
    frontmatter?.description || siteData.description || localesData.description;
  // Use doc layout by default
  const getContentLayout = () => {
    switch (pageType) {
      case 'home':
        return <Theme.HomeLayout />;
      case 'doc':
        return <DocLayout {...docProps} />;
      case '404':
        return <Theme.NotFoundLayout />;
      case 'custom':
        return <Content />;
      default:
        return <DocLayout {...docProps} />;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      const images = document.querySelectorAll('.modern-doc img');
      mediumZoom(images);
      document.querySelectorAll('pre code').forEach(el => {
        highlight.highlightElement(el as HTMLDivElement);
      });
    }, 20);
  }, [pathname]);
  return (
    <div>
      <Helmet>
        {title ? <title>{title}</title> : null}
        {description ? <meta name="description" content={description} /> : null}
      </Helmet>
      {top}
      <Nav
        beforeNavTitle={beforeNavTitle}
        afterNavTitle={afterNavTitle}
        beforeNav={beforeNav}
      />
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
