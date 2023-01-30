import {
  BuilderContext,
  BuilderTarget,
  DEFAULT_BROWSERSLIST,
  getBrowserslistWithDefault,
} from '@modern-js/builder-shared';
import type { BuilderPlugin, NormalizedConfig } from '../types';

export function builderPluginCheckSyntax(): BuilderPlugin {
  return {
    name: 'builder-plugin-check-syntax',

    setup(api) {
      api.modifyWebpackChain(async (chain, { isProd, target }) => {
        const config = api.getNormalizedConfig();
        const { checkSyntax } = config.security;

        if (
          !isProd ||
          ['node', 'web-worker'].includes(target) ||
          !checkSyntax
        ) {
          return;
        }

        const targets = await getCheckTargets(
          api.context,
          config,
          target,
          checkSyntax,
        );
        const { CheckSyntaxPlugin } = await import(
          '../webpackPlugins/CheckSyntaxPlugin'
        );
        chain.plugin(CheckSyntaxPlugin.name).use(CheckSyntaxPlugin, [targets]);
      });
    },
  };
}

async function getCheckTargets(
  builderContext: BuilderContext,
  builderConfig: NormalizedConfig,
  builderTarget: BuilderTarget,
  checkSyntax: { targets: string[] } | true,
) {
  if (checkSyntax === true) {
    const browserslist = await getBrowserslistWithDefault(
      builderContext.rootPath,
      builderConfig,
      builderTarget,
    );

    return browserslist || DEFAULT_BROWSERSLIST[builderTarget];
  }
  return checkSyntax.targets;
}
