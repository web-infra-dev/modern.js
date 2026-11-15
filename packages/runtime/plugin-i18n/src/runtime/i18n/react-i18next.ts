// Kept in its own module so the CLI plugin can bundle only react-i18next
// eagerly. instance.ts also imports i18next dynamically as a fallback, which
// must stay lazy for apps that pass their own i18n instance.
export async function getInitReactI18next() {
  try {
    const { initReactI18next } = await import('react-i18next');
    return initReactI18next;
  } catch (error) {
    return null;
  }
}

export async function getI18nextProvider() {
  try {
    const { I18nextProvider } = await import('react-i18next');
    return I18nextProvider;
  } catch (error) {
    return null;
  }
}
