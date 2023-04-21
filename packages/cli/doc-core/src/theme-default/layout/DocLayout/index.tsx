import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import mediumZoom from 'medium-zoom';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { highlightCode, useLocaleSiteData, useSidebarData } from '../../logic';
import { SideMenu } from '../../components/LocalSideBar';
import { Overview } from '../../components/Overview';
import { TabDataContext } from '../../logic/TabDataContext';
import styles from './index.module.scss';
import { getCustomMDXComponent } from './docComponents';
import { Content, usePageData, normalizeSlash } from '@/runtime';

export interface DocLayoutProps {
  beforeDocFooter?: React.ReactNode;
  beforeDoc?: React.ReactNode;
  afterDoc?: React.ReactNode;
  beforeOutline?: React.ReactNode;
  afterOutline?: React.ReactNode;
}

function DocContent() {
  const { pathname } = useLocation();
  useEffect(() => {
    const images = document.querySelectorAll('.modern-doc img');
    mediumZoom(images);
    highlightCode();
  }, [pathname]);
  return <Content />;
}

export function DocLayout(props: DocLayoutProps) {
  const { beforeDocFooter, beforeDoc, afterDoc, beforeOutline, afterOutline } =
    props;
  const { siteData, page } = usePageData();
  const { toc, frontmatter } = page;
  const [tabData, setTabData] = useState({});
  const headers = toc;
  const { themeConfig } = siteData;
  const localesData = useLocaleSiteData();
  const sidebar = localesData.sidebar || [];
  const { pathname } = useLocation();

  const { items: sidebarData } = useSidebarData();
  const langRoutePrefix = normalizeSlash(localesData.langRoutePrefix || '');
  // siderbar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar
  const hasSidebar =
    frontmatter?.sidebar !== false && Object.keys(sidebar).length > 0;
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const hasAside =
    headers.length > 0 &&
    (frontmatter?.outline ?? themeConfig?.outline ?? true);
  const isOverviewPage = frontmatter?.overview ?? false;

  return (
    <div className={`${styles.docLayout} pt-0 md:mt-14`}>
      {beforeDoc}
      {hasSidebar ? (
        <SideMenu
          pathname={pathname}
          langRoutePrefix={langRoutePrefix}
          sidebarData={sidebarData}
        />
      ) : null}
      <div className={`${styles.content} flex flex-shrink-0`}>
        <div className="w-full">
          {isOverviewPage ? (
            <Overview />
          ) : (
            <div className="modern-doc">
              <TabDataContext.Provider value={{ tabData, setTabData }}>
                <MDXProvider components={getCustomMDXComponent()}>
                  <DocContent />
                </MDXProvider>
              </TabDataContext.Provider>
              <div>
                {beforeDocFooter}
                <DocFooter />
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
