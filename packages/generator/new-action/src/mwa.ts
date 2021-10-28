import { merge } from 'lodash';
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
  MWAActionFunctionsDevDependencies,
  MWANewActionGenerators,
  ActionType,
  i18n,
} from '@modern-js/generator-common';
import {
  getPackageManager,
  getPackageVersion,
} from '@modern-js/generator-utils';
import { alreadyRepo, hasEnabledFunction } from './utils';

interface IMWANewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: string;
  pwd?: string;
}

// eslint-disable-next-line max-statements
export const MWANewAction = async (options: IMWANewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = '{}',
    pwd,
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

  if (!alreadyRepo()) {
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
        pwd || process.cwd(),
      );
      const { when } = schemaItem;
      schemaItem.when = enable ? () => false : when;
    }
  });

  const ans = await appAPI.getInputBySchema(schema, UserConfig);

  const actionType = ans.actionType as ActionType;

  const action = ans[actionType] as string;

  let generator = MWANewActionGenerators[actionType][action];

  if (!generator) {
    throw new Error(`no valid option`);
  }

  if (distTag) {
    generator = `${generator}@${distTag}`;
  }

  const devDependencie =
    MWAActionFunctionsDevDependencies[action as ActionFunction];
  const dependence = MWAActionFunctionsDependencies[action as ActionFunction];

  const finalConfig = merge(
    UserConfig,
    ans,
    {
      locale: (UserConfig.locale as string) || locale,
      packageManager: getPackageManager(pwd),
    },
    {
      devDependencies: devDependencie
        ? { [devDependencie]: `^${await getPackageVersion(devDependencie)}` }
        : {},
      dependencies: dependence
        ? { [dependence]: `^${await getPackageVersion(dependence)}` }
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
    pwd: pwd || process.cwd(),
  });
};
