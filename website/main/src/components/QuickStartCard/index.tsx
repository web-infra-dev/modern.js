import React from 'react';
import { useI18n, useUrl } from '../../i18n';
import styles from './index.module.css';

const QuickStart: React.FC = () => {
  const t = useI18n();
  return (
    <div className={styles.quickStart}>
      <span className={styles.title}>{t('slogan')}</span>
      <a
        href={useUrl('/guides/get-started/quick-start')}
        className={styles.quickStartBtn}
      >
        {t('quickStart')}
      </a>
    </div>
  );
};

export default QuickStart;
