import React from 'react';
import { matchRoutes, useNavigate } from 'react-router-dom';
import { routes } from 'virtual-routes';
import nprogress from 'nprogress';
import styles from './index.module.scss';
import { normalizeRoutePath, withBase } from '@/runtime';

export interface LinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

nprogress.configure({ showSpinner: false });

const EXTERNAL_URL_RE = /^(https?:)?\/\//;

export function Link(props: LinkProps) {
  const { href = '/', children, className = '' } = props;
  const isExternal = EXTERNAL_URL_RE.test(href);
  const target = isExternal ? '_blank' : '';
  const rel = isExternal ? 'noopener noreferrer' : undefined;
  const withBaseUrl = isExternal ? href : withBase(href);
  const navigate = useNavigate();
  const handleNavigate = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e.preventDefault();
    const matchedRoutes = matchRoutes(routes, normalizeRoutePath(withBaseUrl));
    if (matchedRoutes?.length) {
      const timer = setTimeout(() => {
        nprogress.start();
      }, 200);
      await matchedRoutes[0].route.preload();
      clearTimeout(timer);
      nprogress.done();
    }
    navigate(withBaseUrl, { replace: false });
  };
  if (!isExternal) {
    return (
      <a
        className={`${styles.link} ${className}`}
        rel={rel}
        target={target}
        onClick={handleNavigate}
        cursor="pointer"
      >
        {children}
      </a>
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
