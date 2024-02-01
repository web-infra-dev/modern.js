import { SetupClientParams } from '@modern-js/devtools-kit/runtime';
import { Flex, Theme } from '@radix-ui/themes';
import React, { useEffect, useState } from 'react';
import { useEvent, useToggle } from 'react-use';
import { HiMiniCursorArrowRipple } from 'react-icons/hi2';
import { withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Capsule.module.scss';
import { FrameBox } from './FrameBox';
import { DevtoolsCapsuleButton } from './Button';
import { useStickyDraggable } from '@/utils/draggable';
import { $client, wallAgent } from '@/entries/mount/state';
import { pTimeout } from '@/utils/promise';
import { ReactDevtoolsWallListener } from '@/utils/react-devtools';

export const DevtoolsCapsule: React.FC<SetupClientParams> = props => {
  const logoSrc = props.def.assets.logo;
  const [showDevtools, toggleDevtools] = useToggle(false);
  const [loadDevtools, setLoadDevtools] = useState(false);

  const src = withQuery(props.endpoint, { src: props.dataSource });

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

  useEffect(() => {
    const handleBeforeWallReceive: ReactDevtoolsWallListener = e => {
      if (e.event !== 'startInspectingNative') return;
      toggleDevtools(false);
      document.documentElement.style.setProperty('cursor', 'cell');
    };
    wallAgent.hook('receive', handleBeforeWallReceive);

    const handleBeforeWallSend: ReactDevtoolsWallListener = e => {
      if (e.event !== 'stopInspectingNative') return;
      toggleDevtools(true);
      document.documentElement.style.removeProperty('cursor');
    };
    wallAgent.hook('send', handleBeforeWallSend);

    return () => {
      wallAgent.removeHook('send', handleBeforeWallSend);
    };
  }, []);

  const handleClickInspect = async () => {
    document.documentElement.style.setProperty('cursor', 'wait');
    toggleDevtools(false);
    setLoadDevtools(true);
    try {
      const client = await pTimeout($client, 10_000);
      client.remote.pullUpReactInspector();
    } catch (e) {
      console.error(e);
      document.documentElement.style.removeProperty('cursor');
    }
  };

  return (
    <Theme appearance={appearance} className={appearance}>
      <Visible when={showDevtools} keepAlive={true} load={loadDevtools}>
        <div className={styles.container}>
          <FrameBox
            src={src}
            onClose={() => toggleDevtools(false)}
            style={{ pointerEvents: draggable.isDragging ? 'none' : 'auto' }}
          />
        </div>
      </Visible>
      <Flex className={styles.fab} {...draggable.props} align="center">
        <DevtoolsCapsuleButton type="primary" onClick={toggleDevtools}>
          <img className={styles.logo} src={logoSrc}></img>
        </DevtoolsCapsuleButton>
        <DevtoolsCapsuleButton onClick={handleClickInspect}>
          <HiMiniCursorArrowRipple />
        </DevtoolsCapsuleButton>
      </Flex>
    </Theme>
  );
};
