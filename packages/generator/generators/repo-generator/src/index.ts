import {
  CodeSmith,
  type GeneratorContext,
  type GeneratorCore,
} from '@modern-js/codesmith';
import { getGeneratorPath } from '@modern-js/generator-utils';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  process.setMaxListeners(20);

  generator.logger.debug(`🚀 [Start Run Repo Generator]`);

  // check prepare global
  if (!(global as any).codesmith) {
    generator.logger.warn(
      '🟡 Please use the latest @modern-js/create version to run generator',
    );
    const codesmith = new CodeSmith({});
    await codesmith.prepareGlobal();
  }

  const RepoNextGeneratort = '@modern-js/repo-next-generator';

  await generator.runSubGenerator(
    getGeneratorPath(RepoNextGeneratort, context.config.distTag, [__dirname]),
    undefined,
    context.config,
  );

  generator.logger.debug(`🚀 [End Run Repo Generator]`);
};
