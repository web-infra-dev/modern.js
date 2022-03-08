import React from 'react';
import styles from './index.module.css';

interface ITitleProps{
  seqNum?: number;
}

const SecondaryTitle: React.FC<ITitleProps> = ({ children, seqNum }) => (
  <div className={styles.titleWrap}>
    <h2 className={styles.title}>{children}</h2>
    {seqNum && <span className={styles.seqNum}>
      <img className={styles.seqImg} src="/img/homepage/seq-wrap.png" alt="" />
      <span className={styles.num}>0{seqNum}</span>
    </span>}
  </div>
);

export default SecondaryTitle;
