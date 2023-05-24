import {
  BuilderContext,
  BuilderTarget,
  DEFAULT_BROWSERSLIST,
  getBrowserslistWithDefault,
  DefaultBuilderPlugin,
  SharedNormalizedConfig,
} from '@modern-js/builder-shared';

export function builderPluginCheckSyntax(): DefaultBuilderPlugin {
  return {
    name: 'builder-plugin-check-syntax',

    setup(api) {
      api.modifyBundlerChain(async (chain, { isProd, target }) => {
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
        const { CheckSyntaxPlugin } = await import('@modern-js/builder-shared');
        chain.plugin(CheckSyntaxPlugin.name).use(CheckSyntaxPlugin, [
          {
            targets,
            exclude:
              typeof checkSyntax === 'object' ? checkSyntax.exclude : undefined,
          },
        ]);
      });
    },
  };
}

async function getCheckTargets(
  builderContext: BuilderContext,
  builderConfig: SharedNormalizedConfig,
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
