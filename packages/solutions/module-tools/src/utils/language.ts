export const initLocalLanguage = async () => {
  const local = await import('../locale');
  const { getLocaleLanguage } = await import(
    '@modern-js/plugin-i18n/language-detector'
  );
  const locale = getLocaleLanguage();
  local.i18n.changeLanguage({ locale });
  return local;
};
