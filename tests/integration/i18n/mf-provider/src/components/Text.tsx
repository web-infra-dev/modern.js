import { useTranslation } from 'react-i18next';
import i18next from '../i18n';
import styles from './text.module.css';

export default () => {
  const { t } = useTranslation();
  return (
    <div id="about" className={styles.about}>
      remote components
      {/** use i18next.t to get the key will use provider's i18n instance */}
      <p className={styles.text1}>{i18next.t('key')}</p>
      {/** use useTranslation to get the key will use consumer's i18n instance */}
      <p className={styles.text2}>{t('about')}</p>
    </div>
  );
};
