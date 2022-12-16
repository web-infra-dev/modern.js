# Css Usage

Builder supports handling multiple style resources, e.g. Less, Sass.
In addition, Builder also provides a variety of configurations to manage your style resources.

## Using CSS Modules

Builder provides out-of-the-box [CSS Modules](https://github.com/css-modules/css-modules), no additional configuration required on you.Of course, if you want to customize the CSS Modules configuration, you can custom it via [tools.css-loader](/en/api/config-tools.html#css-loader).

Customizing the generated class name is also a feature we use more often, you can use [tools.cssLoader](/en/api/config-tools.html#tools-cssloader) to do this in addition to [output.cssModuleLocalIdentName](/en/api/config-output.html#output-cssmodulelocalidentname).

By default, only files ending with `*.module.css` are considered CSS Modules. If you want to remove the `.module` from the file name, you can do so by turning on output.disableCssModuleExtension, e.g.

```ts
import styles1 from './foo.module.css';
import styles2 from './bar.css';
```

Both of these files will be treated as CSS Modules,
however, we do not recommend turning on this configuration item, which is not conducive to long-term project maintenance.

## Using Less & Sass

The Builder has built-in community popular CSS preprocessors such as Less, Sass.
No additional configuration required on your part, right out of the box.
Of course you can also customize the loader by configuring [tools.less](/en/api/config-tools.html#tools-less) and [tools.sass](/en/api/config-tools.html#tools-sass).

## Using PostCSS

Builder has built-in [PostCSS](https://postcss.org/).

You can configure the postcss-loader via [tools.postcss](/en/api/config-tools.html#tools-postcss).

By default, we have enabled [autoprefixer](https://github.com/postcss/autoprefixer) to add vendor prefixes to CSS rules.
If you want to configure the target browser, you can use [output.overrideBrowserslist](/en/api/config-output.html#output-overridebrowserslist) config.

## CSS Minify

Usually, in production environments we compress static resources such as CSS, JS, etc. to achieve better transfer efficiency.

Builder automatically compresses CSS code at production build time with [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin).

You can configure [tools.minifyCss](/en/api/config-tools.html#tools-minifycss) to make it more customizable.

## CSS Separate File

By default, Builder will extract CSS into a separate `.css` file and output it to the dist directory.

If you want to inline styles into your JS file, you can set [output.disableCssExtract](/en/api/config-output.html#output-disablecssextract) to true to disable CSS extraction logic.When the JS file is requested by the browser, JS dynamically inserts the `<style>` tag into the Html to load the CSS styles.

This will increase the size of your JS Bundle, so it is usually not recommended that you disable CSS extraction logic.
