---
sidebar_position: 3
---

# PostCSS

[PostCSS](https://postcss.org/) is a tool for converting CSS code with JavaScript tools and plugins. Modern.js built-in PostCSS and integrates common PostCSS plugins such as [Autoprefixer](https://github.com/postcss/autoprefixer) to meet the style development needs of most projects.

By default, Modern.js compile and transform CSS as follows:

1. [Autoprefixer](https://github.com/postcss/autoprefixer) Automatically add the required browser vendor prefix to CSS rules according to the required browser range. Modern.js default supported browser ranges are: `['> 0.01%', 'not dead', 'not op_mini all']`.

:::info Note
  - [Supported browser range: `> 0.01%`] means that the browser market share is greater than 0.01%.
  - `Not dead` means excluding browsers that are no longer officially supported and browsers that have not been updated in the past 24 months.
  - `not op_mini all` means exclude Opera Mini.
:::

:::info Additional
If you need to modify the default browser support range, you can configure `browserslist` in the project's `package.json` file, and set the rule to refer to the use of [Browserslist](https://github.com/browserslist/browserslist). The following is an example:
`json title ="package.json" { "Browserslist": [ "The last 1 versions", "> 1%", "IE 10" ] } `
:::

2. Provide [CSS custom properties](https://www.w3.org/TR/css-variables-1/) support, you can define and use custom variables in CSS, such as:

```css
:root {
  --main-bg-color: pink;
}

body {
  background-color: var(--main-bg-color);
}
```

3. Provide [CSS Nesting](https://drafts.csswg.org/css-nesting-1/) support, you can use nested writing in CSS, such as:

```css
table.colortable td {
  text-align: center;
}
table.colortable td.c {
  text-transform: uppercase;
}
```

It can also be rewritten as CSS nested:

```css
table.colortable {
  & td {
    text-align: center;
    &.c {
      text-transform: uppercase;
    }
  }
}
```

4. Fix known [Flexbugs](https://github.com/philipwalton/flexbugs).
5. Provide compatibility with the following CSS features:
   - [`initial` attribute value](https://developer.mozilla.org/en-US/docs/Web/CSS/initial_value)
   - [`break-` attribute](https://developer.mozilla.org/en-US/docs/Web/CSS/break-after)
   - [`font-variant`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant)
   - [Media Query Ranges](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#syntax_improvements_in_level_4)

When you need to modify the PostCSS configuration, you can implement it through the underlying configuration [`tools.postcss`](/docs/configure/app/tools/postcss), here is an example:

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    postcss: {
      plugins: ['autoprefixer', ('postcss-flexbugs-fixes': {})],
    },
  },
});
```
