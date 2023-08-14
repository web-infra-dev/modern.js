import React from 'react';
import { useToggle } from 'react-use';
import { withQuery } from 'ufo';
import Modal from '../Modal';

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
      <button onClick={toggleDevtools}>Toggle DevTools</button>
      {showDevtools && <iframe src={src}></iframe>}
    </Modal>
  );
};

export default DevtoolsAction;
