import path from 'path';
import EventEmitter from 'events';
import packageJson from 'package-json';
import { GeneratorCore, ILogger } from '@modern-js/codesmith';
import { fs } from '@modern-js/generator-utils';
import { Solution, SolutionSchemas } from '@modern-js/generator-common';
import { isFunction } from 'lodash';
import { Schema } from '@modern-js/easy-form-core';
import { LifeCycle, PluginContext } from './context';
import { ICustomInfo } from './common';
import { installPlugins } from './utils';

export * from './context';

export class GeneratorPlugin {
  extendPlugin: Record<string, string[]> = {};

  customPlugin: Record<string, Array<ICustomInfo & { plugin: string }>> = {};

  private readonly event?: EventEmitter;

  private readonly logger: ILogger;

  private plugins: Array<{ module: any; templatePath: string }> = [];

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

  getInputSchema(
    generatorCore: GeneratorCore,
    solution: Solution | 'custom',
  ): Schema {
    let items: Schema[] = [];
    for (const info of this.plugins) {
      const context = new PluginContext(
        generatorCore,
        solution,
        '',
        info.templatePath,
        {},
        SolutionSchemas[solution],
      );
      items = [...items, ...context.inputContext.getFinalInputs()];
    }
    return {
      key: `${solution}_plugin_schema`,
      isObject: true,
      items,
    };
  }

  async installPlugins(
    solution: Solution | 'custom',
    inputData: Record<string, any>,
  ) {
    let plugins: string[] = [];
    if (this.extendPlugin[solution] && this.extendPlugin[solution].length > 0) {
      plugins = [...plugins, ...this.extendPlugin[solution]];
    }
    if (this.customPlugin[solution]) {
      const plugin = this.customPlugin[solution].find(
        item => item.key === inputData.scenes,
      );
      if (plugin) {
        plugins.push(plugin.plugin);
      }
    }
    this.plugins = await installPlugins(plugins, inputData.registry);
  }

  // eslint-disable-next-line max-params
  async handleForged(
    solution: Solution | 'custom',
    basePath: string,
    inputData: Record<string, any>,
    projectPath: string,
    generatorCore: GeneratorCore,
  ) {
    for (const info of this.plugins) {
      const context = new PluginContext(
        generatorCore,
        solution,
        path.join(basePath, projectPath),
        info.templatePath,
        inputData,
        SolutionSchemas[solution],
      );
      const onForgedFunc: any = context.lifeCycleFuncMap[LifeCycle.OnForged];
      if (onForgedFunc && isFunction(onForgedFunc)) {
        onForgedFunc(context, inputData);
      }
    }
    for (const info of this.plugins) {
      const context = new PluginContext(
        generatorCore,
        solution,
        path.join(basePath, projectPath),
        info.templatePath,
        inputData,
        SolutionSchemas[solution],
      );
      const afterForged: any = context.lifeCycleFuncMap[LifeCycle.AfterForged];
      if (afterForged && isFunction(afterForged)) {
        afterForged(context, inputData);
      }
    }
    if (this.event) {
      this.event.emit('handle forged success');
    }
  }
}
