import { ROUTE_BASENAME, SetupClientOptions } from '@modern-js/devtools-kit';
import React from 'react';
import { useToggle } from 'react-use';
import { parseURL, stringifyParsedURL, withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';
import { useStickyDraggable } from '@/utils/draggable';

const parseDataSource = (url: string) => {
  const newSrc = parseURL(url);
  return stringifyParsedURL({
    protocol: location.protocol === 'https:' ? 'wss:' : 'ws:',
    host: location.host,
    ...newSrc,
    pathname: newSrc.pathname || `${ROUTE_BASENAME}/rpc`,
  });
};

const DevtoolsAction: React.FC<SetupClientOptions> = props => {
  const logoSrc = process.env._MODERN_DEVTOOLS_LOGO_SRC!;
  const opts: Required<SetupClientOptions> = {
    endpoint: 'https://modernjs.dev/devtools',
    ...props,
    dataSource: parseDataSource(props.dataSource ?? ''),
  };
  const [showDevtools, toggleDevtools] = useToggle(false);

  let src = opts.endpoint;
  src = withQuery(src, { src: opts.dataSource });

  const draggable = useStickyDraggable({ clamp: true });

  return (
    <>
      <Visible when={showDevtools} keepAlive={true}>
        <div className={styles.container}>
          <FrameBox
            src={src}
            style={{ pointerEvents: draggable.isDragging ? 'none' : 'auto' }}
          />
        </div>
      </Visible>
      <button
        className={styles.fab}
        onClick={() => toggleDevtools()}
        {...draggable.props}
      >
        <img className={styles.logo} src={logoSrc} alt="" />
        <span>Toggle DevTools</span>
      </button>
    </>
  );
};

export default DevtoolsAction;
