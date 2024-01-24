import React from 'react';
import { useAsyncFn } from 'react-use';
import { Promisable } from 'type-fest';
import { Box } from '@radix-ui/themes';
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
    <Box
      className={styles.container}
      onClick={handleClick}
      data-type={props.type ?? 'default'}
      data-loading={clickState.loading}
    >
      {props.children}
    </Box>
  );
};
