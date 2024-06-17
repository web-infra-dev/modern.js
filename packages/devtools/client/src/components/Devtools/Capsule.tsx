import { Flex, Theme } from '@radix-ui/themes';
import React, { useEffect, useState } from 'react';
import { useAsync, useEvent, useToggle } from 'react-use';
import { HiMiniCursorArrowRipple } from 'react-icons/hi2';
import Visible from '../Visible';
import styles from './Capsule.module.scss';
import { FrameBox } from './FrameBox';
import { DevtoolsCapsuleButton } from './Button';
import { useStickyDraggable } from '@/utils/draggable';
import { $client, wallAgent } from '@/entries/mount/state';
import { pTimeout } from '@/utils/promise';
import { ReactDevtoolsWallListener } from '@/utils/react-devtools';
import { useThemeAppearance } from '@/utils/theme';

const parseDeepLink = (url = window.location) => {
  // Expected: #/__devtools/doctor
  const { hash } = url;
  // Parse pathname from hash.
  const pathname = hash.match(/^#\/__devtools(.*)/)?.[1];
  // Check if match the expected pattern.
  if (typeof pathname !== 'string') return null;
  if (pathname === '') return '/';
  return pathname;
};

export interface DevtoolsCapsuleProps {
  src: string;
  logo: string;
}

export const DevtoolsCapsule: React.FC<DevtoolsCapsuleProps> = props => {
  const deepLink = parseDeepLink();
  const [showDevtools, toggleDevtools] = useToggle(Boolean(deepLink));
  const [loadDevtools, setLoadDevtools] = useState(false);

  const draggable = useStickyDraggable({ clamp: true });

  const [appearance] = useThemeAppearance();

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
      client.remote.pullUp('/react/components#inspecting');
    } catch (e) {
      console.error(e);
      document.documentElement.style.removeProperty('cursor');
    }
  };

  useAsync(async () => {
    if (!deepLink) return;
    const client = await pTimeout($client, 10_000);
    client.remote.pullUp(deepLink);
  }, []);

  return (
    <Theme
      appearance={appearance}
      className={appearance}
      hasBackground={false}
      style={{ height: 0, width: 0, minHeight: 0, minWidth: 0 }}
    >
      <Visible when={showDevtools} keepAlive={true} load={loadDevtools}>
        <div className={styles.container}>
          <FrameBox
            src={props.src}
            onClose={() => toggleDevtools(false)}
            style={{ pointerEvents: draggable.isDragging ? 'none' : 'auto' }}
          />
        </div>
      </Visible>
      <Flex className={styles.fab} {...draggable.props} align="center">
        <DevtoolsCapsuleButton type="primary" onClick={toggleDevtools}>
          <img className={styles.logo} src={props.logo} />
        </DevtoolsCapsuleButton>
        <DevtoolsCapsuleButton onClick={handleClickInspect}>
          <HiMiniCursorArrowRipple />
        </DevtoolsCapsuleButton>
      </Flex>
    </Theme>
  );
};
