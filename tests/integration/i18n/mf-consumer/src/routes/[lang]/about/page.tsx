import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();
  return <div id="about">{t('about')}</div>;
};
