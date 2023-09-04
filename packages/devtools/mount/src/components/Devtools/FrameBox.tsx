import React, { useState } from 'react';
import { LoaderIcon } from '../LoadingIcon';
import styles from './FrameBox.module.scss';

export interface FrameBoxProps {
  src?: string;
}

const FrameBox: React.FC<FrameBoxProps> = ({ src }) => {
  const [showFrame, setShowFrame] = useState(false);

  const handleFrameMount = (el: HTMLIFrameElement | null) => {
    const handleLoad = () => setShowFrame(true);
    el?.addEventListener('load', handleLoad, { once: true });
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.backdrop}
        style={{ display: showFrame ? 'none' : undefined }}
      >
        <LoaderIcon className={styles.loading} />
      </div>
      <iframe
        className={styles.frame}
        ref={handleFrameMount}
        src={src}
      ></iframe>
    </div>
  );
};

export default FrameBox;
