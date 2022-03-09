import React from 'react';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const QuickStart: React.FC = () => (
  <div className={styles.quickStart}>
    <span className={styles.title}> Modern.js ——现代 Web 工程体系 </span>
    <Link to="/docs/start/mobile" className={styles.quickStartBtn}>
      快速开始
    </Link>
  </div>
);

export default QuickStart;
