import React from 'react';
import { useGetSet, useToggle } from 'react-use';
import { withQuery, stringifyParsedURL, parseURL } from 'ufo';
import { SetupClientOptions } from '@modern-js/devtools-kit';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';

const parseDataSource = (url: string) => {
  const newSrc = parseURL(url);
  return stringifyParsedURL({
    protocol: location.protocol === 'https:' ? 'wss:' : 'ws:',
    host: location.host,
    ...newSrc,
    pathname: newSrc.pathname || '/_modern_js/devtools/rpc',
  });
};

const useStickyDraggable = () => {
  const [isDragging, setIsDragging] = useGetSet(false);
  const handleMouseDown = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const { offsetX, offsetY } = e.nativeEvent;
    const handleMousemove = (e: MouseEvent) => {
      if (e.movementX + e.movementY > 1) {
        setIsDragging(true);
      }

      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      const distances = [
        { prop: 'top', value: e.clientY } as const,
        { prop: 'bottom', value: window.innerHeight - e.clientY } as const,
        { prop: 'left', value: e.clientX } as const,
        { prop: 'right', value: window.innerWidth - e.clientX } as const,
      ];
      const [primary, ...rest] = distances.sort((a, b) => a.value - b.value);
      target.style[primary.prop] = '10px';
      for (const unset of rest) {
        target.style.removeProperty(unset.prop);
      }
      if (['top', 'bottom'].includes(primary.prop)) {
        target.style.left = `${x}px`;
      } else {
        target.style.top = `${y}px`;
      }
    };
    window.addEventListener('mousemove', handleMousemove);
    window.addEventListener('blur', () => {
      setTimeout(() => setIsDragging(false), 0);
      window.removeEventListener('mousemove', handleMousemove);
    });
    window.addEventListener(
      'mouseup',
      () => {
        setTimeout(() => setIsDragging(false), 0);
        window.removeEventListener('mousemove', handleMousemove);
      },
      { once: true },
    );
  };
  return {
    onMouseDown: handleMouseDown,
    isDragging: isDragging(),
  };
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

  const { isDragging, onMouseDown } = useStickyDraggable();

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => {
          isDragging || toggleDevtools();
        }}
        onMouseDown={onMouseDown}
      >
        <img className={styles.logo} src={logoSrc} alt="" />
        <span>Toggle DevTools</span>
      </button>
      <Visible when={showDevtools} keepAlive={true}>
        <div className={styles.container}>
          <FrameBox
            src={src}
            style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
          />
        </div>
      </Visible>
    </>
  );
};

export default DevtoolsAction;
