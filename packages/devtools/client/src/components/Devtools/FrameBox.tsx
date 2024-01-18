import React, { useState } from 'react';
import { Box } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import { useAsync } from 'react-use';
import { HiMiniXMark } from 'react-icons/hi2';
import { Loading } from '../Loading';
import styles from './FrameBox.module.scss';
import { $client } from '@/entries/mount/state';

export interface FrameBoxProps
  extends BoxProps,
    React.RefAttributes<HTMLDivElement> {
  src?: string;
  onClose?: () => void;
}

export const FrameBox: React.FC<FrameBoxProps> = ({
  src,
  onClose,
  ...props
}) => {
  const [showFrame, setShowFrame] = useState(false);
  useAsync(async () => {
    const client = await $client;
    client.hooks.hook('onFinishRender', async () => setShowFrame(true));
  }, []);

  return (
    <Box className={styles.container} {...props}>
      <iframe className={styles.frame} src={src}></iframe>
      <HiMiniXMark className={styles.closeButton} onClick={onClose} />
      <div
        className={styles.backdrop}
        style={{ display: showFrame ? 'none' : undefined }}
      >
        <Loading />
      </div>
    </Box>
  );
};
