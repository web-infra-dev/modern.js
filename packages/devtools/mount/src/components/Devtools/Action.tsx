import React from 'react';
import { useToggle } from 'react-use';
import { withQuery } from 'ufo';
import Modal from '../Modal';
import Visible from '../Visible';
import styles from './Action.module.scss';

export interface DevtoolsActionProps {
  client: string;
  dataSource: string;
  version: string;
  rootElement?: Element | DocumentFragment;
}

const DevtoolsAction: React.FC<DevtoolsActionProps> = ({
  client,
  dataSource,
  version,
  rootElement,
}) => {
  const [showDevtools, toggleDevtools] = useToggle(false);
  const src = withQuery(client, { src: dataSource, ver: version });

  return (
    <Modal show={true} root={rootElement}>
      <button className={styles.fab} onClick={toggleDevtools}>
        Toggle DevTools
      </button>
      <Visible when={showDevtools}>
        <iframe src={src}></iframe>
      </Visible>
    </Modal>
  );
};

export default DevtoolsAction;
