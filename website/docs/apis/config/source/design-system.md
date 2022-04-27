---
sidebar_label: designSystem
sidebar_position: 4
---

# source.designSystem

:::info 适用的工程方案
* MWA
* 模块
:::

:::caution 注意
- MWA 项目需要请确保使用【[new](/docs/apis/commands/mwa/new)】 启用 Tailwind CSS 功能。

- 模块项目需要请确保使用【[new](/docs/apis/commands/module/new)】 启用 Tailwind CSS 功能。
:::


* 类型： `Object`
* 默认值：见下方配置详情。

<details>
  <summary>designSystem 配置详情</summary>

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

:::tip 提示
更多关于：<a href="https://tailwindcss.com/docs/configuration#theme" target="_blank">TailwindCSS 配置</a>。
:::
</details>


`designSystem` 用于定义项目的调色板、排版比例（Typographic Scales 或者 Type Scale）、字体列表、断点、边框圆角值等等。因为 Modern.js 借用了 Tailwind Theme 的设计方式，并且内部也集成了 Tailwind CSS，所以 `designSystem` 使用方式与 Tailwind CSS Theme 相同

### 结构

`designSystem` 对象包含 `screens`、`colors` 和 `spacing` 的属性，以及每个可自定义核心插件。

#### Screens

使用`screens` 可以自定义项目中的响应断点：

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

其中 `screens` 对象里的属性名是屏幕名称（用作 `Tailwind CSS` 生成的自适应实用程序变体的前缀，例如 `md:text-center`），值是该断点应在其开始的 `min-width`。

默认断点受常见设备分辨率的启发：

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

你可以在你的项目中使用任意你喜欢的名称作为断点的属性：

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

这些屏幕名称反映在 `utilities` 中，因此 `text-center` 现在是这样的：

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

##### Max-width 断点

如果要使用 `max-width` 断点而不是 `min-width`，可以将屏幕指定为具有 `max` 属性的对象：

```js
const designSystem = {
  screens: {
    xl: { max: '1279px' },
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

如有必要，以创建带有 `min-width` 和  `max-width` 定义的断点，例如：

```js
const designSystem = {
  screens: {
    sm: { min: '640px', max: '767px' },
    md: { min: '768px', max: '1023px' },
    lg: { min: '1024px', max: '1279px' },
    xl: { min: '1280px' },
  },
};
```

##### 多个范围的断点

有时，将单个断点定义应用于多个范围会很有用。

例如，假设您有一个 `sidebar`，并且希望断点基于内容区域宽度而不是整个视口。您可以模拟这种情况，当 `sidebar` 可见并缩小内容区域时，断点的样式使用较小的断点样式：

```js
const designSystem = {
  screens: {
    sm: '500px',
    md: [
      // Sidebar appears at 768px, so revert to `sm:` styles between 768px
      // and 868px, after which the main content area is wide enough again to
      // apply the `md:` styles.
      { min: '668px', max: '767px' },
      { min: '868px' },
    ],
    lg: '1100px',
    xl: '1400px',
  },
};
```

##### 自定义媒体查询

如果需要为断点提供完全自定义的媒体查询，则可以使用带有 `raw` 属性的对象：

```js
const designSystem = {
  extend: {
    screens: {
      portrait: { raw: '(orientation: portrait)' },
      // => @media (orientation: portrait) { ... }
    },
  },
};
```

##### Print 样式

如果需要为打印应用不同的样式，则 `raw` 选项可能特别有用。

需要做的就是在 `designSystem.extend.screens` 下添加一个 `print`：

```js
const designSystem = {
  extend: {
    screens: {
      print: { raw: 'print' },
      // => @media print { ... }
    },
  },
};
```

然后，可以使用诸如 `print:text-black` 之类的类来指定仅当某人尝试打印页面时才应用的样式：

```html
<div class="text-gray-700 print:text-black">
  <!-- ... -->
</div>
```

##### Dark Mode

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
  <!-- ... -->
</div>
```

请注意，由于这些 `screen variants` 是在 `Tailwind CSS` 中实现的，因此**无法使用这种方法将断点与暗模式结合使用** ，例如 `md:dark:text-gray-300` 将不起作用。

#### Colors

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

默认情况下，这些颜色由 `backgroundColor`，`textColor` 和 `borderColor` 核心插件继承。

想了解更多，可以查看：[Customizing Colors](https://tailwindcss.com/docs/customizing-colors)。

#### Spacing

使用 `space` 属性，可以自定义项目的全局间距和缩放比例：

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

默认情况下，这些值由 `padding`，`margin`，`negativeMargin`，`width` 和 `height` 核心插件继承。

想要了解更多，看 [Customizing Spacing](https://tailwindcss.com/docs/customizing-spacing)。

#### Core plugins

主题部分的其余部分用于配置每个核心插件可用的值。

例如，`borderRadius` 属性可让您自定义将生成的圆角的 `utilities`：

```js
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

**属性名确定所生成类的后缀，值确定实际CSS声明的值。**上面的示例`borderRadius`配置将生成以下CSS类：

```css
.rounded-none { border-radius: 0 }
.rounded-sm   { border-radius: .125rem }
.rounded      { border-radius: .25rem }
.rounded-lg   { border-radius: .5rem }
.rounded-full { border-radius: 9999px }
```

会注意到，在主题配置中使用 `default` 属性创建了不带后缀的 `rounded` 类。这是许多（尽管不是全部）核心插件支持的 Tailwind CSS 中的通用约定。

要了解有关自定义特定核心插件的更多信息，请访问该插件的文档。

### 自定义默认配置

开箱即用，您的项目将自动从默认主题配置继承值。如果想自定义默认主题，则根据目标有几种不同的选择。

#### 覆盖默认配置

要覆盖默认配置中的选项，请在 `designSystem` 中添加要覆盖的属性：

```js title="modern.config.js"
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
  source: {
    designSystem,
  },
});
```

这将完全替换默认属性配置，因此在上面的示例中，不会生成默认的 `opacity utilities`。

您未提供的任何属性都将从默认主题继承，因此在上面的示例中，将保留颜色，间距，边框圆角，背景位置等内容的默认主题配置。

#### 扩展默认配置

如果您想保留主题选项的默认值，但又要添加新值，请在 `designSystem.extend` 属性下添加扩展的内容。

例如，如果您想添加一个额外的断点但保留现有的断点，则可以扩展 `screens` 属性：

```js title="modern.config.js"
const designSystem = {
  extend: {
    // Adds a new breakpoint in addition to the default breakpoints
    screens: {
      '2xl': '1440px',
    },
  },
};

export default defineConfig({
  source: {
    designSystem,
  },
});
```

您当然可以覆盖默认主题的某些部分，并在同一配置中扩展默认主题的其他部分：

```js title="modern.config.js"
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
  source: {
    designSystem,
  },
});
```

#### 引用其他值

如果需要在配置中引用另一个值，可以通过提供闭包函数而不是静态值来实现。函数将收到 `theme()` 函数作为参数，您可以使用该函数使用点表示法在配置中查找其他值。

例如，您可以在 `fill` 配置上通过引用 `theme('colors')` 为调色板中的每种颜色生成 `fill` utilities。

```js title="modern.config.js"
const designSystem = {
  colors: {
    // ...
  },
  fill: theme => theme('colors'),
};

export default defineConfig({
  source: {
    designSystem,
  },
});
```

`theme()`函数尝试从已经完全合并的配置对象中找到您要查找的值，因此它可以引用您自己的自定义设置以及默认主题值。它也可以递归工作，因此只要链末尾有一个静态值，它就可以解析您要查找的值。

**引用默认配置**

如果出于任何原因想要引用默认配置中的值，则可以从 `tailwindcss/defaultTheme` 导入它。一个有用的示例是，如果要将添加默认配置提供的字体中某一个字体：

```js title="modern.config.js"
const defaultTheme = require('tailwindcss/defaultTheme');

const designSystem = {
  extend: {
    fontFamily: {
      sans: ['Lato', ...defaultTheme.fontFamily.sans],
    },
  },
};

export default defineConfig({
  source: {
    designSystem,
  },
});
```

#### 禁用整个核心插件

如果您不想为某个核心插件生成任何类，则最好在 `corePlugins` 配置中将该插件设置为 `false`，而不是在配置中为该属性提供一个空对象：

```js
// Don't assign an empty object in your theme configuration

const designSystem = {
  opacity: {},
};

// Do disable the plugin in your corePlugins configuration
const designSyttem = {
  corePlugins: {
    opacity: false,
  },
};
```

最终结果是相同的，但是由于许多核心插件未公开任何配置，因此无论如何只能使用 corePlugins 禁用它们，最好保持一致。

#### 添加自己的key

在很多情况下，将自己的属性添加到配置对象可能会很有用。

其中一个示例是添加新属性为多个核心插件之间复用。例如，您可以提取一个 `positions`对象，`backgroundPosition` 和 `objectPosition` 插件都可以引用该对象：

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

另一个示例是在自定义插件中添加新的属性以进行引用。例如，如果您为项目编写了渐变插件，则可以向该插件引用的主题对象添加渐变属性：

```js title="modern.config.js"
const designSystem = {
  gradients: theme => ({
    'blue-green': [theme('colors.blue.500'), theme('colors.green.500')],
    'purple-blue': [theme('colors.purple.500'), theme('colors.blue.500')],
    // ...
  }),
};

export default defineConfig({
  source: {
    designSystem,
  },
  tools: {
    tailwind: {
      plugins: [require('./plugins/gradients')],
    },
  },
});
```

### 配置引用

除了 `screens`，`colors` 和 `spacing` 外，配置对象中的所有属性都映射到 `Tailwind CSS` 的核心插件上。由于许多插件负责仅接受静态值集（例如，例如`float`）的CSS属性，因此请注意，并非每个插件在主题对象中都有对应的属性。

所有这些属性也可以在 `designSystem.extend` 属性下使用，以扩展默认主题。

关于所有属性的作用，可以查看此 [链接](https://tailwindcss.com/docs/theme#configuration-reference)。

### 额外的配置

除了与 Tailwind CSS Theme 相同的配置以外，还有 Modern.js 提供的额外的配置。

#### source.designSystem.supportStyledComponents

##### 类型

`boolean`

##### 默认值

`false`

##### 说明

值 `true` 时，运行时在应用外层提供 `styled-components` `ThemeProvider` 组件，并且将通过 `designSystem` 生成的 `Theme Token` 对象注入。
