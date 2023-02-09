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
  const links = [
    {
      title: '使用指南',
      items: [
        {
          label: '快速上手',
          to: '/guides/get-started/quick-start',
        },
        {
          label: '基础功能',
          to: '/guides/basic-features/',
        },
        {
          label: '进阶功能',
          to: '/guides/advanced-features/',
        },
      ],
    },
    {
      title: 'API 资料',
      items: [
        {
          label: '命令',
          to: '/apis/app/commands/',
        },
        {
          label: '运行时',
          to: '/apis/app/runtime/',
        },
        {
          label: '文件约定',
          to: '/apis/app/hooks/',
        },
        {
          label: '配置选项',
          to: '/configure/app/usage',
        },
      ],
    },
    {
      title: '关注我们',
      items: [
        {
          icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/weixin.png',
          qrcode:
            'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/weixin-qrcode.jpeg',
          to: '/weixin',
          label: '微信',
        },
        {
          icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/bilibili.png',
          to: 'https://space.bilibili.com/1195398938',
          label: 'bilibili',
        },
        {
          icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/feishu.png',
          qrcode:
            'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/feishu-qrcode-0914.png',
          to: 'Feishu',
          label: '飞书',
        },
        {
          icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/github.png',
          qrcode: '',
          to: 'https://github.com/modern-js-dev/modern.js',
          label: 'GitHub',
        },
      ],
    },
  ];

  return (
    <footer className={clsx(['footer', 'footer--dark'])}>
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
