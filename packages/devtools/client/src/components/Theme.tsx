import React, { useEffect } from 'react';
import { Theme as OriginalTheme, ThemeProps } from '@radix-ui/themes';
import { useThemeAppearance } from '@/utils/theme';

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
