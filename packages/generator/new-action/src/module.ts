import { merge } from '@modern-js/utils/lodash';
import { CodeSmith } from '@modern-js/codesmith';
import { FormilyAPI } from '@modern-js/codesmith-formily';
import {
  i18n,
  getModuleNewActionSchema,
  ModuleActionFunctions,
  ActionFunction,
  ModuleActionFunctionsDependencies,
  ModuleActionFunctionsDevDependencies,
  ModuleActionFunctionsPeerDependencies,
  ModuleNewActionGenerators,
  ActionType,
  Solution,
} from '@modern-js/generator-common';
import {
  getPackageManager,
  getModernPluginVersion,
} from '@modern-js/generator-utils';
import { alreadyRepo, getGeneratorPath, hasEnabledFunction } from './utils';

interface IModuleNewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: string;
  cwd?: string;
}

export const ModuleNewAction = async (options: IModuleNewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = '{}',
    cwd = process.cwd(),
  } = options;

  let UserConfig: Record<string, unknown> = {};

  try {
    UserConfig = JSON.parse(config);
  } catch (e) {
    throw new Error('config is not a valid json');
  }

  i18n.changeLanguage({ locale: (UserConfig.locale as string) || locale });

  const smith = new CodeSmith({
    debug,
    registryUrl: registry,
  });

  if (!alreadyRepo(cwd)) {
    smith.logger.warn('not valid modern.js repo');
  }

  const formilyAPI = new FormilyAPI({
    materials: {},
    config: {},
    data: {},
    current: null,
  });

  let hasOption = false;

  const funcMap: Partial<Record<ActionFunction, boolean>> = {};
  ModuleActionFunctions.forEach(func => {
    const enable = hasEnabledFunction(
      func,
      ModuleActionFunctionsDependencies,
      ModuleActionFunctionsDevDependencies,
      ModuleActionFunctionsPeerDependencies,
      cwd,
    );
    funcMap[func] = enable;
    if (!enable) {
      hasOption = true;
    }
  });

  if (!hasOption) {
    smith.logger.warn('no option can be enabled');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  const ans = await formilyAPI.getInputBySchemaFunc(getModuleNewActionSchema, {
    ...UserConfig,
    funcMap,
  });

  const actionType = ans.actionType as ActionType;

  const action = ans[actionType] as string;

  const generator = getGeneratorPath(
    ModuleNewActionGenerators[actionType]![action],
    distTag,
  );
  if (!generator) {
    throw new Error(`no valid option`);
  }

  const devDependency =
    ModuleActionFunctionsDevDependencies[action as ActionFunction];
  const dependency =
    ModuleActionFunctionsDependencies[action as ActionFunction];
  const peerDependency =
    ModuleActionFunctionsPeerDependencies[action as ActionFunction];

  const getModulePluginVersion = (packageName: string) => {
    return getModernPluginVersion(Solution.Module, packageName, {
      registry,
      distTag,
    });
  };

  const finalConfig = merge(
    UserConfig,
    ans,
    {
      locale: (UserConfig.locale as string) || locale,
      packageManager:
        UserConfig.packageManager || (await getPackageManager(cwd)),
      distTag,
    },
    {
      devDependencies: devDependency
        ? { [devDependency]: `${await getModulePluginVersion(devDependency)}` }
        : {},
      dependencies: dependency
        ? { [dependency]: `${await getModulePluginVersion(dependency)}` }
        : {},
      peerDependencies: peerDependency
        ? {
            [peerDependency]: `${await getModulePluginVersion(peerDependency)}`,
          }
        : {},
    },
  );

  const task = [
    {
      name: generator,
      config: finalConfig,
    },
  ];

  await smith.forge({
    tasks: task.map(runner => ({
      generator: runner.name,
      config: runner.config,
    })),
    pwd: cwd,
  });
};
