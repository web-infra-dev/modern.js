# CSS Usage

Builder has built-in multiple style resource processing capabilities, including Less / Sass preprocessor, PostCSS, CSS Modules, CSS inline and CSS compression.

In addition, Builder also provides multiple configs to customize the compile rules of style resources.

## Using Less, Sass and Stylus

The Builder has built-in community popular CSS preprocessors such as Less, Sass.

By default, you don't need to configure anything for Less and Sass. If you need to customize loader config, you can configure [tools.less](/en/api/config-tools.html#tools-less), [tools.sass](/en/api/config-tools.html#tools-sass) to set it up.

You can also use Stylus in Builder, just install the Stylus plugin provided by Builder, please refer to [Stylus Plugin](/plugins/plugin-stylus.html) for usage.

## Using PostCSS

Builder has built-in [PostCSS](https://postcss.org/) to transform the CSS code. You can configure the postcss-loader via [tools.postcss](/en/api/config-tools.html#tools-postcss).

```ts
export default {
  tools: {
    postcss: opts => {
      const viewportPlugin = require('postcss-px-to-viewport')({
        viewportWidth: 375,
      });
      opts.postcssOptions.plugins.push(viewportPlugin);
    },
  },
};
```

By default, we have enabled [autoprefixer](https://github.com/postcss/autoprefixer) to add vendor prefixes to CSS rules.
If you want to configure the target browser, you can use [output.overrideBrowserslist](/en/api/config-output.html#output-overridebrowserslist) config.

## Using CSS Modules

Please read the [Using CSS Modules](/guide/basic/css-modules.html) chapter for a complete usage of CSS Modules.

## CSS Minify

Usually, in production environments we compress static resources such as CSS, JS, etc. to achieve better transfer efficiency.

Builder automatically compresses CSS code at production build time with [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) (The compression tool used at the bottom is [cssnano](https://cssnano.co/)).

You can configure [tools.minifyCss](/en/api/config-tools.html#tools-minifycss) to make it more customizable.

:::tip About cssnano
cssnano is a tool for optimizing and minifying CSS files. It reduces the size of CSS files by removing unused rules, merging similar rules, removing comments and whitespace, and converting length units, among other techniques, to improve the loading speed of websites.
:::

## Inline CSS Files

By default, Builder will extract CSS into a separate `.css` file and output it to the dist directory.

If you want to inline styles into your JS file, you can set [output.disableCssExtract](/en/api/config-output.html#output-disablecssextract) to true to disable CSS extraction logic.When the JS file is requested by the browser, JS dynamically inserts the `<style>` tag into the Html to load the CSS styles.

```ts
export default {
  output: {
    disableCssExtract: true,
  },
};
```

This will increase the size of your JS Bundle, so it is usually not recommended to disable the CSS extraction.

## Import CSS in node_modules

You can directly import CSS files in node_modules.

- Import in a component:

```ts
// src/App.tsx
// Import the Arco Design style:
import '@arco-design/web-react/dist/css/arco.css';
```

- Import in a style file:

```css
/* src/App.css */
/* reference normalize.css */
/* https://github.com/necolas/normalize.css */
@import 'normalize.css';

body {
  /* */
}
```
