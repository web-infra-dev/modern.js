import { useEffect, useState } from 'react';
import { Button, Tooltip, Card } from '@arco-design/web-react';
import { IconCode, IconLaunch, IconQrcode } from '@arco-design/web-react/icon';
import '@arco-design/web-react/es/Button/style';
import '@arco-design/web-react/es/Tooltip/style';
import '@arco-design/web-react/es/Card/style';

import './container.scss';
import { normalizeRoutePath, useDark } from '@modern-js/doc-core/runtime';
import { QRCodeSVG } from 'qrcode.react';
import { locales } from '../locales';
import Preview from './preview';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: boolean;
  url: string;
};

const Container: React.FC<ContainerProps> = props => {
  const { children, isMobile, url } = props;
  const [showCode, setShowCode] = useState(false);
  const lang = normalizeRoutePath(window.location.pathname).startsWith('/en/')
    ? 'en'
    : 'zh';
  const toggleCode = (e: any) => {
    if (!showCode) {
      e.target.blur();
    }
    setShowCode(!showCode);
  };
  const openNewPage = (e: any) => {
    if (!showCode) {
      e.target.blur();
    }
    window.open(url);
  };
  const dark = useDark();
  useEffect(() => {
    if (dark) {
      document.body.setAttribute('arco-theme', 'dark');
    } else {
      document.body.removeAttribute('arco-theme');
    }
  }, [dark]);
  const t = locales[lang];
  const renderOperations = () => {
    return (
      <div className="code-operations web">
        <Tooltip content={showCode ? t.collapse : t.expand}>
          <Button
            size="small"
            shape="circle"
            onClick={toggleCode}
            type="secondary"
            aria-label={t.collapse}
            className={showCode ? 'ac-btn-expanded' : ''}
          >
            <IconCode />
          </Button>
        </Tooltip>
      </div>
    );
  };
  return (
    <div className="code-wrapper">
      {isMobile ? (
        <>
          <Card>
            <div className="flex">
              <div className="preview-code">{children?.[0]}</div>
              <div className="preview-device">
                <Preview url={url} />
              </div>
            </div>
          </Card>
          <div className="code-operations mobile">
            <Tooltip content={<QRCodeSVG value={url} size={96} />}>
              <Button
                size="small"
                shape="circle"
                type="secondary"
                className={showCode ? 'ac-btn-expanded' : ''}
              >
                <IconQrcode />
              </Button>
            </Tooltip>
            <Tooltip content={t.open}>
              <Button
                size="small"
                shape="circle"
                onClick={openNewPage}
                type="secondary"
                aria-label={t.open}
                style={{ marginLeft: '8px' }}
                className={showCode ? 'ac-btn-expanded' : ''}
              >
                <IconLaunch />
              </Button>
            </Tooltip>
          </div>
        </>
      ) : (
        <>
          <Card>
            <div
              style={{
                overflow: 'auto',
              }}
            >
              {children?.[1]}
            </div>
            {renderOperations()}
          </Card>
          <div className={`code-content ${showCode ? 'show-all' : ''}`}>
            {children?.[0]}
          </div>
        </>
      )}
    </div>
  );
};

export default Container;
