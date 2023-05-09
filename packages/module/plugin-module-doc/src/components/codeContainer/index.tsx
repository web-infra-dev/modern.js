import { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, Card } from '@arco-design/web-react';
import { IconCode } from '@arco-design/web-react/icon';
import '@arco-design/web-react/es/Button/style';
import '@arco-design/web-react/es/Tooltip/style';
import '@arco-design/web-react/es/Card/style';

import './index.scss';
import { normalizeRoutePath, useDark } from '@modern-js/doc-core/runtime';
import { locales } from '../../locales';

type CodeContainerProps = {
  children: React.ReactNode[];
};

const CodeContainer: React.FC<CodeContainerProps> = props => {
  const codeEleRef = useRef(null);
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
            marginRight: '44px',
          }}
        >
          {props.children[0]}
        </div>
        {renderOperations()}
      </Card>
      <div
        className={`code-content ${showCode ? 'show-all' : ''}`}
        ref={codeEleRef}
      >
        {props.children?.[1]}
      </div>
    </div>
  );
};

export default CodeContainer;
