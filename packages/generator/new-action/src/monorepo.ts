import { merge } from 'lodash';
import {
  CodeSmith,
  FsMaterial,
  GeneratorContext,
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
  BaseGenerator,
} from '@modern-js/generator-common';
import { getPackageManager } from '@modern-js/generator-utils';
import { GeneratorPlugin } from '@modern-js/generator-plugin';
import { alreadyRepo } from './utils';

const handlePlugin = async (
  context: GeneratorContext,
  generator: GeneratorCore,
) => {
  const { plugins, registry } = context.config;
  const generatorPlugin = new GeneratorPlugin(
    generator.logger,
    generator.event,
  );
  await generatorPlugin.setupPlugin(plugins, registry);
  return generatorPlugin;
};

const getNeedRunPlugin = (
  context: GeneratorContext,
  generatorPlugin?: GeneratorPlugin,
): boolean => {
  if (!generatorPlugin) {
    return false;
  }
  const { extendPlugin, customPlugin } = generatorPlugin;
  const { solution, scenes } = context.config;
  if (!scenes || scenes === solution) {
    return extendPlugin?.[solution] && extendPlugin[solution].length > 0;
  }
  return Boolean(customPlugin[solution]?.find(plugin => plugin.key === scenes));
};

interface IMonorepoNewActionOption {
  locale?: string;
  distTag?: string;
  debug?: boolean;
  registry?: string;
  config?: string;
  plugins?: string;
  cwd?: string;
}
// eslint-disable-next-line max-statements
export const MonorepoNewAction = async (options: IMonorepoNewActionOption) => {
  const {
    locale = 'zh',
    distTag = '',
    debug = false,
    registry = '',
    config = '{}',
    plugins = [],
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
  const mockContext: GeneratorContext = {
    materials: {},
    config: {},
    current: {
      material: new FsMaterial(cwd),
    },
  };
  const appAPI = new AppAPI(
    { materials: {}, config: {}, data: {}, current: null },
    mockGeneratorCore,
  );

  let generatorPlugin: GeneratorPlugin | undefined;

  if (plugins.length) {
    generatorPlugin = await handlePlugin(mockContext, mockGeneratorCore);
  }

  const ans = await appAPI.getInputBySchema(MonorepoNewActionSchema, {
    ...UserConfig,
    customPlugin: generatorPlugin?.customPlugin,
  });

  const { solution } = ans;

  let generator =
    solution === 'custom'
      ? BaseGenerator
      : SubSolutionGenerator[solution as SubSolution];

  if (!generator) {
    throw new Error(`no valid repotype`);
  }

  if (distTag) {
    generator = `${generator}@${distTag}`;
  }

  mockContext.config = merge(UserConfig, ans);

  const finalConfig = merge(
    UserConfig,
    ans,
    MonorepoNewActionConfig[solution as SubSolution],
    {
      locale: (UserConfig.locale as string) || locale,
      packageManager: getPackageManager(cwd),
      hasPlugin: getNeedRunPlugin(mockContext, generatorPlugin),
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
