import { join } from 'path';
import {
  getRegExpForExts,
  FONT_EXTENSIONS,
  getDistPath,
} from '@modern-js/builder-shared';
import { getFilename, getDataUrlCondition } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginFont = (): BuilderPlugin => ({
  name: 'builder-plugin-font',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(FONT_EXTENSIONS);
      const distDir = getDistPath(config.output, 'font');
      const filename = getFilename(config, 'font', isProd);

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
