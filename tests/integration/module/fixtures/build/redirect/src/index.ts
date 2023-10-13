import css from './index.module.css';
import svg from './logo.svg';
import namedImport from '@/alias';
import * as wildcardImport from '@/alias';

export { a } from '@/alias';
console.log(css, svg, namedImport, wildcardImport);
