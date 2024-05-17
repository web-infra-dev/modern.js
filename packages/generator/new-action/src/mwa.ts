import { merge } from '@modern-js/utils/lodash';
import { CodeSmith } from '@modern-js/codesmith';
import { FormilyAPI } from '@modern-js/codesmith-formily';
import {
  getMWANewActionSchema,
  MWAActionFunctions,
  MWAActionReactors,
  ActionFunction,
  MWAActionFunctionsDependencies,
  MWAActionFunctionsAppendTypeContent,
  MWAActionReactorAppendTypeContent,
  MWAActionFunctionsDevDependencies,
  MWANewActionGenerators,
  ActionType,
  i18n,
  Solution,
  ActionRefactor,
  MWAActionRefactorDependencies,
  MWANewActionPluginName,
  MWANewActionPluginDependence,
} from '@modern-js/generator-common';
import {
  getModernPluginVersion,
  getPackageManager,
} from '@modern-js/generator-utils';
import {
  alreadyRepo,
  getGeneratorPath,
  hasEnabledFunction,
  usePluginNameExport,
} from './utils';
import { enableAlreadyText } from './constants';

interface IMWANewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: string;
  cwd?: string;
  needInstall?: boolean;
}

export const MWANewAction = async (options: IMWANewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = '{}',
    cwd = process.cwd(),
    needInstall = true,
  } = options;

  let UserConfig: Record<string, unknown> = {};

  try {
    UserConfig = JSON.parse(config);
  } catch (e) {
    throw new Error('config is not a valid json');
  }

  const language = (UserConfig.locale as string) || locale;
  i18n.changeLanguage({ locale: language });

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

  const funcMap: Partial<Record<ActionFunction, boolean>> = {};
  MWAActionFunctions.forEach(func => {
    const enable = hasEnabledFunction(
      func,
      MWAActionFunctionsDependencies,
      MWAActionFunctionsDevDependencies,
      {},
      cwd,
    );
    funcMap[func] = enable;
  });

  const refactorMap: Partial<Record<ActionRefactor, boolean>> = {};

  MWAActionReactors.forEach(refactor => {
    const enable = hasEnabledFunction(
      refactor,
      MWAActionRefactorDependencies,
      {},
      {},
      cwd,
    );
    refactorMap[refactor] = enable;
  });

  const ans = await formilyAPI.getInputBySchemaFunc(getMWANewActionSchema, {
    ...UserConfig,
  });

  const actionType = ans.actionType as ActionType;

  const action = ans[actionType] as string;

  if (
    (actionType === ActionType.Function && funcMap[action as ActionFunction]) ||
    (actionType === ActionType.Refactor &&
      refactorMap[action as ActionRefactor])
  ) {
    smith.logger.error(enableAlreadyText[language]);
    return;
  }

  const generator = getGeneratorPath(
    MWANewActionGenerators[actionType][action],
    distTag,
  );

  if (!generator) {
    throw new Error(`no valid option`);
  }

  const getMwaPluginVersion = (packageName: string) => {
    return getModernPluginVersion(Solution.MWA, packageName, {
      registry,
      distTag,
      cwd,
    });
  };

  const devDependency =
    MWAActionFunctionsDevDependencies[action as ActionFunction];
  const dependency =
    MWAActionFunctionsDependencies[action as ActionFunction] ||
    MWAActionRefactorDependencies[action as ActionRefactor];

  const shouldUsePluginNameExport = await usePluginNameExport(Solution.MWA, {
    registry,
    distTag,
    cwd,
  });

  const finalConfig = merge(
    UserConfig,
    { noNeedInstall: !needInstall },
    ans,
    {
      locale: (UserConfig.locale as string) || locale,
      packageManager:
        UserConfig.packageManager || (await getPackageManager(cwd)),
      distTag,
    },
    {
      devDependencies: devDependency
        ? { [devDependency]: `${await getMwaPluginVersion(devDependency)}` }
        : {},
      dependencies: dependency
        ? {
            [dependency]: `${await getMwaPluginVersion(dependency)}`,
          }
        : {},
      appendTypeContent:
        MWAActionFunctionsAppendTypeContent[action as ActionFunction] ||
        MWAActionReactorAppendTypeContent[action as ActionRefactor],
      pluginName: MWANewActionPluginName[actionType][action],
      pluginDependence: MWANewActionPluginDependence[actionType][action],
      shouldUsePluginNameExport,
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
