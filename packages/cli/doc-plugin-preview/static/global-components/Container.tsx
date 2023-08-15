import { useCallback, useState } from 'react';
import { withBase, useLang, NoSSR } from '@modern-js/doc-core/runtime';
import MobileOperation from './common/mobile-operation';
import IconCode from './svg/code.svg';
import './Container.scss';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  url: string;
};

const Container: React.FC<ContainerProps> = props => {
  const { children, isMobile, url } = props;
  const [showCode, setShowCode] = useState(false);
  const lang = useLang();

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

  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  return (
    <NoSSR>
      <div className="modern-preview">
        {isMobile === 'true' ? (
          <div className="modern-preview-wrapper flex">
            <div className="modern-preview-code">{children?.[0]}</div>
            <div className="modern-preview-device">
              <iframe src={getPageUrl()} key={iframeKey}></iframe>
              <MobileOperation url={url} refresh={refresh} />
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
                  aria-label={lang === 'zh' ? '收起代码' : ''}
                  className={showCode ? 'button-expanded' : 'Collapse Code'}
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
