import React from 'react';
import { useToggle } from 'react-use';
import { joinURL, withQuery, stringifyParsedURL, parseURL } from 'ufo';
import {
  RPC_SERVER_PATHNAME,
  SetupClientOptions,
} from '@modern-js/devtools-kit';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';

const parseDataSource = (url: string) => {
  const newSrc = parseURL(url);
  return stringifyParsedURL({
    protocol: location.protocol === 'https:' ? 'wss:' : 'ws:',
    host: location.host,
    ...newSrc,
    pathname: newSrc.pathname || RPC_SERVER_PATHNAME,
  });
};

const DevtoolsAction: React.FC<SetupClientOptions> = props => {
  const version = process.env.VERSION!;
  const opts: Required<SetupClientOptions> = {
    version,
    endpoint: 'https://modernjs.dev/devtools',
    ...props,
    dataSource: parseDataSource(props.dataSource ?? ''),
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
