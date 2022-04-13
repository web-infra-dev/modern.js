import { merge } from '@modern-js/utils/lodash';
import {
  CodeSmith,
  GeneratorCore,
  MaterialsManager,
} from '@modern-js/codesmith';
import { AppAPI, forEach } from '@modern-js/codesmith-api-app';
import {
  i18n,
  ModuleNewActionSchema,
  ModuleActionFunctions,
  ActionFunction,
  ModuleActionFunctionsDependencies,
  ModuleActionFunctionsDevDependencies,
  ModuleActionFunctionsPeerDependencies,
  ModuleNewActionGenerators,
  ActionType,
} from '@modern-js/generator-common';
import {
  getPackageVersion,
  getPackageManager,
} from '@modern-js/generator-utils';
import { alreadyRepo, hasEnabledFunction } from './utils';

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

  const mockGeneratorCore = new GeneratorCore({
    logger: smith.logger,
    materialsManager: new MaterialsManager(),
    outputPath: '',
  });
  const appAPI = new AppAPI(
    { materials: {}, config: {}, data: {}, current: null },
    mockGeneratorCore,
  );

  let hasOption = false;

  const schema = forEach(ModuleNewActionSchema, (schemaItem: any) => {
    if (ModuleActionFunctions.includes(schemaItem.key as ActionFunction)) {
      const enable = hasEnabledFunction(
        schemaItem.key as ActionFunction,
        ModuleActionFunctionsDependencies,
        ModuleActionFunctionsDevDependencies,
        ModuleActionFunctionsPeerDependencies,
        cwd,
      );
      const { when } = schemaItem;
      schemaItem.when = enable ? () => false : when;
      if (!enable) {
        hasOption = true;
      }
    }
  });

  if (!hasOption) {
    smith.logger.warn('no option can be enabled');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  const ans = await appAPI.getInputBySchema(schema, UserConfig);

  const actionType = ans.actionType as ActionType;

  const action = ans[actionType] as string;

  let generator =
    ModuleNewActionGenerators[actionType] &&
    ModuleNewActionGenerators[actionType]![action];

  if (!generator) {
    throw new Error(`no valid option`);
  }

  if (distTag) {
    generator = `${generator}@${distTag}`;
  }

  const devDependency =
    ModuleActionFunctionsDevDependencies[action as ActionFunction];
  const dependency =
    ModuleActionFunctionsDependencies[action as ActionFunction];
  const peerDependency =
    ModuleActionFunctionsPeerDependencies[action as ActionFunction];

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
        ? { [devDependency]: `^${await getPackageVersion(devDependency)}` }
        : {},
      dependencies: dependency
        ? { [dependency]: `^${await getPackageVersion(dependency)}` }
        : {},
      peerDependencies: peerDependency
        ? {
            [peerDependency]: `^${await getPackageVersion(peerDependency)}`,
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
