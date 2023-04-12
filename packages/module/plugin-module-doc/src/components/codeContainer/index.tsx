import { useRef, useState } from 'react';
import { Button, Tooltip, Card, Space } from '@arco-design/web-react';
import { IconCode } from '@arco-design/web-react/icon';
import '@arco-design/web-react/es/Button/style';
import '@arco-design/web-react/es/Tooltip/style';
import '@arco-design/web-react/es/Card/style';
import '@arco-design/web-react/es/Space/style';

import './index.scss';
import { normalizeRoutePath } from '../../utils';

const locales = {
  zh: {
    copy: '复制',
    copied: '复制成功',
    expand: '展开代码',
    collapse: '收起代码',
  },
  en: {
    copy: 'Copy',
    copied: 'Copied Success!',
    expand: 'Expand Code',
    collapse: 'Collapse Code',
  },
};

type CodeContainerProps = {
  children: React.ReactNode[];
};

const CodeContainer: React.FC<CodeContainerProps> = props => {
  // const btnCopyRef = useRef(null);
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
    <Card className="code-wrapper" bordered={false}>
      <Card>
        <Space
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {props.children[0]}
          {renderOperations()}
        </Space>
      </Card>
      <div
        className={`code-content ${showCode ? 'show-all' : ''}`}
        ref={codeEleRef}
      >
        {showCode ? props.children?.[1] : null}
      </div>
    </Card>
  );
};

export default CodeContainer;
