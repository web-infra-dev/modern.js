import React from 'react';
import styles from './index.module.css';

export const FeatureLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className={styles['feature-layout']}>{children}</div>;

export default FeatureLayout;
