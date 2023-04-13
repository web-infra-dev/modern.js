import { ComponentProps } from 'react';
import styles from './index.module.scss';
import { withBase, useLang, usePageData } from '@/runtime';
import { isExternalUrl, normalizeSlash } from '@/shared/utils';

export const A = (props: ComponentProps<'a'>) => {
  let { href = '' } = props;
  const lang = useLang();
  const pageData = usePageData();
  const defaultLang = pageData.siteData.lang;
  if (!isExternalUrl(href) && !href.startsWith('#')) {
    href = normalizeSlash(href);
    // Add lang prefix if not default lang
    if (lang !== defaultLang && !href.startsWith(`/${lang}`)) {
      href = `/${lang}${href}`;
    }

    href = withBase(href || '');
  }
  return (
    <a {...props} className={`${styles.link} ${props.className}`} href={href} />
  );
};
