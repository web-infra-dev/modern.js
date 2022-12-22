# DesignSystem
This chapter describes the configuration related to designSystem

:::tips
The Tailwind CSS feature needs to be enabled first via `pnpm run new`.
:::

- type: `Object`
- default: `see configuration details below`.

<details
  <summary>designSystem configuration details</summary>
```js
  const designSystem =  {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',

      black: '#000',
      white: '#fff',

      gray: {
        100: '#f7fafc',
        200: '#edf2f7',
        300: '#e2e8f0',
        400: '#cbd5e0',
        500: '#a0aec0',
        600: '#718096',
        700: '#4a5568',
        800: '#2d3748',
        900: '#1a202c',
      },
      red: {
        100: '#fff5f5',
        200: '#fed7d7',
        300: '#feb2b2',
        400: '#fc8181',
        500: '#f56565',
        600: '#e53e3e',
        700: '#c53030',
        800: '#9b2c2c',
        900: '#742a2a',
      },
      orange: {
        100: '#fffaf0',
        200: '#feebc8',
        300: '#fbd38d',
        400: '#f6ad55',
        500: '#ed8936',
        600: '#dd6b20',
        700: '#c05621',
        800: '#9c4221',
        900: '#7b341e',
      },
      yellow: {
        100: '#fffff0',
        200: '#fefcbf',
        300: '#faf089',
        400: '#f6e05e',
        500: '#ecc94b',
        600: '#d69e2e',
        700: '#b7791f',
        800: '#975a16',
        900: '#744210',
      },
      green: {
        100: '#f0fff4',
        200: '#c6f6d5',
        300: '#9ae6b4',
        400: '#68d391',
        500: '#48bb78',
        600: '#38a169',
        700: '#2f855a',
        800: '#276749',
        900: '#22543d',
      },
      teal: {
        100: '#e6fffa',
        200: '#b2f5ea',
        300: '#81e6d9',
        400: '#4fd1c5',
        500: '#38b2ac',
        600: '#319795',
        700: '#2c7a7b',
        800: '#285e61',
        900: '#234e52',
      },
      blue: {
        100: '#ebf8ff',
        200: '#bee3f8',
        300: '#90cdf4',
        400: '#63b3ed',
        500: '#4299e1',
        600: '#3182ce',
        700: '#2b6cb0',
        800: '#2c5282',
        900: '#2a4365',
      },
      indigo: {
        100: '#ebf4ff',
        200: '#c3dafe',
        300: '#a3bffa',
        400: '#7f9cf5',
        500: '#667eea',
        600: '#5a67d8',
        700: '#4c51bf',
        800: '#434190',
        900: '#3c366b',
      },
      purple: {
        100: '#faf5ff',
        200: '#e9d8fd',
        300: '#d6bcfa',
        400: '#b794f4',
        500: '#9f7aea',
        600: '#805ad5',
        700: '#6b46c1',
        800: '#553c9a',
        900: '#44337a',
      },
      pink: {
        100: '#fff5f7',
        200: '#fed7e2',
        300: '#fbb6ce',
        400: '#f687b3',
        500: '#ed64a6',
        600: '#d53f8c',
        700: '#b83280',
        800: '#97266d',
        900: '#702459',
      },
    },
    spacing: {
      px: '1px',
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '32': '8rem',
      '40': '10rem',
      '48': '12rem',
      '56': '14rem',
      '64': '16rem',
    },
    backgroundColor: theme => theme('colors'),
    backgroundOpacity: theme => theme('opacity'),
    backgroundPosition: {
      bottom: 'bottom',
      center: 'center',
      left: 'left',
      'left-bottom': 'left bottom',
      'left-top': 'left top',
      right: 'right',
      'right-bottom': 'right bottom',
      'right-top': 'right top',
      top: 'top',
    },
    backgroundSize: {
      auto: 'auto',
      cover: 'cover',
      contain: 'contain',
    },
    borderColor: theme => ({
      ...theme('colors'),
      default: theme('colors.gray.300', 'currentColor'),
    }),
    borderOpacity: theme => theme('opacity'),
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      default: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px',
    },
    borderWidth: {
      default: '1px',
      '0': '0',
      '2': '2px',
      '4': '4px',
      '8': '8px',
    },
    boxShadow: {
      xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      none: 'none',
    },
    container: {},
    cursor: {
      auto: 'auto',
      default: 'default',
      pointer: 'pointer',
      wait: 'wait',
      text: 'text',
      move: 'move',
      'not-allowed': 'not-allowed',
    },
    divideColor: theme => theme('borderColor'),
    divideOpacity: theme => theme('borderOpacity'),
    divideWidth: theme => theme('borderWidth'),
    fill: {
      current: 'currentColor',
    },
    flex: {
      '1': '1 1 0%',
      auto: '1 1 auto',
      initial: '0 1 auto',
      none: 'none',
    },
    flexGrow: {
      '0': '0',
      default: '1',
    },
    flexShrink: {
      '0': '0',
      default: '1',
    },
    fontFamily: {
      sans: [
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      mono: ['Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
    },
    fontWeight: {
      hairline: '100',
      thin: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    height: theme => ({
      auto: 'auto',
      ...theme('spacing'),
      full: '100%',
      screen: '100vh',
    }),
    inset: {
      '0': '0',
      auto: 'auto',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
      '3': '.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '7': '1.75rem',
      '8': '2rem',
      '9': '2.25rem',
      '10': '2.5rem',
    },
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
    },
    margin: (theme, { negative }) => ({
      auto: 'auto',
      ...theme('spacing'),
      ...negative(theme('spacing')),
    }),
    maxHeight: {
      full: '100%',
      screen: '100vh',
    },
    maxWidth: (theme, { breakpoints }) => ({
      none: 'none',
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      full: '100%',
      ...breakpoints(theme('screens')),
    }),
    minHeight: {
      '0': '0',
      full: '100%',
      screen: '100vh',
    },
    minWidth: {
      '0': '0',
      full: '100%',
    },
    objectPosition: {
      bottom: 'bottom',
      center: 'center',
      left: 'left',
      'left-bottom': 'left bottom',
      'left-top': 'left top',
      right: 'right',
      'right-bottom': 'right bottom',
      'right-top': 'right top',
      top: 'top',
    },
    opacity: {
      '0': '0',
      '25': '0.25',
      '50': '0.5',
      '75': '0.75',
      '100': '1',
    },
    order: {
      first: '-9999',
      last: '9999',
      none: '0',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      '11': '11',
      '12': '12',
    },
    padding: theme => theme('spacing'),
    placeholderColor: theme => theme('colors'),
    placeholderOpacity: theme => theme('opacity'),
    space: (theme, { negative }) => ({
      ...theme('spacing'),
      ...negative(theme('spacing')),
    }),
    stroke: {
      current: 'currentColor',
    },
    strokeWidth: {
      '0': '0',
      '1': '1',
      '2': '2',
    },
    textColor: theme => theme('colors'),
    textOpacity: theme => theme('opacity'),
    width: theme => ({
      auto: 'auto',
      ...theme('spacing'),
      '1/2': '50%',
      '1/3': '33.333333%',
      '2/3': '66.666667%',
      '1/4': '25%',
      '2/4': '50%',
      '3/4': '75%',
      '1/5': '20%',
      '2/5': '40%',
      '3/5': '60%',
      '4/5': '80%',
      '1/6': '16.666667%',
      '2/6': '33.333333%',
      '3/6': '50%',
      '4/6': '66.666667%',
      '5/6': '83.333333%',
      '1/12': '8.333333%',
      '2/12': '16.666667%',
      '3/12': '25%',
      '4/12': '33.333333%',
      '5/12': '41.666667%',
      '6/12': '50%',
      '7/12': '58.333333%',
      '8/12': '66.666667%',
      '9/12': '75%',
      '10/12': '83.333333%',
      '11/12': '91.666667%',
      full: '100%',
      screen: '100vw',
    }),
    zIndex: {
      auto: 'auto',
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
    },
    gap: theme => theme('spacing'),
    gridTemplateColumns: {
      none: 'none',
      '1': 'repeat(1, minmax(0, 1fr))',
      '2': 'repeat(2, minmax(0, 1fr))',
      '3': 'repeat(3, minmax(0, 1fr))',
      '4': 'repeat(4, minmax(0, 1fr))',
      '5': 'repeat(5, minmax(0, 1fr))',
      '6': 'repeat(6, minmax(0, 1fr))',
      '7': 'repeat(7, minmax(0, 1fr))',
      '8': 'repeat(8, minmax(0, 1fr))',
      '9': 'repeat(9, minmax(0, 1fr))',
      '10': 'repeat(10, minmax(0, 1fr))',
      '11': 'repeat(11, minmax(0, 1fr))',
      '12': 'repeat(12, minmax(0, 1fr))',
    },
    gridColumn: {
      auto: 'auto',
      'span-1': 'span 1 / span 1',
      'span-2': 'span 2 / span 2',
      'span-3': 'span 3 / span 3',
      'span-4': 'span 4 / span 4',
      'span-5': 'span 5 / span 5',
      'span-6': 'span 6 / span 6',
      'span-7': 'span 7 / span 7',
      'span-8': 'span 8 / span 8',
      'span-9': 'span 9 / span 9',
      'span-10': 'span 10 / span 10',
      'span-11': 'span 11 / span 11',
      'span-12': 'span 12 / span 12',
    },
    gridColumnStart: {
      auto: 'auto',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      '11': '11',
      '12': '12',
      '13': '13',
    },
    gridColumnEnd: {
      auto: 'auto',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      '11': '11',
      '12': '12',
      '13': '13',
    },
    gridTemplateRows: {
      none: 'none',
      '1': 'repeat(1, minmax(0, 1fr))',
      '2': 'repeat(2, minmax(0, 1fr))',
      '3': 'repeat(3, minmax(0, 1fr))',
      '4': 'repeat(4, minmax(0, 1fr))',
      '5': 'repeat(5, minmax(0, 1fr))',
      '6': 'repeat(6, minmax(0, 1fr))',
    },
    gridRow: {
      auto: 'auto',
      'span-1': 'span 1 / span 1',
      'span-2': 'span 2 / span 2',
      'span-3': 'span 3 / span 3',
      'span-4': 'span 4 / span 4',
      'span-5': 'span 5 / span 5',
      'span-6': 'span 6 / span 6',
    },
    gridRowStart: {
      auto: 'auto',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
    },
    gridRowEnd: {
      auto: 'auto',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
    },
    transformOrigin: {
      center: 'center',
      top: 'top',
      'top-right': 'top right',
      right: 'right',
      'bottom-right': 'bottom right',
      bottom: 'bottom',
      'bottom-left': 'bottom left',
      left: 'left',
      'top-left': 'top left',
    },
    scale: {
      '0': '0',
      '50': '.5',
      '75': '.75',
      '90': '.9',
      '95': '.95',
      '100': '1',
      '105': '1.05',
      '110': '1.1',
      '125': '1.25',
      '150': '1.5',
    },
    rotate: {
      '-180': '-180deg',
      '-90': '-90deg',
      '-45': '-45deg',
      '0': '0',
      '45': '45deg',
      '90': '90deg',
      '180': '180deg',
    },
    translate: (theme, { negative }) => ({
      ...theme('spacing'),
      ...negative(theme('spacing')),
      '-full': '-100%',
      '-1/2': '-50%',
      '1/2': '50%',
      full: '100%',
    }),
    skew: {
      '-12': '-12deg',
      '-6': '-6deg',
      '-3': '-3deg',
      '0': '0',
      '3': '3deg',
      '6': '6deg',
      '12': '12deg',
    },
    transitionProperty: {
      none: 'none',
      all: 'all',
      default: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      colors: 'background-color, border-color, color, fill, stroke',
      opacity: 'opacity',
      shadow: 'box-shadow',
      transform: 'transform',
    },
    transitionTimingFunction: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    transitionDuration: {
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
    transitionDelay: {
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
  };
```
:::tips
More about [TailwindCSS configuration](https://tailwindcss.com/docs/configuration#theme)
:::
</details>


The `designSystem` is used to define the project's color palette, typographic scales (Typographic Scales or Type Scale), font list, breakpoints, border rounding values, etc. Since Modern.js borrows the design approach from Tailwind Theme and integrates with Tailwind CSS internally, `designSystem` is used in the same way as Tailwind CSS Theme

The `designSystem` object contains the `screens`, `colors` and `spacing` properties, as well as each customizable core plugin.

## Screens

The responsive breakpoints in your project can be customized using `screens`: the

```js
const designSystem = {
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};
```

where the property name in the `screens` object is the screen name (used as a prefix for the adaptive utility variants generated by `Tailwind CSS`, e.g. `md:text-center`) and the value is the `min-width` at which the breakpoint should start.

Default breakpoints are inspired by common device resolutions: the

```js
const designSystem = {
  screens: {
    sm: '640px',
    // => @media (min-width: 640px) { ... }

    md: '768px',
    // => @media (min-width: 768px) { ... }

    lg: '1024px',
    // => @media (min-width: 1024px) { ... }

    xl: '1280px',
    // => @media (min-width: 1280px) { ... }
  },
};
```

You can use any name you like as a breakpoint property in your project: the

```js
const designSystem = {
  screens: {
    tablet: '640px',
    // => @media (min-width: 640px) { ... }

    laptop: '1024px',
    // => @media (min-width: 1024px) { ... }

    desktop: '1280px',
    // => @media (min-width: 1280px) { ... }
  },
};
```

These screen names are reflected in `utilities`, so `text-center` now looks like this

```css
.text-center { text-align: center }

@media (min-width: 640px) {
    .tablet\:text-center { text-align: center }
}

@media (min-width: 1024px) {
    .laptop\:text-center { text-align: center }
}

@media (min-width: 1280px) {
    .desktop\:text-center { text-align: center }
}
```

### Max-width breakpoints

To use the `max-width` breakpoint instead of `min-width`, you can specify the screen as an object with the `max` attribute.

```js
const designSystem = {
  screens: {
    xl: { max: '1279px' }
    // => @media (max-width: 1279px) { ... }

    lg: { max: '1023px' },
    // => @media (max-width: 1023px) { ... }

    md: { max: '767px' },
    // => @media (max-width: 767px) { ... }

    sm: { max: '639px' },
    // => @media (max-width: 639px) { ... }
  },
};
```

If necessary, to create breakpoints with `min-width` and `max-width` definitions, e.g.

```js
const designSystem = {
  screens: {
    sm: { min: '640px', max: '767px' }
    md: { min: '768px', max: '1023px' }
    lg: { min: '1024px', max: '1279px' }, lg: { min: '1024px', max: '1279px' },
    xl: { min: '1280px' }
  },
};
```

### Multiple range breakpoints

Sometimes it can be useful to apply a single breakpoint definition to multiple scopes.

For example, suppose you have a `sidebar` and want the breakpoint to be based on the width of the content area rather than the entire viewport. You can simulate this situation by using a smaller breakpoint style when the `sidebar` is visible and the content area is narrowed: the

```js
const designSystem = {
  screens: {
    sm: '500px',
    md: [
      // Sidebar appears at 768px, so revert to `sm:` styles between 768px
      // and 868px, after which the main content area is wide enough again to
      // apply the `md:` styles.
      { min: '668px', max: '767px' }
      { min: '868px' }, { min: '868px' },
    ],
    lg: '1100px',
    xl: '1400px',
  },
};
```

### Custom media queries

If a fully customizable media query is required for a breakpoint, an object with the `raw` attribute can be used.

```js
const designSystem = {
  extend: {
    screens: {
      portrait: { raw: '(orientation: portrait)' }
      // => @media (orientation: portrait) { ... }
    },
  },
};
```

### Print styles

The `raw` option may be particularly useful if you need to apply different styles to printing.

All that needs to be done is to add a `print` under `designSystem.extend.screens`.

``js
const designSystem = {
  extend: {
    screens: {
      print: { raw: 'print' },
      // => @media print { ... }
    },
  },
};
```

Then, a class such as ``print:text-black`` can be used to specify a style that is applied only when someone tries to print a page: ``

```html
<div class="text-gray-700 print:text-black">
  <! -- ... -->
</div>
```

### Dark Mode

`raw` 选项可以用于实现 “暗模式” 屏幕：

```js
const designSystem = {
  extend: {
    screens: {
      dark: { raw: '(prefers-color-scheme: dark)' },
      // => @media (prefers-color-scheme: dark) { ... }
    },
  },
};
```

然后，您可以使用 `dark:` 前缀在暗模式下为元素设置不同的样式：

```html
<div class="text-gray-700 dark:text-gray-200">
  <! -- ... -->
</div>
```

请注意，由于这些 `screen variants` 是在 `Tailwind CSS` 中实现的，因此**无法使用这种方法将断点与暗模式结合使用** ，例如 `md:dark:text-gray-300` 将不起作用。

## Colors

`colors` 属性可让您自定义项目的全局调色板。

```js
const designSystem = {
  colors: {
    transparent: 'transparent',
    black: '#000',
    white: '#fff',
    gray: {
      100: '#f7fafc',
      // ...
      900: '#1a202c',
    },

    // ...
  },
};
```

By default, these colors are inherited by the `backgroundColor`, `textColor` and `borderColor` core plugins.

To learn more, you can check out: [Customizing Colors](https://tailwindcss.com/docs/customizing-colors).

## Spacing

The global spacing and scaling of items can be customized using the ``space`` attribute: the

```js
const designSystem = {
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },
};
```

By default, these values are inherited by the `padding`, `margin`, `negativeMargin`, `width` and `height` core plugins.

To learn more, see [Customizing Spacing](https://tailwindcss.com/docs/customizing-spacing).

## Core plugins

The rest of the theme section is used to configure the values available for each core plugin.

For example, the ``borderRadius`` property allows you to customize the ``utilities` that will generate the rounded corners.

``js
const designSystem = {
  borderRadius: {
    none: '0',
    sm: '.125rem',
    default: '.25rem',
    lg: '.5rem',
    full: '9999px',
  },
};
```

** The attribute name determines the suffix of the generated class, and the value determines the value of the actual CSS declaration. **
The example ``borderRadius`` configuration above will generate the following CSS classes.

```css
.rounded-none { border-radius: 0 }
.rounded-sm { border-radius: .125rem }
.rounded { border-radius: .25rem }
.rounded-lg { border-radius: .5rem }
.rounded-full { border-radius: 9999px }
```

You will notice that the `rounded` class is created without the suffix in the theme configuration using the `default` attribute. This is a common convention in Tailwind CSS supported by many (though not all) of the core plugins.

To learn more about customizing a specific core plugin, please visit the documentation for that plugin.

## Customizing the default configuration

Out of the box, your project will automatically inherit values from the default theme configuration. If you want to customize the default theme, there are several different options depending on the goal.

### Override the default configuration

To override the options in the default configuration, add the properties to be overridden to ``designSystem`` at

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

const designSystem = {
  // Replaces all of the default `opacity` values
  opacity: {
    0: '0',
    20: '0.2',
    40: '0.4',
    60: '0.6',
    80: '0.8',
    100: '1',
  },
};

export default defineConfig({
  designSystem,
});
```

This will completely replace the default property configuration, so in the above example, the default `opacity utilities` will not be generated.

Any properties you do not provide will be inherited from the default theme, so in the example above, the default theme configuration for color, spacing, border rounding, background position, etc. will be retained.

### Extending the default configuration

If you want to keep the default values of the theme options but add new values, add the extensions under the `designSystem.extend` property.

For example, if you want to add an additional breakpoint but keep the existing one, you can extend the ``screens`` property with.

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

const designSystem = {
  extend: {
    // Adds a new breakpoint in addition to the default breakpoints
    screens: {
      '2xl': '1440px',
    },
  },
};

export default defineConfig({
  designSystem,
});
```

You can certainly override some parts of the default theme and extend other parts of the default theme in the same configuration: the

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

const designSystem = {
  opacity: {
    0: '0',
    20: '0.2',
    40: '0.4',
    60: '0.6',
    80: '0.8',
    100: '1',
  },
  extend: {
    screens: {
      '2xl': '1440px',
    },
  },
};

export default defineConfig({
  designSystem,
});
```

### Referencing other values

If you need to reference another value in the configuration, you can do so by providing a closure function instead of a static value. The function will receive the `theme()` function as an argument, and you can use this function to find other values in the configuration using a dot representation.

For example, you can generate `fill` utilities for each color in the palette by referring to `theme('colors')` on the `fill` configuration.

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

const designSystem = {
  colors: {
    // ...
  },
  fill: theme => theme('colors'),
};

export default defineConfig({
  designSystem,
});
```

The `theme()` function tries to find the value you are looking for from an already fully merged configuration object, so it can reference your own custom settings as well as the default theme value. It also works recursively, so as long as there is a static value at the end of the chain, it can resolve the value you are looking for.

**Reference to the default configuration**

If for any reason you want to reference a value in the default configuration, you can import it from `tailwindcss/defaultTheme`. A useful example would be to add one of the fonts provided by the default configuration to.

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

const defaultTheme = require('tailwindcss/defaultTheme');

const designSystem = {
  extend: {
    fontFamily: {
      sans: ['Lato', ... .defaultTheme.fontFamily.sans],
    },
  },
};

export default defineConfig({
  designSystem,
});
```

### Disabling the entire core plugin

If you don't want to generate any classes for a core plugin, it's better to set the plugin to ``false`` in the ``corePlugins`` configuration, rather than providing an empty object for the property in the configuration: ``

```js
// Don't assign an empty object in your theme configuration

const designSystem = {
  opacity: {},
};

// Do disable the plugin in your corePlugins configuration
const designSyttem = {
  corePlugins: {
    opacity: { false,
  },
};
```

The end result is the same, but since many core plugins don't expose any configuration, it's best to keep it consistent by only disabling them with corePlugins anyway.

### Adding your own key

In many cases it may be useful to add your own properties to the configuration object.

One example is to add new properties for multiplexing between multiple core plugins. For example, you can extract a ``positions`` object that both the ``backgroundPosition`` and ``objectPosition`` plugins can refer to.

```js
const designSystem = {
  positions: {
    bottom: 'bottom',
    center: 'center',
    left: 'left',
    'left-bottom': 'left bottom',
    'left-top': 'left top',
    right: 'right',
    'right-bottom': 'right bottom',
    'right-top': 'right top',
    top: 'top',
  },
  backgroundPosition: theme => theme('positions'),
  objectPosition: theme => theme('positions'),
};
```

Another example is to add a new property to a custom plugin for referencing. For example, if you write a gradient plugin for your project, you can add a gradient property to the theme object referenced by that plugin.

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

const designSystem = {
  gradients: theme => ({
    'blue-green': [theme('colors.blue.500'), theme('colors.green.500')],
    'purple-blue': [theme('colors.purple.500'), theme('colors.blue.500')],
    // ...
  }),
};

export default defineConfig({
  designSystem,
  buildConfig: {
    style: {
      postcss: {
        plugins: [require('. /plugins/gradients')],
      }
    }
  },
});
```

## Configuration references

All properties in the configuration object, except `screens`, `colors` and `spacing`, are mapped to the core plugins of `Tailwind CSS`. Since many plugins are responsible for CSS properties that accept only static sets of values (e.g., e.g., `float`), please note that not every plugin has a corresponding property in the theme object.

All of these properties can also be used under the `designSystem.extend` property to extend the default theme.

For more information about what all the properties do, check out this [link](https://tailwindcss.com/docs/theme#configuration-reference).

