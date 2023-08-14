import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { withBase, useLang } from '@modern-js/doc-core/runtime';
import IconLaunch from '../svg/launch.svg';
import IconQrcode from '../svg/qrcode.svg';
import IconRefresh from '../svg/refresh.svg';

const locales = {
  zh: {
    refresh: '刷新页面',
    open: '在新页面打开',
  },
  en: {
    refresh: 'refresh',
    open: 'Open in new page',
  },
};

export default (props: {
  url: string;
  className?: string;
  refresh: () => void;
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const { url, className = '', refresh } = props;
  const lang = useLang();
  const triggerRef = useRef(null);
  const t = lang === 'zh' ? locales.zh : locales.en;

  const getPageUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin + withBase(url);
    }
    // Do nothing in ssr
    return '';
  };
  const toggleQRCode = (e: any) => {
    if (!showQRCode) {
      e.target.blur();
    }
    setShowQRCode(!showQRCode);
  };
  const openNewPage = () => {
    window.open(getPageUrl());
  };

  const contains = function (root: HTMLElement | null, ele: any) {
    if (!root) {
      return false;
    }
    if (root.contains) {
      return root.contains(ele);
    }
    let node = ele;
    while (node) {
      if (node === root) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const onClickOutside = useCallback(
    (e: MouseEvent) => {
      console.log(
        !contains(triggerRef.current, e.target),
        triggerRef.current,
        e.target,
      );
      if (!contains(triggerRef.current, e.target)) {
        setShowQRCode(false);
      }
    },
    [triggerRef],
  );

  useEffect(() => {
    if (showQRCode) {
      document.addEventListener('mousedown', onClickOutside, false);
    } else {
      document.removeEventListener('mousedown', onClickOutside, false);
    }
  }, [showQRCode]);

  return (
    <div className={`modern-preview-operations mobile ${className}`}>
      <button onClick={refresh} aria-label={t.refresh}>
        <IconRefresh />
      </button>
      <div className="relative" ref={triggerRef}>
        {showQRCode && (
          <div className="modern-preview-qrcode">
            <QRCodeSVG value={getPageUrl()} size={96} />
          </div>
        )}
        <button onClick={toggleQRCode}>
          <IconQrcode />
        </button>
      </div>
      <button onClick={openNewPage} aria-label={t.open}>
        <IconLaunch />
      </button>
    </div>
  );
};
