import path from 'path';
import EventEmitter from 'events';
import packageJson from 'package-json';
import { GeneratorCore, ILogger } from '@modern-js/codesmith';
import { fs } from '@modern-js/generator-utils';
import { Solution, SolutionSchemas } from '@modern-js/generator-common';
import { PluginContext } from './context';
import { ICustomInfo } from './common';

export * from './context';

export class GeneratorPlugin {
  extendPlugin: Record<string, string[]> = {};

  customPlugin: Record<string, Array<ICustomInfo & { plugin: string }>> = {};

  private readonly event?: EventEmitter;

  private readonly logger: ILogger;

  constructor(logger: ILogger, event: EventEmitter) {
    this.event = event;
    this.logger = logger;

    if (event) {
      event.on('forged', this.handleForged.bind(this));
    }
  }

  async setupPlugin(plugins: string[], registry?: string) {
    await Promise.all(
      plugins.map(async plugin => {
        let pkgJSON;
        if (path.isAbsolute(plugin)) {
          pkgJSON = await fs.readJSON(path.join(plugin, 'package.json'));
        } else {
          pkgJSON = packageJson(plugin.toLowerCase(), {
            registryUrl: registry,
          });
        }
        const { meta } = pkgJSON;
        if (meta.extend) {
          this.extendPlugin[meta.extend] = [
            ...(this.extendPlugin[meta.extend] || []),
            plugin,
          ];
        } else if (meta.type && meta.key) {
          this.customPlugin[meta.type] = [
            ...(this.customPlugin[meta.type] || []),
            {
              ...meta,
              plugin,
            },
          ];
        }
      }),
    );
  }

  // eslint-disable-next-line max-params
  async handleForged(
    solution: Solution | 'custom',
    basePath: string,
    inputData: Record<string, any>,
    projectPath: string,
    generatorCore: GeneratorCore,
  ) {
    const templatePath = '';
    const context = new PluginContext(
      generatorCore,
      solution,
      path.join(basePath, projectPath),
      templatePath,
      inputData,
      SolutionSchemas[solution],
    );
    console.info(context);
  }
}
