import { useLocaleSiteData, usePrevNextPage } from '../../logic';
import { Link } from '../Link';
import styles from './index.module.scss';
import { normalizeHref } from '@/runtime';

export function DocFooter() {
  const { prevPage, nextPage } = usePrevNextPage();
  const { prevPageText = 'Previous Page', nextPageText = 'Next page' } =
    useLocaleSiteData();

  return (
    <footer m="t-8">
      <div flex="~ col sm:row" justify="sm:around" gap="2" p="t-6">
        <div flex="~ col" className={styles.prev}>
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
        <div flex="~ col" className={styles.next}>
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
