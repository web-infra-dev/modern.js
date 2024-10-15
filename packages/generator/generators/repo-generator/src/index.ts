import {
  CodeSmith,
  type GeneratorContext,
  type GeneratorCore,
} from '@modern-js/codesmith';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  process.setMaxListeners(20);

  // check prepare global

  if (!(global as any).codesmith) {
    generator.logger.warn(
      '🟡 Please use the latest @modern-js/create version to run generator',
    );
    const codesmith = new CodeSmith({});
    await codesmith.prepareGlobal();
  }

  generator.logger.debug(`🚀 [Start Run Repo Generator]`);

  generator.logger.debug(`🚀 [End Run Repo Generator]`);
};
