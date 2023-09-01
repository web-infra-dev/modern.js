import React from 'react';
import { useToggle } from 'react-use';
import { withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';
import { Options } from '@/types';

export type DevtoolsActionProps = Options;

const DevtoolsAction: React.FC<DevtoolsActionProps> = ({
  client,
  dataSource,
  version,
}) => {
  const [showDevtools, toggleDevtools] = useToggle(false);
  const src = withQuery(client, { src: dataSource, ver: version });

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
