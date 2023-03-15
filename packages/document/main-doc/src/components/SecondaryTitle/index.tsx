import React from 'react';
import styles from './index.module.css';

interface ITitleProps {
  seqNum?: number;
  children: React.ReactNode;
}

const SecondaryTitle: React.FC<ITitleProps> = ({ children }) => (
  <div className={styles.titleWrap}>
    <h2 className={styles.title}>{children}</h2>
  </div>
);

export default SecondaryTitle;
