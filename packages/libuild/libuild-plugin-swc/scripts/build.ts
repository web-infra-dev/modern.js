import { Libuilder } from '@modern-js/libuild';

Libuilder.run({
  format: 'cjs',
  target: 'es2019',
  external: ['@modern-js/swc-plugins', 'chalk']
});
