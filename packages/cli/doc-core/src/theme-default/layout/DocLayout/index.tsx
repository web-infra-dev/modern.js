import { useLocation } from 'react-router-dom';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { useLocaleSiteData, useSidebarData } from '../../logic';
import { SideMenu } from '../../components/LocalSideBar';
import { Overview } from '../../components/Overview';
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
  const { toc = [], siteData, frontmatter } = usePageData();
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
    frontmatter?.sidebar !== false &&
    ((Array.isArray(sidebar) && sidebar.length > 0) ||
      Object.keys(sidebar).length > 0);
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const hasAside =
    headers.length > 0 &&
    (frontmatter?.outline ?? themeConfig?.outline ?? true);
  const isOverviewPage = frontmatter?.overview ?? false;
  return (
    <div p="t-0 b-24 sm:6" m="sm:t-14" className={styles.docLayout}>
      {beforeDoc}
      {hasSidebar ? (
        <SideMenu
          pathname={pathname}
          langRoutePrefix={langRoutePrefix}
          sidebarData={sidebarData}
        />
      ) : null}
      <div flex="~ 1 shrink-0" className={`${styles.content}`}>
        <div relative="~" className={`max-w-full md:max-w-3/4 lg:min-w-640px`}>
          {isOverviewPage ? (
            <Overview />
          ) : (
            <div className="modern-doc">
              <Content />
            </div>
          )}

          {beforeDocFooter}
          <DocFooter />
        </div>
        <div relative="~" display="none lg:block" order="2" flex="1">
          <div className={styles.asideContainer}>
            <div
              flex="~ col"
              p="l-16 b-8"
              style={{
                minHeight: 'calc(100vh - (var(--modern-nav-height) + 32px))',
              }}
            >
              {hasAside ? (
                <div>
                  {beforeOutline}
                  <Aside headers={headers} outlineTitle={outlineTitle} />
                  {afterOutline}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {afterDoc}
    </div>
  );
}
