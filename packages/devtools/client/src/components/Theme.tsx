import React, { useEffect } from 'react';
import {
  Theme as OriginalTheme,
  ThemeProps,
  useThemeContext,
} from '@radix-ui/themes';
import { getQuery } from 'ufo';
import _ from 'lodash';

const isAppearance = (value: string): value is 'inherit' | 'light' | 'dark' =>
  ['inherit', 'light', 'dark'].includes(value);

const ThemeGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { appearance } = useThemeContext();
  useEffect(() => {
    localStorage.setItem('__modern_js_devtools_appearance', appearance);
    if (appearance !== 'inherit') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(appearance);
    }
  }, [appearance]);
  return <>{children}</>;
};

export const Theme: React.FC<
  ThemeProps & React.RefAttributes<HTMLDivElement>
> = ({ appearance, children, ...props }) => {
  const initialAppearance =
    appearance ||
    _.castArray(getQuery(location.href).appearance)[0] ||
    localStorage.getItem('__modern_js_devtools_appearance') ||
    'light';
  if (!isAppearance(initialAppearance)) {
    throw new Error('Initial appearance value is invalid.');
  }
  return (
    <OriginalTheme {...props} appearance={initialAppearance}>
      <ThemeGuard>{children}</ThemeGuard>
    </OriginalTheme>
  );
};
