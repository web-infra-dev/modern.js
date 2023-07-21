import type { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderPluginAPI as RspackBuilderPluginAPI } from '@modern-js/builder-rspack-provider';
import {
  type ExtraMonorepoStrategies,
  getDependentProjects,
  filterByField,
} from '@modern-js/monorepo-utils';
import { debug } from '@modern-js/utils';

const log = debug('BUILDER_PLUGIN_SOURCE_BUILD');

export const pluginName = 'builder-plugin-source-build';

export const getSourceInclude = async (options: {
  projectNameOrRootPath: string;
  findMonorepoStartPath: string;
  sourceField: string;
  extraMonorepoStrategies?: ExtraMonorepoStrategies;
}) => {
  const {
    projectNameOrRootPath,
    sourceField,
    extraMonorepoStrategies,
    findMonorepoStartPath,
  } = options;
  const projects = await getDependentProjects(projectNameOrRootPath, {
    cwd: findMonorepoStartPath,
    recursive: true,
    filter: filterByField(sourceField),
    extraMonorepoStrategies,
  });

  const includes = [];
  for (const project of projects) {
    includes.push(...project.getSourceEntryPaths({ field: sourceField }));
  }

  log(`get include projects: ${includes}`);
  return includes;
};

export interface PluginSourceBuildOptions {
  projectName?: string;
  sourceField?: string;
  extraMonorepoStrategies?: ExtraMonorepoStrategies;
}

export function builderPluginSourceBuild(
  options?: PluginSourceBuildOptions,
): BuilderPlugin<WebpackBuilderPluginAPI | RspackBuilderPluginAPI> {
  const {
    projectName,
    sourceField = 'source',
    extraMonorepoStrategies,
  } = options ?? {};
  return {
    name: pluginName,

    async setup(api) {
      const projectRootPath = api.context.rootPath;

      // TODO: when rspack support tsconfig paths functionality, this comment will remove
      // if (api.context.bundlerType === 'rspack') {
      //   (api as RspackBuilderPluginAPI).modifyRspackConfig(async config => {
      //     // when support chain.resolve.conditionNames API, remove this logic
      //     setConfig(config, 'resolve.conditionNames', [
      //       '...', // Special syntax: retain the original value
      //       sourceField,
      //       ...(config.resolve?.conditionNames ?? []),
      //     ]);
      //   });
      // }
      if (api.context.bundlerType === 'webpack') {
        (api as WebpackBuilderPluginAPI).modifyBuilderConfig(async config => {
          const { sourceBuild = true } = config.experiments ?? {};

          if (!sourceBuild) {
            return;
          }
          const includes = await getSourceInclude({
            projectNameOrRootPath: projectName || projectRootPath,
            sourceField,
            findMonorepoStartPath: projectRootPath,
            extraMonorepoStrategies,
          });
          config.source = config.source ?? {};
          config.source.include = [
            ...(config.source.include ?? []),
            ...includes,
          ];
        });

        api.modifyBundlerChain((chain, { CHAIN_ID }) => {
          const {
            experiments: { sourceBuild },
            tools: { tsLoader },
          } = (api as WebpackBuilderPluginAPI).getNormalizedConfig();

          if (!sourceBuild) {
            return;
          }

          const useTsLoader = Boolean(tsLoader);
          // webpack.js.org/configuration/module/#ruleresolve
          chain.module
            .rule(useTsLoader ? CHAIN_ID.RULE.TS : CHAIN_ID.RULE.JS)
            .resolve.mainFields.merge(['...', sourceField]);

          // webpack chain not support resolve.conditionNames
          chain.module
            .rule(useTsLoader ? CHAIN_ID.RULE.TS : CHAIN_ID.RULE.JS)
            .resolve.merge({
              conditionNames: ['...', sourceField],
            });
        });
      }
    },
  };
}
