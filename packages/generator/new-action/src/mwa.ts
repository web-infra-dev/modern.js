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
  config?: Record<string, unknown>;
}

// eslint-disable-next-line max-statements
export const MWANewAction = async (options: IMWANewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = {},
  } = options;

  i18n.changeLanguage({ locale });

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
        process.cwd(),
      );
      const { when } = schemaItem;
      schemaItem.when = enable ? () => false : when;
    }
  });

  const ans = await appAPI.getInputBySchema(schema, config);

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
    config,
    ans,
    { locale, packageManager: getPackageManager() },
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
    pwd: process.cwd(),
  });
};
