import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: 'blue',
        secondary: 'yellow',

        dark: {
          primary: 'sky',
          secondary: 'light-yellow',
        },
      },
    },
  },

  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.content-auto': {
          'content-visibility': 'auto',
        },
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        },
      });
    }),

    plugin(function ({ addComponents }) {
      addComponents({
        '.btn': {
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontWeight: '500',
          transition: 'all 0.2s',
        },
      });
    }),
  ],
} as Config;
