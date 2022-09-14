import React from 'react';
import styles from './index.module.css';

export const Featurelayout: React.FC = ({ children }) => (
  <div className={styles['feature-layout']}>{children}</div>
);

export default Featurelayout;
