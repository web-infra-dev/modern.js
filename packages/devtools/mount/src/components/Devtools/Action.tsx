import React from 'react';
import { useToggle } from 'react-use';
import { joinURL, withQuery } from 'ufo';
import { SetupClientOptions } from '@modern-js/devtools-kit';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';

const getDefaultRPC = () => {
  const url = new URL('ws://localhost/_modern_js/devtools/rpc');
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  url.host = location.host;
  return url.href;
};

const DevtoolsAction: React.FC<SetupClientOptions> = props => {
  const version = process.env.VERSION!;
  const opts: Required<SetupClientOptions> = {
    version,
    dataSource: getDefaultRPC(),
    endpoint: 'https://modernjs.dev/devtools',
    ...props,
  };
  const [showDevtools, toggleDevtools] = useToggle(false);

  const ver = opts.version === true ? version : opts.version;
  let src = opts.endpoint;
  ver && (src = joinURL(src, ver));
  src = withQuery(src, { src: opts.dataSource });

  return (
    <>
      <div className={styles.fab}>
        <button onClick={toggleDevtools}>Toggle DevTools</button>
      </div>
      <Visible when={showDevtools} keepAlive={true}>
        <div className={styles.container}>
          <FrameBox src={src} />
        </div>
      </Visible>
    </>
  );
};

export default DevtoolsAction;
