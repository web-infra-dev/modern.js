import { join } from 'path';
import {
  getRegExpForExts,
  FONT_EXTENSIONS,
  getDistPath,
  getFilename,
} from '@modern-js/builder-shared';
import { getDataUrlCondition } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginFont = (): BuilderPlugin => ({
  name: 'builder-plugin-font',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(FONT_EXTENSIONS);
      const distDir = getDistPath(config.output, 'font');
      const filename = getFilename(config.output, 'font', isProd);

      chain.module
        .rule(CHAIN_ID.RULE.FONT)
        .test(regExp)
        .type('asset')
        .parser({
          dataUrlCondition: getDataUrlCondition(config, 'font'),
        })
        .set('generator', {
          filename: join(distDir, filename),
        });
    });
  },
});
