import { usePageData, withBase } from '@modern-js/doc-core/runtime';
import { demos } from 'virtual-meta';
import { useEffect, useState } from 'react';

import './Device.scss';

export default () => {
  const getPageUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      return window.location.origin + withBase(url);
    }
    // Do nothing in ssr
    return '';
  };
  const removeLeadingSlash = (url: string) => {
    return url.charAt(0) === '/' ? url.slice(1) : url;
  };

  const getPageKey = (route: string) => {
    const cleanRoute = removeLeadingSlash(route);
    return cleanRoute.replace(/\//g, '_').replace(/\.[^.]+$/, '') || 'index';
  };
  const { page } = usePageData();
  const pageName = getPageKey(page._relativePath);
  const haveDemos =
    demos.flat().filter(item => new RegExp(`${pageName}_\\d+`).test(item.id))
      .length > 0;
  const [asideWidth, setAsideWidth] = useState('0px');
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);

  // get default value from root
  // listen resize and re-render
  useEffect(() => {
    const root = document.querySelector(':root');
    if (root) {
      const defaultAsideWidth = getComputedStyle(root).getPropertyValue(
        '--modern-aside-width',
      );
      setAsideWidth(defaultAsideWidth);
    }
    const handleResize = () => {
      setInnerWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const node = document.querySelector('.modern-doc-container');
    const { style } = document.documentElement;
    if (haveDemos) {
      if (innerWidth > 1280) {
        node?.setAttribute(
          'style',
          'padding-right: calc(var(--modern-device-width) + var(--modern-preview-padding) * 2)',
        );
      } else if (innerWidth > 960) {
        node?.setAttribute(
          'style',
          `padding-right: calc(${
            innerWidth - 1280
          }px + var(--modern-device-width) + var(--modern-preview-padding) * 2)`,
        );
      } else {
        node?.removeAttribute('style');
      }
      style.setProperty('--modern-aside-width', '0');
    } else {
      node?.removeAttribute('style');
      style.setProperty('--modern-aside-width', asideWidth);
    }
  }, [haveDemos, asideWidth, innerWidth]);

  return haveDemos ? (
    <div className="fixed-device">
      <iframe
        src={getPageUrl(`~demo/${pageName}`)}
        className="fixed-iframe"
      ></iframe>
    </div>
  ) : null;
};
