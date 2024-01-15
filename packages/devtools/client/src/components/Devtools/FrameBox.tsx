import React, { useState } from 'react';
import { Box } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import { HiMiniXMark } from 'react-icons/hi2';
import { LoaderIcon } from '../LoadingIcon';
import styles from './FrameBox.module.scss';

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

  return (
    <Box className={styles.container} {...props}>
      <iframe
        className={styles.frame}
        onLoad={() => setShowFrame(true)}
        src={src}
      ></iframe>
      <HiMiniXMark className={styles.closeButton} onClick={onClose} />
      <div
        className={styles.backdrop}
        style={{ display: showFrame ? 'none' : undefined }}
      >
        <LoaderIcon className={styles.loading} />
      </div>
    </Box>
  );
};
