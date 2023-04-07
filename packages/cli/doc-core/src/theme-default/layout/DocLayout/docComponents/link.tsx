import { ComponentProps } from 'react';
import styles from './index.module.scss';
import { withBase } from '@/runtime';
import { externalLinkRE } from '@/shared/utils';

export const A = (props: ComponentProps<'a'>) => {
  let { href = '' } = props;
  if (!externalLinkRE.test(href) && !href.startsWith('#')) {
    href = withBase(href || '');
  }
  return (
    <a {...props} className={`${styles.link} ${props.className}`} href={href} />
  );
};
