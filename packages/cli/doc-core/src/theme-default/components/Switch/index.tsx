import React from 'react';
import styles from './index.module.scss';

interface Props {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
}
export function Switch(props: Props) {
  return (
    <button
      className={`${styles.switch} ${props.className}`}
      id={props.id ?? ''}
      type="button"
      role="switch"
      {...(props.onClick ? { onClick: props.onClick } : {})}
    >
      <span className={styles.check}>
        <span className={styles.icon}>{props.children}</span>
      </span>
    </button>
  );
}
