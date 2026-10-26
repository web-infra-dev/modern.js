import { rslibConfig } from '@modern-js/rslib';
import { define } from 'rstack';

define.lib({
  ...rslibConfig,
  source: { entry: { index: ['./src/**/*.{ts,tsx}', '!./src/**/*.test.*'] } },
});
