import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.scss';

export interface ModalProps {
  children: React.ReactNode;
  show?: boolean;
  keepAlive?: boolean;
  onClose?: () => void;
  backdrop?: boolean | string;
  root?: Element | DocumentFragment;
}

const Modal: React.FC<ModalProps> = props => {
  const keepAlive = props.keepAlive ?? true;

  const { show, backdrop, root = document.body } = props;
  const opened = useRef(false);
  if (show) {
    opened.current = true;
  }
  const loadModal = keepAlive ? opened.current : show;
  const visible = keepAlive ? show : true;
  const handleClose = () => {
    props.onClose?.();
  };

  useEffect(() => {
    document.body.classList.toggle(styles.frozeScroll, show);
  }, [show]);

  const backdropCls = typeof backdrop === 'string' ? backdrop : styles.backdrop;
  const inner = loadModal && (
    <div
      className={styles.modal}
      style={{ display: visible ? 'flex' : 'none' }}
    >
      {backdrop && <div className={backdropCls} onClick={handleClose} />}
      {props.children}
    </div>
  );
  return createPortal(inner, root);
};

export default Modal;
