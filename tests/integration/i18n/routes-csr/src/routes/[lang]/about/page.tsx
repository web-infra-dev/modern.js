import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();
  return (
    <>
      <div id="about">{t('about')}</div>
      <div id="key_1">{t('key_1')}</div>
    </>
  );
};
