import { rslibConfig } from '@modern-js/rslib';
import { define } from 'rstack';

define.lib({
  ...rslibConfig,
  lib: rslibConfig.lib
    .filter(config => config.id === 'cjs-node')
    .map(config => ({ ...config, dts: { distPath: 'dist/types' } })),
});
