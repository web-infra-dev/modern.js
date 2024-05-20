import { useSyncExternalStore } from 'react';

export const APPEARANCE_STORAGE_KEY = '__modern_js_devtools_appearance';

export type Appearance = 'light' | 'dark';

const parseAppearance = (raw: unknown) => {
  let ret: Appearance;
  if (raw === 'light' || raw === 'dark') {
    ret = raw;
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    ret = isDark ? 'dark' : 'light';
  }
  return ret;
};

const subscribed = new Array<() => void>();

const subscribeAppearance = (callback: () => void) => {
  subscribed.push(callback);
  const unsubscribe = () => subscribed.splice(subscribed.indexOf(callback), 1);
  return unsubscribe;
};

window.addEventListener('storage', ev => {
  if (ev.key === APPEARANCE_STORAGE_KEY) {
    subscribed.forEach(cb => cb());
  }
});

const getAppearance = (): Appearance => {
  const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
  const ret = parseAppearance(raw);
  return ret;
};

export const useThemeAppearance = () => {
  const appearance = useSyncExternalStore(subscribeAppearance, getAppearance);
  const setAppearance = (
    value: Appearance | ((oldValue: Appearance) => Appearance),
  ) => {
    const newValue =
      typeof value === 'function' ? value(getAppearance()) : value;
    localStorage.setItem(APPEARANCE_STORAGE_KEY, newValue);
    subscribed.forEach(cb => cb());
  };
  return [appearance, setAppearance] as const;
};
