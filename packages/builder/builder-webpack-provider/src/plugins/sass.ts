import path from 'path';
import { pathToFileURL } from 'url';
import {
  isUseCssSourceMap,
  SASS_REGEX,
  FileFilterUtil,
} from '@modern-js/builder-shared';
import type { BuilderPlugin, SassLoaderOptions } from '../types';
import _ from '@modern-js/utils/lodash';

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
      api.modifyWebpackChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import('./css');
        const { merge: deepMerge } = await import('@modern-js/utils/lodash');

        const getSassLoaderOptions = () => {
          const excludes: (RegExp | string)[] = [];

          const addExcludes: FileFilterUtil = items => {
            excludes.push(..._.castArray(items));
          };

          const mergedOptions = applyOptionsChain<
            SassLoaderOptions,
            { addExcludes: FileFilterUtil }
          >(
            {
              sourceMap: isUseCssSourceMap(config),
              implementation: utils.getCompiledPath('sass'),
            },
            config.tools.sass,
            { addExcludes },
            (
              defaults: SassLoaderOptions,
              userOptions: SassLoaderOptions,
            ): SassLoaderOptions => {
              return {
                ...defaults,
                ...userOptions,
                sassOptions: deepMerge(
                  defaults.sassOptions,
                  userOptions.sassOptions,
                ),
              };
            },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };

        const { options, excludes } = getSassLoaderOptions();
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
