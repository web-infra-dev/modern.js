import {
  getDistPath,
  getSharedPkgCompiledPath,
  type DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginNodeAddons = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-node-addons',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { isServer, isServiceWorker, CHAIN_ID }) => {
        if (!isServer && !isServiceWorker) {
          return;
        }

        const { chalk, pkgUp } = await import('@modern-js/utils');

        const getDistName = (resource: string) => {
          const pkgJSON = pkgUp.sync({ cwd: resource });

          if (!pkgJSON) {
            throw new Error(
              `Failed to compile Node.js addons, couldn't find the package.json of ${chalk.yellow(
                resource,
              )}.`,
            );
          }

          const getFilename = (resource: string, pkgName: string) => {
            const reg = new RegExp(`node_modules/${pkgName}/(.+)`);
            const match = resource.match(reg);
            const filename = match?.[1];
            if (!filename) {
              return '[name].[ext]';
            }
            return `${filename}`;
          };

          const { name: pkgName } = require(pkgJSON);
          const config = api.getNormalizedConfig();
          const serverPath = getDistPath(config.output, 'server');
          return `${serverPath}/${getFilename(resource, pkgName)}`;
        };

        chain.module
          .rule(CHAIN_ID.RULE.NODE)
          .test(/\.node$/)
          .use(CHAIN_ID.USE.NODE)
          .loader(getSharedPkgCompiledPath('node-loader'))
          .options({
            name: getDistName,
          });
      },
    );
  },
});
