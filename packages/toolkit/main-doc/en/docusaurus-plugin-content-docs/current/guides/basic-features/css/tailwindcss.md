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

You can then use the Utility Class provided by Tailwind CSS in each component:

```tsx
const App = () => (
  <div className="h-12 w-48">
    <p className="text-xl font-medium text-black">hello world</p>
  </div>
);
```

:::info Additional
According to different needs, you can optionally import the CSS files provided by Tailwind CSS. Since the use of `@taiwind` is equivalent to directly importing CSS files, you can refer to the content in the annotate in the [`@tailwind` usage](https://tailwindcss.com/docs/functions-and-directives#tailwind) document for the purpose of the CSS files provided by Tailwind CSS.
:::

## Tailwind CSS version

Modern.js supports both Tailwind CSS v2 and v3. The framework will recognize the version of `tailwindcss` in the project `package.json` and apply the corresponding configuration. By default, we install Tailwind CSS v3 for you.

If your project is still using Tailwind CSS v2, we recommend that you upgrade to v3 to support JIT and other capabilities. For the differences between Tailwind CSS v2 and v3 versions, please refer to the following articles:

- [Tailwind CSS v3.0](https://tailwindcss.com/blog/tailwindcss-v3)
- [Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

### Browser Compatibility

Both Tailwind CSS v2 and v3 do not support IE 11 browsers. For background, please refer to:

- [Tailwind CSS v3 - Browser Support](https://tailwindcss.com/docs/browser-support).
- [Tailwind CSS v2 - Browser Support](https://v2.tailwindcss.com/docs/browser-support)

If you use Tailwind CSS on IE 11 browser, some styles may not be available, please pay attention.

## Theme config

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

> When configuring Tailwind CSS for a project, the combination of the two configurations [source.designSystem](/docs/configure/app/source/design-system) and [tools.tailwindcss](/docs/configure/app/tools/tailwindcss) is equivalent to a separate configuration `tailwindcss.config.js` file. Where [source.designSystem](/docs/configure/app/source/design-system) is equivalent to the [theme](https://v2.tailwindcss.com/docs/configuration#theme) configuration of Tailwind CSS.
