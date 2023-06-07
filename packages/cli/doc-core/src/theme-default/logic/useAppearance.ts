import siteData from 'virtual-site-data';
import { APPEARANCE_KEY } from '@/shared/utils';

declare global {
  interface Window {
    MODERN_THEME?: string;
  }
}

let classList: DOMTokenList | undefined;
// Determine if the theme mode of the user's operating system is dark
let userPreference: string;
let query: MediaQueryList;

const setClass = (dark: boolean): void => {
  classList?.[dark ? 'add' : 'remove']('dark');
};

const updateAppearance = (): void => {
  const disableDarkMode = siteData.themeConfig.darkMode === false;
  if (disableDarkMode) {
    setClass(false);
    return;
  }
  // We set the MODERN_THEME as a global variable to determine whether the theme is dark or light.
  if (window.MODERN_THEME) {
    setClass(window.MODERN_THEME === 'dark');
    return;
  }
  const userPreference = localStorage.getItem(APPEARANCE_KEY) || 'auto';
  query = window.matchMedia('(prefers-color-scheme: dark)');
  setClass(
    userPreference === 'auto' ? query.matches : userPreference === 'dark',
  );
};

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  // When user preference is auto,the modern theme will change with the system user's operating system theme.
  // eslint-disable-next-line prefer-destructuring
  classList = document.documentElement.classList;
  updateAppearance();
}

export const isDarkMode = () => classList?.contains('dark');

export const getToggle = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', updateAppearance);
  }
  return () => {
    const isDark = isDarkMode();
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      setClass(!isDark);
      userPreference = isDark ? 'light' : 'dark';
      localStorage.setItem(APPEARANCE_KEY, userPreference);
    }
  };
};
