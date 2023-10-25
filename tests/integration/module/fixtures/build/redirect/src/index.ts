// css module
import css from './index.module.css';

// asset
import svg from './logo.svg';

// alias
import namedImport, { a, b } from '@/alias';
import * as wildcardImport from '@/alias';

export { a, b } from '@/alias';
export * from '@/alias';
export * as c from '@/alias';

// autoExtension
export * from './extension.mts';

console.log(css, svg, a, b, namedImport, wildcardImport);
