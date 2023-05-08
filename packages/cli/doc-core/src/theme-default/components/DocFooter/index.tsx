import { useLocaleSiteData, usePrevNextPage } from '../../logic';
import EditLink from '../EditLink';
import { Link } from '../Link';
import styles from './index.module.scss';
import { normalizeHref, usePageData } from '@/runtime';

export function DocFooter() {
  const { prevPage, nextPage } = usePrevNextPage();
  const {
    prevPageText = 'Previous Page',
    nextPageText = 'Next page',
    lastUpdatedText: localesLastUpdatedText = 'Last Updated',
    lastUpdated: localesLastUpdated = false,
  } = useLocaleSiteData();
  const {
    page: { lastUpdatedTime },
    siteData,
  } = usePageData();
  const { themeConfig } = siteData;
  const lastUpdatedText =
    themeConfig?.lastUpdatedText || localesLastUpdatedText;
  const showLastUpdated = themeConfig.lastUpdated || localesLastUpdated;

  return (
    <footer className="mt-8">
      <div className="xs:flex pb-5 px-2 justify-end items-center">
        {showLastUpdated && (
          <div className="flex text-sm text-text-2 leading-6 sm:leading-8 font-medium">
            <p>{lastUpdatedText}: </p>
            <span>{lastUpdatedTime}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <EditLink />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-around gap-4 pt-6">
        <div className={`${styles.prev} flex flex-col`}>
          {prevPage ? (
            <Link
              href={normalizeHref(prevPage.link)}
              className={styles.pagerLink}
            >
              <span className={styles.desc}>{prevPageText}</span>
              <span className={styles.title}>{prevPage.text}</span>
            </Link>
          ) : null}
        </div>
        <div className={`${styles.next} flex flex-col`}>
          {nextPage ? (
            <Link
              href={normalizeHref(nextPage.link)}
              className={`${styles.pagerLink} ${styles.next}`}
            >
              <span className={styles.desc}>{nextPageText}</span>
              <span className={styles.title}>{nextPage.text}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
