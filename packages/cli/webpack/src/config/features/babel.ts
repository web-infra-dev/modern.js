import path from 'path';
import { API_DIR, CHAIN_ID, fs } from '@modern-js/utils';
import type { WebpackChain } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import {
  Options as BabelPresetAppOptions,
  createBabelChain,
} from '@modern-js/babel-preset-app';
import { getBabelOptions } from '../../utils/getBabelOptions';
import { JS_REGEX, TS_REGEX } from '../../utils/constants';
import { mergeRegex } from '../../utils/mergeRegex';
import { getSourceIncludes } from '../../utils/getSourceIncludes';
import type { ChainUtils } from '../shared';

export const CORE_JS_ENTRY = path.resolve(
  __dirname,
  '../../runtime/core-js-entry.js',
);

/**
 * Condition of babel-loader and ts-loader.
 *
 * Will compile:
 * - All folders in app directory, such as `src/`, `shared/`...
 * - Internal folder `node_modules/.modern.js`
 * - User configured paths in `source.include`
 * - User configured paths in `addIncludes` of `tools.babel` and `tools.tsLoader`
 * - Entry file of core-js when `output.polyfill` is `entry`
 * - Internal sub-projects in modern.js monorepo: `/<MonorepoRoot>/features/*`
 *
 * Will not compile:
 * - All dependencies in `node_modules/`
 * - BFF API folder: `<appDirectory>/api`
 * - Folders outside the app directory, such as `../../packages/foo/`
 * - User configured paths in `addExcludes` of `tools.babel` and `tools.tsLoader`
 */
export function applyScriptCondition({
  rule,
  config,
  includes,
  excludes,
  appContext,
}: {
  rule: WebpackChain.Rule<WebpackChain.Rule<WebpackChain.Module>>;
  config: NormalizedConfig;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
  appContext: IAppContext;
}) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [appContext.appDirectory, { not: /node_modules/ }],
  });

  // internalDirectory should by compiled by default
  rule.include.add(appContext.internalDirectory);

  // let babel to transform core-js-entry, make `useBuiltins: 'entry'` working
  if (config.output.polyfill === 'entry') {
    rule.include.add(CORE_JS_ENTRY);
  }

  // source.includes from modern.config.js
  const sourceIncludes = getSourceIncludes(appContext.appDirectory, config);
  sourceIncludes.forEach(condition => {
    rule.include.add(condition);
  });

  // exclude the api folder if exists
  const apiDir = path.resolve(appContext.appDirectory, API_DIR);
  if (fs.existsSync(apiDir)) {
    rule.exclude.add(apiDir);
  }

  includes.forEach(condition => {
    rule.include.add(condition);
  });
  excludes.forEach(condition => {
    rule.exclude.add(condition);
  });
}

export function applyBabelLoader({
  config,
  loaders,
  appContext,
  useTsLoader,
  babelPresetAppOptions,
}: ChainUtils & {
  useTsLoader: boolean;
  babelPresetAppOptions?: Partial<BabelPresetAppOptions>;
}) {
  const { options, includes, excludes } = getBabelOptions(
    appContext.metaName,
    appContext.appDirectory,
    config,
    createBabelChain(),
    babelPresetAppOptions,
  );

  const rule = loaders
    .oneOf(CHAIN_ID.ONE_OF.JS)
    .test(useTsLoader ? JS_REGEX : mergeRegex(JS_REGEX, TS_REGEX));

  applyScriptCondition({
    rule,
    config,
    includes,
    excludes,
    appContext,
  });

  rule
    .use(CHAIN_ID.USE.BABEL)
    .loader(require.resolve('../../../compiled/babel-loader'))
    .options(options);
}

// add core-js-entry to every entries
export function addCoreJsEntry({ chain, config }: ChainUtils) {
  if (config.output.polyfill === 'entry') {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});

    for (const name of entryPoints) {
      chain.entry(name).prepend(CORE_JS_ENTRY);
    }
  }
}
