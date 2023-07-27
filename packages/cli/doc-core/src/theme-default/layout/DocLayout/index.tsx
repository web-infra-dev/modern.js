import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { getCustomMDXComponent } from '@theme';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { useLocaleSiteData, useSidebarData } from '../../logic';
import { SideMenu } from '../../components/LocalSideBar';
import { Overview } from '../../components/Overview';
import { TabDataContext } from '../../logic/TabDataContext';
import styles from './index.module.scss';
import { Content, usePageData, normalizeSlash } from '@/runtime';

export interface DocLayoutProps {
  beforeDocFooter?: React.ReactNode;
  beforeDoc?: React.ReactNode;
  afterDoc?: React.ReactNode;
  beforeOutline?: React.ReactNode;
  afterOutline?: React.ReactNode;
}

export function DocLayout(props: DocLayoutProps) {
  const { beforeDocFooter, beforeDoc, afterDoc, beforeOutline, afterOutline } =
    props;
  const { siteData, page } = usePageData();
  const { toc = [], frontmatter } = page;
  const [tabData, setTabData] = useState({});
  const headers = toc;
  const { themeConfig } = siteData;
  const localesData = useLocaleSiteData();
  const sidebar = localesData.sidebar || {};
  const { pathname } = useLocation();

  const { items: sidebarData } = useSidebarData();
  const langRoutePrefix = normalizeSlash(localesData.langRoutePrefix || '');
  const hideNavbar =
    frontmatter?.hideNavbar ?? themeConfig?.hideNavbar ?? false;
  // siderbar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar
  const hasSidebar =
    frontmatter?.sidebar !== false && Object.keys(sidebar).length > 0;
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const isOverviewPage = frontmatter?.overview ?? false;
  const hasFooter = frontmatter?.footer ?? true;

  const getHasAside = () => {
    // if in iframe, default value is false
    const defaultHasAside =
      typeof window === 'undefined' ? true : window.top === window.self;
    return (
      (frontmatter?.outline ?? themeConfig?.outline ?? defaultHasAside) &&
      headers.length > 0
    );
  };
  const [hasAside, setHasAside] = useState(getHasAside());

  useEffect(() => {
    setHasAside(getHasAside());
  }, [page, siteData]);

  return (
    <div
      className={`${styles.docLayout} pt-0`}
      style={{
        ...(hideNavbar ? { marginTop: 0 } : {}),
      }}
    >
      {beforeDoc}
      {hasSidebar ? (
        <SideMenu
          pathname={pathname}
          langRoutePrefix={langRoutePrefix}
          sidebarData={sidebarData}
        />
      ) : null}
      <div
        className={`${styles.content} modern-doc-container flex flex-shrink-0`}
      >
        <div className="w-full">
          {isOverviewPage ? (
            <Overview />
          ) : (
            <div className="modern-doc">
              <TabDataContext.Provider value={{ tabData, setTabData }}>
                <MDXProvider components={getCustomMDXComponent()}>
                  <Content />
                </MDXProvider>
              </TabDataContext.Provider>
              <div>
                {beforeDocFooter}
                {hasFooter && <DocFooter />}
              </div>
            </div>
          )}
        </div>

        {hasAside ? (
          <div
            className={styles.asideContainer}
            style={{
              maxHeight: 'calc(100vh - (var(--modern-nav-height) + 32px))',
              overflow: 'scroll',
              ...(hideNavbar
                ? {
                    marginTop: 0,
                    paddingTop: '32px',
                  }
                : {}),
            }}
          >
            <div>
              {beforeOutline}
              <Aside headers={headers} outlineTitle={outlineTitle} />
              {afterOutline}
            </div>
          </div>
        ) : null}
      </div>
      {afterDoc}
    </div>
  );
}
