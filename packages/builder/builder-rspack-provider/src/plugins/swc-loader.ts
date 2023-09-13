import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  applyScriptCondition,
  getBrowserslistWithDefault,
  BuilderTarget,
  setConfig,
  isWebTarget,
  BundlerChain,
} from '@modern-js/builder-shared';
import * as path from 'path';
import type { BuilderPlugin, NormalizedConfig } from '../types';

export function getDefaultSwcConfig() {
  const cwd = process.cwd();
  return {
    cwd,
    jsc: {
      externalHelpers: true,
      parser: {
        tsx: true,
        syntax: 'typescript',
        decorators: true,
      },
      // todo: legacyDecorator?
      // Avoid the webpack magic comment to be removed
      // https://github.com/swc-project/swc/issues/6403
      preserveAllComments: true,
    },
    minify: false, // for loader, we don't need to minify, we do minification using plugin
    sourceMaps: true,
    env: {
      mode: undefined as string | undefined,
      targets: '> 0.01%, not dead, not op_mini all',
    },
    exclude: [],
    inlineSourcesContent: true,
  };
}
// todo: test decorators / babel / vue

/**
 * Provide some swc configs of rspack
 */
export const builderPluginSwcLoader = (): BuilderPlugin => ({
  name: 'builder-plugin-swc-loader',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, target }) => {
      const config = api.getNormalizedConfig();
      const polyfillEntryFileName = 'rspack-polyfill.js';

      const mode = config?.output?.polyfill ?? 'entry';
      const { entry } = api.context;
      if (['modern-web', 'web'].includes(target) && mode === 'entry') {
        Object.keys(entry).forEach(entryName => {
          chain.entry(entryName).prepend(polyfillEntryFileName);
        });

        const { default: RspackVirtualModulePlugin } = await import(
          'rspack-plugin-virtual-module'
        );

        chain.plugin('rspack-core-js-entry').use(RspackVirtualModulePlugin, [
          {
            [polyfillEntryFileName]: `import 'core-js'`,
          },
        ]);
      }

      // todo: handle babel
      let rule: any;

      if (!chain.module.rules.has(CHAIN_ID.RULE.JS)) {
        rule = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .test(mergeRegex(JS_REGEX, TS_REGEX))
          .type('javascript/auto');
        // todo: apply source.include
        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes: [],
          excludes: [],
        });
      }

      rule = chain.module.rule(CHAIN_ID.RULE.JS);

      const swcConfig = getDefaultSwcConfig();

      await setBrowserslist(api.context.rootPath, config, target, swcConfig);

      applyTransformImport(swcConfig, config.source.transformImport);

      if (isWebTarget(target)) {
        const polyfillMode = config.output.polyfill;

        if (polyfillMode === 'off' || polyfillMode === 'ua') {
          swcConfig.env.mode = undefined;
        } else {
          swcConfig.env.mode = polyfillMode;
          /* Apply core-js version and path alias and exclude core-js */
          await applyCoreJs(swcConfig, chain, rule);
        }
      }

      // topLevelAwait: true,
      rule
        .use(CHAIN_ID.USE.SWC)
        .loader('builtin:swc-loader')
        .options(swcConfig);
    });

    api.modifyRspackConfig(async config => {
      setConfig(
        config,
        'experiments.rspackFuture.disableTransformByDefault',
        true,
      );
    });
  },
});

async function applyCoreJs(swcConfig: any, chain: BundlerChain, rule: any) {
  const { getCoreJsVersion } = await import('@modern-js/utils');
  const coreJsPath = require.resolve('core-js/package.json');
  const version = getCoreJsVersion(coreJsPath);

  swcConfig.env!.coreJs = version;

  chain.resolve.alias.merge({
    'core-js': path.dirname(coreJsPath),
  });

  rule.exclude.add(coreJsPath);
}

async function setBrowserslist(
  rootPath: string,
  builderConfig: NormalizedConfig,
  target: BuilderTarget,
  swcConfig: any,
) {
  const browserslist = await getBrowserslistWithDefault(
    rootPath,
    builderConfig,
    target,
  );

  if (browserslist) {
    swcConfig.env!.targets = browserslist;
  }
}

function applyTransformImport(swcConfig: any, pluginImport?: any) {
  if (pluginImport !== false && pluginImport) {
    // ensureNoJsFunction(pluginImport);
    swcConfig.rspackExperiments ??= {};
    swcConfig.rspackExperiments.import ??= [];
    swcConfig.rspackExperiments.import.push(...pluginImport);
  }
}
