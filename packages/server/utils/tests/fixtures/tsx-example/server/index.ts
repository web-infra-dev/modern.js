import { bar } from '../shared/bar';
import data from '../shared/data.json' with { type: 'json' };
import { Foo } from './foo';
// A hand-written ESM file: it is copied as-is, so the specifier must keep `.mjs`.
import { helperName } from './helper.mjs';
// Same for CommonJS files that are copied instead of compiled.
import legacy from './legacy.cjs';

export const loadData = () =>
  import('../shared/data.json', { with: { type: 'json' } });

// Non-literal specifiers can only be resolved at runtime and must be emitted
// exactly as written.
export const loadLocaleTemplate = (lang: string) =>
  import(`./locales/${lang}.js`);

export const loadLocaleConcat = (lang: string) =>
  // biome-ignore lint/style/useTemplate: the concatenated specifier is the case under test
  import('./locales/' + lang + '.js');

const server = () => {
  return `${Foo()}-${bar}-${helperName}-${legacy.legacyName}-${data.name}`;
};

export default server;
