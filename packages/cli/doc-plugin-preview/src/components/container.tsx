import { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, Card } from '@arco-design/web-react';
import { IconCode } from '@arco-design/web-react/icon';
import '@arco-design/web-react/es/Button/style';
import '@arco-design/web-react/es/Tooltip/style';
import '@arco-design/web-react/es/Card/style';

import './container.scss';
import { normalizeRoutePath, useDark } from '@modern-js/doc-core/runtime';
import { locales } from '../locales';
import Preview from './preview';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: boolean;
  url: string;
};

const Container: React.FC<ContainerProps> = props => {
  const codeEleRef = useRef(null);
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
  const dark = useDark();
  useEffect(() => {
    if (dark) {
      document.body.setAttribute('arco-theme', 'dark');
    } else {
      document.body.removeAttribute('arco-theme');
    }
  }, [dark]);
  const renderOperations = () => {
    const t = locales[lang];

    return (
      <div className="code-operations">
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
      <Card>
        <div
          style={{
            overflow: 'auto',
          }}
        >
          {isMobile ? <Preview url={url} /> : children?.[1]}
        </div>
        {renderOperations()}
      </Card>
      <div
        className={`code-content ${showCode ? 'show-all' : ''}`}
        ref={codeEleRef}
      >
        {children?.[0]}
      </div>
    </div>
  );
};

export default Container;
