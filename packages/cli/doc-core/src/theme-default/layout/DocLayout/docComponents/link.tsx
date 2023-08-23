import { ComponentProps } from 'react';
import styles from './index.module.scss';
import { withBase, useLang, usePageData, removeBase } from '@/runtime';
import { isExternalUrl, normalizeSlash } from '@/shared/utils';

export const A = (props: ComponentProps<'a'>) => {
  let { href = '' } = props;
  const lang = useLang();
  const pageData = usePageData();
  const defaultLang = pageData.siteData.lang;
  const startWithLang = removeBase(href).startsWith(`/${lang}`);

  if (defaultLang && !isExternalUrl(href) && !href.startsWith('#')) {
    href = normalizeSlash(href);
    // Add lang prefix if not default lang
    if (lang !== defaultLang && !startWithLang) {
      href = `/${lang}${href}`;
    }

    if (lang === defaultLang && startWithLang) {
      href = removeBase(href).replace(`/${lang}`, '');
    }

    href = withBase(href || '');
  }

  return (
    <a {...props} className={`${styles.link} ${props.className}`} href={href} />
  );
};
