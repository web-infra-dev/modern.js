import type { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderPluginAPI as RspackBuilderPluginAPI } from '@modern-js/builder-rspack-provider';
import {
  type ExtraMonorepoStrategies,
  getDependentProjects,
  filterByField,
} from '@modern-js/monorepo-utils';

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
    includes.push(...project.getSourceEntryPaths());
  }

  return includes;
};

export interface PluginSourceBuildOptions {
  projectName?: string;
  sourceField?: string;
  extraMonorepoStrategies?: ExtraMonorepoStrategies;
}

export const sourceBuildInWebpack = (
  api: WebpackBuilderPluginAPI,
  options: {
    sourceField: string;
    projectRootPath: string;
    projectName?: string;
    extraMonorepoStrategies?: ExtraMonorepoStrategies;
  },
) => {
  const { sourceField, projectRootPath, projectName, extraMonorepoStrategies } =
    options;
  api.modifyBuilderConfig(async config => {
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
    config.source.include = [...(config.source.include ?? []), ...includes];
  });

  api.modifyBundlerChain(chain => {
    const {
      experiments: { sourceBuild },
    } = api.getNormalizedConfig();

    if (!sourceBuild) {
      return;
    }

    // Now not support chain.resolve.conditionNames API
    // chain.resolve.conditionNames.prepend(sourcePkgField);

    // when user not config source.resolveMainFields, mainFields is empty array
    if (chain.resolve.mainFields.values().length === 0) {
      // "..." is special syntax,it will retain the original value
      chain.resolve.mainFields.prepend('...');
      chain.resolve.mainFields.prepend(sourceField);
    }
  });

  api.modifyWebpackConfig(async config => {
    const {
      experiments: { sourceBuild },
    } = api.getNormalizedConfig();

    if (!sourceBuild) {
      return;
    }

    config.resolve = config.resolve ?? {};
    config.resolve.conditionNames = [
      '...', // Special syntax: retain the original value
      sourceField,
      ...(config.resolve.conditionNames ?? []),
    ];
  });
};

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
      //   if (api.context.bundlerType === 'rspack') {
      //     (api as RspackBuilderPluginAPI).modifyRspackConfig(async config => {
      // // when support chain.resolve.conditionNames API, remove this logic
      //       setConfig(config, 'resolve.conditionNames', [
      //         '...', // Special syntax: retain the original value
      //         sourceField,
      //         ...(config.resolve?.conditionNames ?? []),
      //       ]);
      //     });
      //   }
      if (api.context.bundlerType === 'webpack') {
        sourceBuildInWebpack(api as WebpackBuilderPluginAPI, {
          projectRootPath,
          sourceField,
          projectName,
          extraMonorepoStrategies,
        });
      }
    },
  };
}
