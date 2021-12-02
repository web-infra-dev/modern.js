import path from 'path';
import { merge } from 'lodash';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n,
  SolutionSchema,
  SolutionGenerator,
  Solution,
  SolutionDefualtConfig,
  BaseGenerator,
} from '@modern-js/generator-common';
import { GeneratorPlugin } from '@modern-js/generator-plugin';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const mergeDefaultConfig = (context: GeneratorContext) => {
  const { defaultSolution } = context.config;

  if (defaultSolution) {
    merge(
      context.config,
      { solution: defaultSolution },
      SolutionDefualtConfig[defaultSolution as Solution],
    );
  }
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
  if (!scenes) {
    return extendPlugin[solution] && extendPlugin[solution].length > 0;
  }
  if (scenes === solution) {
    return false;
  }
  return Boolean(customPlugin[solution]?.find(plugin => plugin.key === scenes));
};

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
  generatorPlugin?: GeneratorPlugin,
) => {
  const { solution } = await appApi.getInputBySchema(SolutionSchema, {
    ...context.config,
    customPlugin: generatorPlugin?.customPlugin,
  });

  const solutionGenerator =
    solution === 'custom'
      ? BaseGenerator
      : SolutionGenerator[solution as Solution];

  if (!solution || !solutionGenerator) {
    generator.logger.error('solution is not valid ');
  }

  await appApi.runSubGenerator(
    getGeneratorPath(solutionGenerator, context.config.distTag),
    undefined,
    {
      ...context.config,
      hasPlugin: getNeedRunPlugin(context, generatorPlugin),
      generatorPlugin,
    },
  );
};

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

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/repo-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  mergeDefaultConfig(context);

  let generatorPlugin;
  if (context.config.plugins) {
    generatorPlugin = await handlePlugin(context, generator);
  }

  try {
    await handleTemplateFile(context, generator, appApi, generatorPlugin);
  } catch (e) {
    generator.logger.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`forge @modern-js/repo-generator succeed `);
};
