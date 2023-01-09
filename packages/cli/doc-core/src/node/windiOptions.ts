import { defineConfig } from 'windicss/helpers';
import { PACKAGE_ROOT } from './constants';

export default (themeDir: string) =>
  defineConfig({
    extract: {
      include: [
        `${PACKAGE_ROOT}/src/**/*.{tsx,html,jsx}`,
        `${themeDir}/**/*.{tsx,jsx,html}`,
      ],
      exclude: [
        '**/node_modules/**/*',
        '**/.git/**/*',
        '**/doc_build/**/*',
        '**/dist/**/*',
      ],
    },
    shortcuts: {
      'flex-center': 'flex justify-center items-center',
      menu: 'flex justify-around items-center text-sm font-bold',
    },
    attributify: true,
    theme: {
      backgroundColor: theme => ({
        ...theme('colors'),
        white: 'var(--modern-c-bg)',
        soft: 'var(--modern-c-bg-soft)',
        mute: 'var(--modern-c-bg-mute)',
      }),
      extend: {
        breakpoints: {
          xs: '640px',
          sm: '768px',
          md: '960px',
          lg: '1280px',
        },
        maxWidth: {
          '1/4': '25%',
          '1/2': '50%',
          '3/4': '75%',
          '4/4': '100%',
        },
        colors: {
          brandLight: 'var(--modern-c-brand-light)',
          brandDark: 'var(--modern-c-brand-dark)',
          brand: 'var(--modern-c-brand)',
          text: {
            1: 'var(--modern-c-text-1)',
            2: 'var(--modern-c-text-2)',
            3: 'var(--modern-c-text-3)',
            4: 'var(--modern-c-text-4)',
          },
          divider: {
            default: 'var(--modern-c-divider)',
            light: 'var(--modern-c-divider-light)',
            dark: 'var(--modern-c-divider-dark)',
          },
          gray: {
            light: {
              1: 'var(--modern-c-gray-light-1)',
              2: 'var(--modern-c-gray-light-2)',
              3: 'var(--modern-c-gray-light-3)',
              4: 'var(--modern-c-gray-light-4)',
            },
          },
        },
      },
    },
  });
