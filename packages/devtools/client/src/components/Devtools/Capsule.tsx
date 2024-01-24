import { SetupClientParams } from '@modern-js/devtools-kit';
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
import { $client, bridge } from '@/entries/mount/state';
import { pTimeout } from '@/utils/promise';

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
    const handleStartInspecting = () => toggleDevtools(false);
    bridge.addListener('startInspectingNative', handleStartInspecting);
    return () => {
      bridge.removeListener('startInspectingNative', handleStartInspecting);
    };
  }, []);

  const handleClickInspect = async () => {
    toggleDevtools(false);
    setLoadDevtools(true);
    try {
      const client = await pTimeout($client, 10_000);
      client.remote.pullUpReactInspector();
    } catch (e) {
      console.error(e);
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
      <Flex asChild align="center">
        <div className={styles.fab} {...draggable.props}>
          <DevtoolsCapsuleButton type="primary" onClick={toggleDevtools}>
            <img className={styles.logo} src={logoSrc}></img>
          </DevtoolsCapsuleButton>
          <DevtoolsCapsuleButton onClick={handleClickInspect}>
            <HiMiniCursorArrowRipple />
          </DevtoolsCapsuleButton>
        </div>
      </Flex>
    </Theme>
  );
};
