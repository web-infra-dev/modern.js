import { CodeSmith } from '@modern-js/codesmith';
import { FormilyAPI } from '@modern-js/codesmith-formily';
import { merge } from '@modern-js/codesmith-utils/lodash';
import {
  type ActionFunction,
  ActionType,
  MWAActionFunctions,
  MWAActionFunctionsAppendTypeContent,
  MWAActionFunctionsDependencies,
  MWAActionFunctionsDevDependencies,
  MWANewActionGenerators,
  MWANewActionPluginDependence,
  MWANewActionPluginName,
  Solution,
  getMWANewActionSchema,
  i18n,
} from '@modern-js/generator-common';
import {
  getModernPluginVersion,
  getPackageManager,
} from '@modern-js/generator-utils';
import { enableAlreadyText } from './constants';
import {
  alreadyRepo,
  getGeneratorPath,
  hasEnabledFunction,
  usePluginNameExport,
} from './utils';

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
    registry,
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

  smith.logger?.timing('🕒 Run MWA New Tools');

  const prepareGlobalPromise = smith.prepareGlobal();

  const prepareGeneratorPromise = smith.prepareGenerators([
    `@modern-js/dependence-generator@${distTag || 'latest'}`,
    `@modern-js/bff-generator@${distTag || 'latest'}`,
    `@modern-js/server-generator@${distTag || 'latest'}`,
    `@modern-js/entry-generator@${distTag || 'latest'}`,
    `@modern-js/ssg-generator@${distTag || 'latest'}`,
  ]);

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

  const ans = await formilyAPI.getInputBySchemaFunc(getMWANewActionSchema, {
    ...UserConfig,
  });

  const actionType = ans.actionType as ActionType;

  const action = ans[actionType] as string;

  if (actionType === ActionType.Function && funcMap[action as ActionFunction]) {
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
  const dependency = MWAActionFunctionsDependencies[action as ActionFunction];

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
        MWAActionFunctionsAppendTypeContent[action as ActionFunction],
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

  await Promise.all([prepareGlobalPromise, prepareGeneratorPromise]);

  await smith.forge({
    tasks: task.map(runner => ({
      generator: runner.name,
      config: runner.config,
    })),
    pwd: cwd,
  });

  smith.logger?.timing('🕒 Run MWA New Tools', true);
};
