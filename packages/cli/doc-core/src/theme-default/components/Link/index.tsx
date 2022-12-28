import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styles from './index.module.scss';
import { withBase } from '@/runtime';
import { inBrowser } from '@/shared/utils';

export interface LinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

const EXTERNAL_URL_RE = /^(https?:)?\/\//;

export function Link(props: LinkProps) {
  const { href = '/', children, className = '' } = props;
  const isExternal = EXTERNAL_URL_RE.test(href);
  const target = isExternal ? '_blank' : '';
  const rel = isExternal ? 'noopener noreferrer' : undefined;
  const pathname = inBrowser() ? window.location.pathname : '';
  const withBaseUrl = isExternal ? href : withBase(href);
  if (!isExternal) {
    return (
      <RouterLink
        className={`${styles.link} ${className}`}
        to={withBaseUrl}
        rel={rel}
        target={target}
        state={{ from: pathname }}
      >
        {children}
      </RouterLink>
    );
  } else {
    return (
      <a
        href={withBaseUrl}
        target={target}
        rel={rel}
        className={`${styles.link} ${className}`}
      >
        {children}
      </a>
    );
  }
}
