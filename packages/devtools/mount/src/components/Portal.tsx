import React from 'react';
import { createPortal } from 'react-dom';
import Visible from './Visible';

export interface PortalProps {
  children: React.ReactNode;
  show?: boolean;
  keepAlive?: boolean;
  onClose?: () => void;
  root?: Element | DocumentFragment;
}

const Portal: React.FC<PortalProps> = props => {
  const keepAlive = props.keepAlive ?? true;
  const { show, root = document.body } = props;

  return createPortal(
    <Visible keepAlive={keepAlive} when={show}>
      {props.children}
    </Visible>,
    root,
  );
};

export default Portal;
