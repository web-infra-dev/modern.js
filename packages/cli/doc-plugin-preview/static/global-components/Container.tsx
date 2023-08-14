import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { withBase, useLang, NoSSR } from '@modern-js/doc-core/runtime';
import IconCode from './svg/code.svg';
import IconLaunch from './svg/launch.svg';
import IconQrcode from './svg/qrcode.svg';
import './Container.scss';

const locales = {
  zh: {
    expand: '展开代码',
    collapse: '收起代码',
    open: '在新页面打开',
  },
  en: {
    expand: 'Expand Code',
    collapse: 'Collapse Code',
    open: 'Open in new page',
  },
};

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  url: string;
};

const Container: React.FC<ContainerProps> = props => {
  const { children, isMobile, url } = props;
  const [showCode, setShowCode] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
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
  const toggleCode = (e: any) => {
    if (!showCode) {
      e.target.blur();
    }
    setShowCode(!showCode);
  };
  const toggleQRCode = (e: any) => {
    if (!showQRCode) {
      e.target.blur();
    }
    setShowQRCode(!showQRCode);
  };
  const openNewPage = (e: any) => {
    if (!showCode) {
      e.target.blur();
    }
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
    <NoSSR>
      <div className="modern-preview">
        {isMobile === 'true' ? (
          <div className="modern-preview-wrapper flex">
            <div className="modern-preview-code">{children?.[0]}</div>
            <div className="modern-preview-device">
              <iframe src={getPageUrl()}></iframe>
              <div className="modern-preview-operations mobile">
                <div className="relative" ref={triggerRef}>
                  {showQRCode && (
                    <div className="modern-preview-qrcode">
                      <QRCodeSVG value={getPageUrl()} size={96} />
                    </div>
                  )}
                  <button style={{ marginLeft: '8px' }} onClick={toggleQRCode}>
                    <IconQrcode />
                  </button>
                </div>
                <button
                  onClick={openNewPage}
                  aria-label={t.open}
                  style={{ marginLeft: '8px' }}
                >
                  <IconLaunch />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="modern-preview-card">
              <div
                style={{
                  overflow: 'auto',
                  marginRight: '44px',
                }}
              >
                {children?.[1]}
              </div>
              <div className="modern-preview-operations web">
                <button
                  onClick={toggleCode}
                  aria-label={t.collapse}
                  className={showCode ? 'button-expanded' : ''}
                >
                  <IconCode />
                </button>
              </div>
            </div>
            <div
              className={`${
                showCode
                  ? 'modern-preview-code-show'
                  : 'modern-preview-code-hide'
              }`}
            >
              {children?.[0]}
            </div>
          </div>
        )}
      </div>
    </NoSSR>
  );
};

export default Container;
