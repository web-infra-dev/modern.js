import { ROUTE_BASENAME, SetupClientOptions } from '@modern-js/devtools-kit';
import React, { useState } from 'react';
import { useEvent, useToggle } from 'react-use';
import { Flex, Theme } from '@radix-ui/themes';
import { parseURL, stringifyParsedURL, withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import { FrameBox } from './FrameBox';
import { ReactComponent as DevToolsIcon } from './heading.svg';
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

  const [appearance, setAppearance] = useState<'light' | 'dark'>(() => {
    const ret =
      localStorage.getItem('__modern_js_devtools_appearance') ?? 'light';
    localStorage.setItem('__modern_js_devtools_appearance', ret);
    return ret as any;
  });
  useEvent('storage', (e: StorageEvent) => {
    if (e.key === '__modern_js_devtools_appearance') {
      setAppearance((e.newValue as any) || undefined);
    }
  });

  useEvent('keydown', (e: KeyboardEvent) => {
    e.shiftKey && e.altKey && e.code === 'KeyD' && toggleDevtools();
  });

  return (
    <Theme appearance={appearance} className={appearance}>
      <Visible when={showDevtools} keepAlive={true}>
        <div className={styles.container}>
          <FrameBox
            src={src}
            onClose={() => toggleDevtools(false)}
            style={{ pointerEvents: draggable.isDragging ? 'none' : 'auto' }}
          />
        </div>
      </Visible>
      <Flex asChild py="1" px="2" align="center">
        <button
          className={styles.fab}
          onClick={() => toggleDevtools()}
          {...draggable.props}
        >
          <img className={styles.logo} src={logoSrc} alt="" />
          <DevToolsIcon className={styles.heading} />
        </button>
      </Flex>
    </Theme>
  );
};

export default DevtoolsAction;
