import { merge } from 'lodash';
import {
  CodeSmith,
  GeneratorCore,
  MaterialsManager,
} from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n,
  MonorepoNewActionSchema,
  SubSolution,
  SubSolutionGenerator,
  MonorepoNewActionConfig,
} from '@modern-js/generator-common';
import { getPackageManager } from '@modern-js/generator-utils';
import { alreadyRepo } from './utils';

interface IMonorepoNewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: Record<string, unknown>;
}
export const MonorepoNewAction = async (options: IMonorepoNewActionOption) => {
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

  const ans = await appAPI.getInputBySchema(MonorepoNewActionSchema, config);

  const solution = ans.solution as SubSolution;

  let generator = SubSolutionGenerator[solution];

  if (!generator) {
    throw new Error(`no valid repotype`);
  }

  if (distTag) {
    generator = `${generator}@${distTag}`;
  }

  const finalConfig = merge(config, ans, MonorepoNewActionConfig[solution], {
    locale,
    packageManager: getPackageManager(),
  });

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
