import { SetupClientParams } from '@modern-js/devtools-kit';
import { Flex, Theme } from '@radix-ui/themes';
import React, { useState } from 'react';
import { useEvent, useToggle } from 'react-use';
import { withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import { FrameBox } from './FrameBox';
import { ReactComponent as DevToolsIcon } from './heading.svg';
import { useStickyDraggable } from '@/utils/draggable';

export const DevtoolsActionButton: React.FC<SetupClientParams> = props => {
  const logoSrc = props.def.assets.logo;
  const [showDevtools, toggleDevtools] = useToggle(false);

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
