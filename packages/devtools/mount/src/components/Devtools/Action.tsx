import React from 'react';
import { useToggle } from 'react-use';
import { withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';
import { Options } from '@/types';

export type DevtoolsActionProps = Options;

const DevtoolsAction: React.FC<DevtoolsActionProps> = ({
  endpoint,
  dataSource,
  version,
}) => {
  const [showDevtools, toggleDevtools] = useToggle(false);
  const src = withQuery(endpoint, { src: dataSource, ver: version });

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
