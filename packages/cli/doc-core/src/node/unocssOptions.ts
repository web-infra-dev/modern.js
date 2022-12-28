import { WebpackPluginOptions } from 'unocss/webpack';
import { presetAttributify, presetUno, presetIcons } from 'unocss';

const options: WebpackPluginOptions = {
  presets: [presetAttributify(), presetUno({}), presetIcons()],
  shortcuts: {
    'flex-center': 'flex justify-center items-center',
    menu: 'flex justify-around items-center text-sm font-bold',
  },
  rules: [
    [
      'border-1',
      {
        border: '1px solid var(--modern-c-divider-light)',
      },
    ],
    [
      /^divider-(\w+)$/,
      ([, w]) => ({
        [`border-${w}`]: '1px solid var(--modern-c-divider-light)',
      }),
    ],
    [
      /^nav-h-(\w+)$/,
      () => ({
        height: `var(--modern-nav-height)`,
      }),
    ],
    [
      'menu-item-before',
      {
        'margin-right': '12px',
        'margin-left': '12px',
        width: '1px',
        height: '24px',
        'background-color': 'var(--modern-c-divider-light)',
        content: '" "',
      },
    ],
    [
      'avoid-text-overflow',
      {
        'white-space': 'nowrap',
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
      },
    ],
    [
      'multi-line-ellipsis',
      {
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        display: '-webkit-box',
        'webkit-line-clamp': '2',
        '-webkit-box-orient': 'vertical',
      },
    ],
  ],
  theme: {
    fontSize: {
      '6xl': ['3.5rem', '4rem'],
    },
    breakpoints: {
      xs: '640px',
      sm: '768px',
      md: '960px',
      lg: '1280px',
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
      bg: {
        default: 'var(--modern-c-bg)',
        soft: 'var(--modern-c-bg-soft)',
        mute: 'var(--modern-c-bg-mute)',
      },
    },
  },
};

export default options;
