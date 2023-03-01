import { APPEARANCE_KEY } from '@/shared/utils';

let classList: DOMTokenList | undefined;
// Determine if the theme mode of the user's operating system is dark
let userPreference: string;
let query: MediaQueryList;

const setClass = (dark: boolean): void => {
  classList?.[dark ? 'add' : 'remove']('dark');
};

const updateAppearance = (): void => {
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
