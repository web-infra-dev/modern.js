import React from 'react';
import { useToggle } from 'react-use';
import { Button } from '@geist-ui/core';
import { withQuery } from 'ufo';
import Visible from '../Visible';
import styles from './Action.module.scss';
import FrameBox from './FrameBox';

export interface DevtoolsActionProps {
  client: string;
  dataSource: string;
  version: string;
}

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
        <Button shadow onClick={toggleDevtools}>
          Toggle DevTools
        </Button>
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
