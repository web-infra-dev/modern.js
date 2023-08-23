import React from 'react';
import styles from './FrameBox.module.scss';

export interface FrameBoxProps {
  src?: string;
}

const FrameBox: React.FC<FrameBoxProps> = ({ src }) => {
  return <iframe className={styles.container} src={src}></iframe>;
};

export default FrameBox;
