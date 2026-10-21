// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.staged({
  '*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}': ['rs lint', 'rs fmt'],
  '*.{md,mdx,json,json5,yml,yaml,css,less,scss,html}': 'rs fmt',
});

define.fmt({
  singleQuote: true,
});
