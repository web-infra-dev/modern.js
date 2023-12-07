import { SetupClientParams } from '@modern-js/devtools-kit';
import { HiCursorArrowRays } from 'react-icons/hi2';
import { Flex, Theme } from '@radix-ui/themes';
import React, { useState } from 'react';
import { useEvent, useToggle } from 'react-use';
import { withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import { FrameBox } from './FrameBox';
import { useStickyDraggable } from '@/utils/draggable';

export const DevtoolsActionButton: React.FC<SetupClientParams> = props => {
  const logoSrc = props.def.assets.logo;
  const [showDevtools, toggleDevtools] = useToggle(false);
  const [loadFrameBox, setLoadFrameBox] = useState<boolean>();

  const [src, setSrc] = useState(
    withQuery(props.endpoint, { src: props.dataSource }),
  );

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

  const handleClickInspector = () => {
    toggleDevtools(false);
    setLoadFrameBox(true);
    setSrc(`/__devtools/react/components?inspect=${Date.now()}`);
  };

  return (
    <Theme appearance={appearance} className={appearance}>
      <Visible when={showDevtools} load={loadFrameBox} keepAlive={true}>
        <div className={styles.container}>
          <FrameBox
            src={src}
            onClose={() => toggleDevtools(false)}
            style={{ pointerEvents: draggable.isDragging ? 'none' : 'auto' }}
          />
        </div>
      </Visible>
      <Flex className={styles.fab} {...draggable.props}>
        <img
          className={styles.actionLogo}
          onClick={toggleDevtools}
          src={logoSrc}
        />
        <HiCursorArrowRays
          onClick={handleClickInspector}
          className={styles.action}
        />
      </Flex>
    </Theme>
  );
};
