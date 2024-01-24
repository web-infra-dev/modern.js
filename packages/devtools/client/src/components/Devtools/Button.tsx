import React from 'react';
import { useAsyncFn } from 'react-use';
import { Promisable } from 'type-fest';
import styles from './Button.module.scss';

export interface DevtoolsCapsuleButtonProps extends React.PropsWithChildren {
  type?: 'primary' | 'default';
  onClick: () => Promisable<void>;
}

export const DevtoolsCapsuleButton: React.FC<
  DevtoolsCapsuleButtonProps
> = props => {
  const [clickState, handleClick] = useAsyncFn(
    () => Promise.resolve(props.onClick()),
    [],
  );

  return (
    <button
      className={styles.container}
      onClick={handleClick}
      data-type={props.type ?? 'default'}
      disabled={clickState.loading}
    >
      {props.children}
    </button>
  );
};
