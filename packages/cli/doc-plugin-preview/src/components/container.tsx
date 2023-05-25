import { useEffect, useState } from 'react';
import { Button, Tooltip, Card } from '@arco-design/web-react';
import { IconCode, IconLaunch, IconQrcode } from '@arco-design/web-react/icon';
import '@arco-design/web-react/es/Button/style';
import '@arco-design/web-react/es/Tooltip/style';
import '@arco-design/web-react/es/Card/style';

import './container.scss';
import {
  normalizeRoutePath,
  useDark,
  withBase,
} from '@modern-js/doc-core/runtime';
import { QRCodeSVG } from 'qrcode.react';
import { locales } from '../locales';

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
  const pageUrl = window.location.origin + withBase(url);
  const dark = useDark();
  const t = locales[lang];
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
    window.open(pageUrl);
  };
  // support dark theme in container
  useEffect(() => {
    if (dark) {
      document.body.setAttribute('arco-theme', 'dark');
    } else {
      document.body.removeAttribute('arco-theme');
    }
  }, [dark]);
  const renderWebOperations = () => {
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
  const renderMobileOperations = () => {
    return (
      <div className="code-operations mobile">
        <Tooltip
          content={<QRCodeSVG value={pageUrl} size={96} />}
          color="#f7f8fa"
          trigger={'click'}
        >
          <Button
            size="small"
            shape="circle"
            type="secondary"
            style={{ marginLeft: '8px' }}
          >
            <IconQrcode />
          </Button>
        </Tooltip>
        <Button
          size="small"
          shape="circle"
          onClick={openNewPage}
          type="secondary"
          aria-label={t.open}
          style={{ marginLeft: '8px' }}
        >
          <IconLaunch />
        </Button>
      </div>
    );
  };
  return (
    <div className="code-wrapper">
      {isMobile ? (
        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: '8px' }}>
          <div className="flex">
            <div className="preview-code">{children?.[0]}</div>
            <div className="preview-device">
              <iframe src={url} className="preview-device-iframe"></iframe>
              {renderMobileOperations()}
            </div>
          </div>
        </Card>
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
            {renderWebOperations()}
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
