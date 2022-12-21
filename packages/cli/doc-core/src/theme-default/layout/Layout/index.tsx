import 'uno.css';
import '../../index.css';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Theme, { Nav } from '@theme';
import { DocLayout, DocLayoutProps } from '../DocLayout';
import { HomeLayoutProps } from '../HomeLayout';
import type { NavProps } from '../../components/Nav';
import { usePageData, Content } from '@/runtime';

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
  // Priority: front matter title > h1 title > site title
  const title = (frontmatter?.title ?? articleTitle) || siteData?.title;
  const description = frontmatter?.description || siteData.description;
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

  return (
    <div style={{ height: '100%' }}>
      <Helmet>
        {title ? <title>{title}</title> : null}
        {description ? <meta name="description" content={description} /> : null}
      </Helmet>
      {top}
      <Nav beforeNavTitle={beforeNavTitle} afterNavTitle={afterNavTitle} />
      <section>{getContentLayout()}</section>
      {bottom}
    </div>
  );
};
