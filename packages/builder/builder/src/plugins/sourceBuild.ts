import { TS_CONFIG_FILE, type BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderPluginAPI as RspackBuilderPluginAPI } from '@modern-js/builder-rspack-provider';
import {
  getDependentProjects,
  filterByField,
  type Project,
  type ExtraMonorepoStrategies,
} from '@modern-js/monorepo-utils';
import { debug, fs } from '@modern-js/utils';
import path from 'path';

const log = debug('BUILDER_PLUGIN_SOURCE_BUILD');

export const pluginName = 'builder-plugin-source-build';

export const getSourceInclude = async (options: {
  projects: Project[];
  sourceField: string;
}) => {
  const { projects, sourceField } = options;

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

      let projects: Project[] = [];

      if (api.context.bundlerType === 'webpack') {
        (api as WebpackBuilderPluginAPI).modifyBuilderConfig(async config => {
          const { sourceBuild } = config.experiments ?? {};

          if (!sourceBuild) {
            return;
          }

          projects = await getDependentProjects(
            projectName || projectRootPath,
            {
              cwd: projectRootPath,
              recursive: true,
              filter: filterByField(sourceField),
              extraMonorepoStrategies,
            },
          );

          const includes = await getSourceInclude({
            projects,
            sourceField,
          });

          config.source = config.source ?? {};
          config.source.include = [
            ...(config.source.include ?? []),
            ...includes,
          ];
        });

        (api as WebpackBuilderPluginAPI).modifyWebpackChain(
          (chain, { CHAIN_ID }) => {
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

            const { TS_CONFIG_PATHS } = CHAIN_ID.RESOLVE_PLUGIN;

            // set references config
            // https://github.com/dividab/tsconfig-paths-webpack-plugin#options
            if (chain.resolve.plugins.has(TS_CONFIG_PATHS)) {
              chain.resolve.plugin(TS_CONFIG_PATHS).tap(options => {
                const references = projects
                  .map(project => path.join(project.dir, TS_CONFIG_FILE))
                  .filter(filePath => fs.existsSync(filePath))
                  .map(filePath => path.relative(projectRootPath, filePath));

                return options.map(option => ({
                  ...option,
                  references,
                }));
              });
            }
          },
        );
      }
    },
  };
}
