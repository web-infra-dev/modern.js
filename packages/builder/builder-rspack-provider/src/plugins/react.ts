import type { BuilderPlugin, Rspack } from '../types';
import {
  setConfig,
  isUsingHMR,
  isClientCompiler,
  isProd,
} from '@modern-js/builder-shared';

// Not needed in Rsbuild
const setupCompiler = (compiler: Rspack.Compiler) => {
  if (!isClientCompiler(compiler)) {
    return;
  }

  // fix react refresh not work in Micro front-end projects when use legacy transformByDefault
  // https://github.com/web-infra-dev/rspack/pull/4628/files#diff-81b3afbbf84bc30f7332fb7bd43d52a4544ae16190d41b4b0fe8e8d4c9ca89e0R59
  const definedModules = {
    // For Mutiple Instance Mode
    __react_refresh_library__: JSON.stringify(
      compiler.webpack.Template.toIdentifier(
        compiler.options.output.uniqueName || compiler.options.output.library,
      ),
    ),
  };
  new compiler.webpack.DefinePlugin(definedModules).apply(compiler);
};

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      setConfig(rspackConfig, 'builtins.react', {
        development: !utils.isProd,
        refresh: usingHMR,
        // https://swc.rs/docs/configuration/compilation#jsctransformreactruntime
        runtime: 'automatic',
      });
    });

    api.modifyBundlerChain(async (chain, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      const { bundler } = utils;

      if (usingHMR) {
        chain.plugin('ReactRefreshRuntime').use(bundler.ProvidePlugin, [
          {
            $ReactRefreshRuntime$: [
              require.resolve('@rspack/plugin-react-refresh/react-refresh'),
            ],
          },
        ]);
      }
    });

    api.onAfterCreateCompiler(({ compiler: multiCompiler }) => {
      if (isProd()) {
        return;
      }

      if ((multiCompiler as Rspack.MultiCompiler).compilers) {
        (multiCompiler as Rspack.MultiCompiler).compilers.forEach(
          setupCompiler,
        );
      } else {
        setupCompiler(multiCompiler as Rspack.Compiler);
      }
    });
  },
});
