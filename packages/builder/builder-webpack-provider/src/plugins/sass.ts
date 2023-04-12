import path from 'path';
import { pathToFileURL } from 'url';
import {
  isUseCssSourceMap,
  SASS_REGEX,
  getSassLoaderOptions,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

/** fix issue about dart2js: https://github.com/dart-lang/sdk/issues/27979 */
export function patchGlobalLocation() {
  const href = `${pathToFileURL(process.cwd()).href}${path.sep}`;
  // @ts-expect-error
  global.location ||= {};
  global.location.href ||= href;
}

export function builderPluginSass(): BuilderPlugin {
  return {
    name: 'builder-plugin-sass',
    setup(api) {
      patchGlobalLocation();
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const { options, excludes } = await getSassLoaderOptions(
          config.tools.sass,
          isUseCssSourceMap(config),
        );
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX);

        excludes.forEach(item => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule(rule, config, api.context, utils);

        rule
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(utils.getCompiledPath('sass-loader'))
          .options(options);
      });
    },
  };
}
