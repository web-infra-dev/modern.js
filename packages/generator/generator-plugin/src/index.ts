import path from 'path';
import EventEmitter from 'events';
import packageJson from 'package-json';
import { GeneratorCore, ILogger } from '@modern-js/codesmith';
import { fs } from '@modern-js/generator-utils';
import { Solution, SolutionSchemas } from '@modern-js/generator-common';
import { isFunction } from 'lodash';
import { Schema } from '@modern-js/easy-form-core';
import {
  LifeCycle,
  PluginAfterForgedFunc,
  PluginContext,
  PluginForgedFunc,
} from './context';
import { ICustomInfo } from './common';
import { installPlugins } from './utils';

export * from './context';

export class GeneratorPlugin {
  extendPlugin: Record<string, string[]> = {};

  customPlugin: Record<string, Array<ICustomInfo & { plugin: string }>> = {};

  private readonly event?: EventEmitter;

  private readonly logger: ILogger;

  private plugins: Array<{
    module: any;
    templatePath: string;
    context?: PluginContext;
  }> = [];

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

  getInputSchema(solution: Solution | 'custom'): Schema {
    let items: Schema[] = [];
    for (const info of this.plugins) {
      items = [...items, ...info.context!.inputContext.getFinalInputs()];
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

    for (const info of this.plugins) {
      info.context = new PluginContext(SolutionSchemas[solution]);
      info.module(info.context.context);
    }
  }

  getGitMessage() {
    let result = '';
    for (const info of this.plugins) {
      if (info.context?.gitAPI.gitMessage) {
        result = info.context?.gitAPI.gitMessage || '';
      }
    }
    return result;
  }

  // eslint-disable-next-line max-params
  async handleForged(
    solution: Solution | 'custom',
    basePath: string,
    inputData: Record<string, any>,
    projectPath: string,
    generatorCore: GeneratorCore,
  ) {
    if (solution !== inputData.solution) {
      if (this.event) {
        this.event.emit('handle forged success');
      }
      return;
    }
    for (const info of this.plugins) {
      info.context?.handlePrepareContext(
        generatorCore,
        solution,
        path.join(basePath, projectPath),
        path.join(info.templatePath, 'templates'),
        inputData,
      );
      const onForgedFunc = info.context?.lifeCycleFuncMap[
        LifeCycle.OnForged
      ] as PluginForgedFunc;
      if (onForgedFunc && isFunction(onForgedFunc)) {
        await onForgedFunc(info.context!.forgedAPI, inputData);
      }
    }
    for (const info of this.plugins) {
      const afterForged = info.context?.lifeCycleFuncMap[
        LifeCycle.AfterForged
      ] as PluginAfterForgedFunc;
      if (afterForged && isFunction(afterForged)) {
        await afterForged(info.context!.afterForgedAPI, inputData);
      }
    }
    if (this.event) {
      this.event.emit('handle forged success');
    }
  }
}
