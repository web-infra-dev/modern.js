import { merge } from '@modern-js/utils/lodash';
import {
  CodeSmith,
  GeneratorCore,
  MaterialsManager,
} from '@modern-js/codesmith';
import { AppAPI, forEach } from '@modern-js/codesmith-api-app';
import {
  MWANewActionSchema,
  MWAActionFunctions,
  ActionFunction,
  MWAActionFunctionsDependencies,
  MWAActionFunctionsAppendTypeContent,
  MWAActionFunctionsDevDependencies,
  MWANewActionGenerators,
  ActionType,
  i18n,
  Solution,
} from '@modern-js/generator-common';
import {
  getModernPluginVersion,
  getPackageManager,
} from '@modern-js/generator-utils';
import { alreadyRepo, getGeneratorPath, hasEnabledFunction } from './utils';

interface IMWANewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: string;
  cwd?: string;
}

export const MWANewAction = async (options: IMWANewActionOption) => {
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

  const mockGeneratorCore = new GeneratorCore({
    logger: smith.logger,
    materialsManager: new MaterialsManager(),
    outputPath: '',
  });
  const appAPI = new AppAPI(
    { materials: {}, config: {}, data: {}, current: null },
    mockGeneratorCore,
  );

  const schema = forEach(MWANewActionSchema, (schemaItem: any) => {
    if (MWAActionFunctions.includes(schemaItem.key as ActionFunction)) {
      const enable = hasEnabledFunction(
        schemaItem.key as ActionFunction,
        MWAActionFunctionsDependencies,
        MWAActionFunctionsDevDependencies,
        {},
        cwd,
      );
      const { when } = schemaItem;
      schemaItem.when = enable ? () => false : when;
    }
  });

  const ans = await appAPI.getInputBySchema(schema, UserConfig);

  const actionType = ans.actionType as ActionType;

  const action = ans[actionType] as string;

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
    });
  };

  const devDependency =
    MWAActionFunctionsDevDependencies[action as ActionFunction];
  const dependency = MWAActionFunctionsDependencies[action as ActionFunction];

  const finalConfig = merge(
    UserConfig,
    ans,
    {
      locale: (UserConfig.locale as string) || locale,
      packageManager:
        UserConfig.packageManager || (await getPackageManager(cwd)),
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
