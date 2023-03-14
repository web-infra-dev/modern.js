import { useLocaleSiteData, usePrevNextPage } from '../../logic';
import { Link } from '../Link';
import styles from './index.module.scss';
import { normalizeHref } from '@/runtime';

export function DocFooter() {
  const { prevPage, nextPage } = usePrevNextPage();
  const { prevPageText = 'Previous Page', nextPageText = 'Next page' } =
    useLocaleSiteData();

  return (
    <footer className="mt-8">
      <div className="flex flex-col sm:flex-row sm:justify-around gap-2 pt-6">
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
