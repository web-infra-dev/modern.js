import { useThemeAppearance } from '@/utils/theme';
import { Theme as OriginalTheme, type ThemeProps } from '@radix-ui/themes';
import type React from 'react';
import { useEffect } from 'react';

export const Theme: React.FC<
  ThemeProps & React.RefAttributes<HTMLDivElement>
> = ({ children, ...props }) => {
  const [appearance] = useThemeAppearance();
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(appearance);
  }, [appearance]);
  return (
    <OriginalTheme {...props} appearance={appearance}>
      {children}
    </OriginalTheme>
  );
};
