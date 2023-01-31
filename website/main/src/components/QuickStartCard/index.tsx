import React from 'react';
import { withBase } from '@modern-js/doc-tools/runtime';
import styles from './index.module.css';

const QuickStart: React.FC = () => (
  <div className={styles.quickStart}>
    <span className={styles.title}> Modern.js ——现代 Web 工程体系 </span>
    <a
      href={withBase('/guides/get-started/quick-start')}
      className={styles.quickStartBtn}
    >
      快速开始
    </a>
  </div>
);

export default QuickStart;
