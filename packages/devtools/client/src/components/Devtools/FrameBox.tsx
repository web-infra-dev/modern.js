import { Box, BoxProps } from '@radix-ui/themes';
import React from 'react';
import { HiMiniXMark } from 'react-icons/hi2';
import { useSnapshot } from 'valtio';
import { Loading } from '../Loading';
import styles from './FrameBox.module.scss';
import { $inner } from '@/entries/mount/state';

export type FrameBoxProps = BoxProps & {
  src?: string;
  onClose?: () => void;
};

export const FrameBox: React.FC<FrameBoxProps> = ({
  src,
  onClose,
  ...props
}) => {
  const { loaded } = useSnapshot($inner);
  const display = loaded ? 'none' : undefined;
  return (
    <Box className={styles.container} {...props}>
      <iframe className={styles.frame} src={src}></iframe>
      <HiMiniXMark className={styles.closeButton} onClick={onClose} />
      <div className={styles.backdrop} style={{ display }}>
        <Loading />
      </div>
    </Box>
  );
};
