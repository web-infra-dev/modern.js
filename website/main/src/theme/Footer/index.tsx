/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// TODO: enable eslint
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import clsx from 'clsx';
import {
  withBase,
  usePageData,
  normalizeHref,
} from '@modern-js/doc-tools/runtime';
import styles from './styles.module.css';

const isExternalUrl = url => {
  return url.startsWith('http://') || url.startsWith('https://');
};

function FooterLink({ to, href, label, prependBaseUrlToHref, ...props }: any) {
  const toUrl = withBase(to);
  const normalizedHref = normalizeHref(href);

  return (
    <a
      className="footer__link-item"
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            href: toUrl,
          })}
      {...props}
    >
      {href && isExternalUrl(href) ? <span>{label}</span> : label}
    </a>
  );
}

function FooterItem(props) {
  const [show, setShow] = useState(false);
  const mouseEnterHandler = e => {
    e.preventDefault();
    if (window.innerWidth > 966) {
      setShow(true);
    }
  };
  const mouseLeaveHandler = e => {
    e.preventDefault();
    if (window.innerWidth > 966) {
      setShow(false);
    }
  };
  if (props.html) {
    return (
      <li
        dangerouslySetInnerHTML={{
          __html: props.html,
        }}
      />
    );
  }
  if (props.icon) {
    if (!props.qrcode) {
      return (
        <a href={props.to} className={`footer__item ${styles.footerItemIcon}`}>
          <img width="32" height="32" src={props.icon} alt={props.alt} />
        </a>
      );
    } else {
      const classArr = [
        'footer__item',
        styles.footerItemIcon,
        show ? styles.active : '',
      ];
      return (
        <a
          onClick={() => setShow(!show)}
          onMouseEnter={e => mouseEnterHandler(e)}
          onMouseLeave={e => mouseLeaveHandler(e)}
          className={classArr.join(' ')}
        >
          <img width="32" height="32" src={props.icon} alt={props.alt} />
          <span
            className={styles.qrcodeWrap}
            style={{ display: show ? 'flex' : 'none' }}
          >
            <img
              width="108"
              height="108"
              className={styles.qrcode}
              src={props.qrcode}
              alt={props.label}
            />
          </span>
        </a>
      );
    }
  }
  return (
    <li className="my-1 hover:text-[var(--modern-c-brand)] transition-colors">
      <FooterLink {...props} />
    </li>
  );
}

const renderFooterItems = items => {
  if (items != null && Array.isArray(items) && items.length > 0) {
    if (items[0].icon) {
      return (
        <ul className={`footer__items ${styles.footerItemIcons}`}>
          {items.map((item, key) => (
            <FooterItem
              {...item}
              key={item.icon || item.href || item.to || key}
            />
          ))}
        </ul>
      );
    } else {
      return (
        <ul className="footer__items">
          {items.map((item, key) => (
            <FooterItem
              {...item}
              key={item.icon || item.href || item.to || key}
            />
          ))}
        </ul>
      );
    }
  }
  return null;
};

function Footer(): JSX.Element | null {
  const { siteData } = usePageData();

  const { footer } = siteData.themeConfig || {};

  const { links = [] } = footer || {};
  if (!footer) {
    return null;
  }

  return (
    <footer
      className={clsx('footer', {
        'footer--dark': footer.style === 'dark',
      })}
    >
      <div className="w-full">
        {links && links.length > 0 && (
          <div className="m-4 flex justify-around">
            {links.map((linkItem, i) => (
              <div key={i}>
                {linkItem.title != null ? (
                  <div className="text-[var(--modern-c-brand)] my-2 font-semibold">
                    {linkItem.title}
                  </div>
                ) : null}
                {linkItem.items != null &&
                Array.isArray(linkItem.items) &&
                linkItem.items.length > 0 ? (
                  <ul>{renderFooterItems(linkItem.items)}</ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;

/* eslint-enable */
