---
sidebar_position: 2
---

# Tailwind CSS



[Tailwind CSS](https://tailwindcss.com/) is a CSS framework and design system based on Utility Class, which can quickly add common styles to components, and support flexible extension of theme styles. To use [Tailwind CSS](https://tailwindcss.com/) in the Modern.js, just execute `pnpm run new` in the project root directory and turn it on.

Choose as follows:

```bash
? Action: Enable features
? Enable features: Enable Tailwind CSS
```

When using, add the following code to the root component of the entry (such as `src/App.jsx`):

```js
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
```

You can then use the Utility Class provided by Tailwind CSS in each component.

::: info Additional
According to different needs, you can optionally import the CSS files provided by Tailwind CSS. Since the use of `@taiwind` is equivalent to directly importing CSS files, you can refer to the content in the annotate in the [`@tailwind` usage](https://tailwindcss.com/docs/functions-and-directives#tailwind) document for the purpose of the CSS files provided by Tailwind CSS.
:::

When you need to customize the [theme](https://tailwindcss.com/docs/theme) configuration of Tailwind CSS, you can modify it in the configuration [`source.designSystem`](/docs/configure/app/source/design-system), for example, add a color theme `primary`:

```typescript title="modern.config.ts"
export default defineConfig({
  source: {
    designSystem: {
      extend: {
        colors: {
          primary: '#5c6ac4',
        },
      },
    },
  },
});
```

When you need special configuration for Tailwind CSS other than [theme](https://tailwindcss.com/docs/theme), you can configure it in [`tools.tailwindcss`](/docs/configure/app/tools/tailwindcss), for example setting `variants`:

```typescript title="modern.config.ts"
export default defineConfig({
  tools: {
    tailwindcss: {
      variants: {
        extend: {
          backgroundColor: ['active'],
        },
      },
    },
  },
});
```

## Use the [`Twin`](https://github.com/ben-rogerson/twin.macro)

In the previous chapter, we introduced what CSS-in-JS is and the CSS-in-JS library [styled-components](https://styled-components.com/) commonly used by the community. This section will explain how to use [Tailwind CSS](https://tailwindcss.com/) in CSS with [`Twin`](https://github.com/ben-rogerson/twin.macro). Using [`Twin`](https://github.com/ben-rogerson/twin.macro) makes it easier to use Tailwind CSS in CSS-in-JS code. [`Twin`](https://github.com/ben-rogerson/twin.macro) for its own description is:

> *Twin blends the magic of Tailwind with the flexibility of css-in-js*

After enabling the "Tailwind CSS" function, you first need to install the ['Twin'](https://github.com/ben-rogerson/twin.macro) dependency:

``` bash
pnpm add twin.macro -D
```

When the project installs the `twin.macro` dependency, Modern.js detects the dependency and adds twin.macro related configuration to the `baby-plugin-macro` of build-in. So after installing the dependency, there is no need for manual configuration. Here is an example of a simple use of twin.macro:

``` js
import tw from 'twin.macro'

const Input = tw.input`border hover:border-black`
```

:::tip
If a `MacroError: /project/App.tsx` error occurs during runtime, it may be caused by a lack of `twin.macro` dependency.
:::

For more usage, please refer to the [twin.macro](https://github.com/ben-rogerson/twin.macro/blob/master/docs/index.md).

`twin.macro` reads the `tailwindcss.config.js` files in the project directory by default, or reads the Tailwind CSS configuration via the file path specified by [twin.config](https://github.com/ben-rogerson/twin.macro/blob/master/docs/options.md#options) on the `babel-plugin-macro`. However, these additional configurations are not required in the Modern.js.

When the Tailwind CSS is configured in the `modern.config.ts` file by [`source.designSystem`](/docs/configure/app/source/design-system) and [`tools.tailwindcss`](/docs/configure/app/tools/tailwindcss), these configurations will also take effect on the `twin.macro`.

> When configuring Tailwind CSS for a project, the combination of the two configurations [`source.designSystem`](/docs/configure/app/source/design-system) and [`tools.tailwindcss`](/docs/configure/app/tools/tailwindcss) is equivalent to a separate configuration `tailwindcss.config.js` file.
> Where [`source.designSystem`](/docs/configure/app/source/design-system) is equivalent to the [`theme`](https://v2.tailwindcss.com/docs/configuration#theme) configuration of Tailwind CSS.
