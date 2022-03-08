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

import Link from '@docusaurus/Link';
import { FooterLinkItem, useThemeConfig } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import isInternalUrl from '@docusaurus/isInternalUrl';
import ThemedImage, { Props as ThemedImageProps } from '@theme/ThemedImage';
import IconExternalLink from '@theme/IconExternalLink';
import styles from './styles.module.css';

function FooterLink({
  to,
  href,
  label,
  prependBaseUrlToHref,
  ...props
}: FooterLinkItem) {
  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });

  return (
    <Link
      className="footer__link-item"
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            to: toUrl,
          })}
      {...props}
    >
      {href && !isInternalUrl(href) ? (
        <span>
          {label}
          <IconExternalLink />
        </span>
      ) : (
        label
      )}
    </Link>
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
        className="footer__item"
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
    <li className="footer__item">
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

const FooterLogo = ({
  sources,
  alt,
}: Pick<ThemedImageProps, 'sources' | 'alt'>) => (
  <ThemedImage className="footer__logo" alt={alt} sources={sources} />
);

function Footer(): JSX.Element | null {
  const { footer } = useThemeConfig();

  const { copyright, links = [], logo = {} } = footer || {};
  const sources = {
    light: useBaseUrl(logo.src),
    dark: useBaseUrl(logo.srcDark || logo.src),
  };

  if (!footer) {
    return null;
  }

  return (
    <footer
      className={clsx('footer', {
        'footer--dark': footer.style === 'dark',
      })}
    >
      <div className="container">
        {links && links.length > 0 && (
          <div className="row footer__links">
            {links.map((linkItem, i) => (
              <div key={i} className="col footer__col">
                {linkItem.title != null ? (
                  <div className="footer__title">{linkItem.title}</div>
                ) : null}
                {linkItem.items != null &&
                Array.isArray(linkItem.items) &&
                linkItem.items.length > 0 ? (
                  <ul className="footer__items">
                    {renderFooterItems(linkItem.items)}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {(logo || copyright) && (
          <div className="footer__bottom text--center">
            {logo && (logo.src || logo.srcDark) && (
              <div className="margin-bottom--sm">
                {logo.href ? (
                  <Link href={logo.href} className={styles.footerLogoLink}>
                    <FooterLogo alt={logo.alt} sources={sources} />
                  </Link>
                ) : (
                  <FooterLogo alt={logo.alt} sources={sources} />
                )}
              </div>
            )}
            {copyright ? (
              <div
                className="footer__copyright"
                dangerouslySetInnerHTML={{
                  __html: copyright,
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;

/* eslint-enable */
