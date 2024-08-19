import path from 'path';
import type EventEmitter from 'events';
import {
  type GeneratorCore,
  type ILogger,
  getPackageInfo,
} from '@modern-js/codesmith';
import { fs, i18n as utilsI18n } from '@modern-js/generator-utils';
import {
  type Solution,
  SolutionSchemas,
  i18n as commonI18n,
} from '@modern-js/generator-common';
import { isFunction, merge } from '@modern-js/utils/lodash';
import type { Schema } from '@modern-js/codesmith-formily';
import {
  LifeCycle,
  type PluginAfterForgedFunc,
  PluginContext,
  type PluginForgedFunc,
} from './context';
import type { ICustomInfo } from './common';
import { getPackageMeta, installPlugins } from './utils';
import { i18n, localeKeys } from './locale';

export * from './context';
export * from './utils';
export * from './common';

export class GeneratorPlugin {
  plugins: Array<{
    module: any;
    templatePath: string;
    context?: PluginContext;
  }> = [];

  extendPlugin: Record<string, string[]> = {};

  customPlugin: Record<string, Array<ICustomInfo & { plugin: string }>> = {};

  readonly event?: EventEmitter;

  readonly logger: ILogger;

  constructor(logger: ILogger, event: EventEmitter, locale = 'en') {
    this.event = event;
    this.logger = logger;

    if (event) {
      event.on('forged', this.handleForged.bind(this));
    }

    commonI18n.changeLanguage({ locale });
    utilsI18n.changeLanguage({ locale });
    i18n.changeLanguage({ locale });
  }

  async setupPlugin(plugins: string[], registry?: string) {
    await Promise.all(
      plugins.map(async plugin => {
        let pkgJSON;
        if (plugin.startsWith('file:')) {
          pkgJSON = await fs.readJSON(
            path.join(process.cwd(), plugin.slice(5), 'package.json'),
          );
        } else if (path.isAbsolute(plugin)) {
          pkgJSON = await fs.readJSON(path.join(plugin, 'package.json'));
        } else {
          const { name, version: pkgVersion } = getPackageInfo(plugin);
          pkgJSON = await getPackageMeta(name, pkgVersion, {
            registryUrl: registry,
          });
        }
        const { meta } = pkgJSON;
        if (!meta) {
          throw new Error(i18n.t(localeKeys.plugin_no_meta_error, { plugin }));
        }
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

  getInputSchema(): Schema {
    let properties: Schema['properties'] = {};
    for (const info of this.plugins) {
      properties = {
        ...properties,
        ...info.context!.inputContext.getFinalInputs(),
      };
    }
    return {
      type: 'object',
      properties,
    };
  }

  getInputValue(): Record<string, unknown> {
    let result: Record<string, unknown> = {};
    for (const info of this.plugins) {
      result = merge(result, info.context!.inputContext.inputValue);
    }
    return result;
  }

  getDefaultConfig(): Record<string, unknown> {
    let result: Record<string, unknown> = {};
    for (const info of this.plugins) {
      result = merge(result, info.context!.inputContext.defaultConfig);
    }
    return result;
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
    this.logger.info(i18n.t(localeKeys.install_plugin));
    this.plugins = await installPlugins(plugins, inputData.registry);

    for (const info of this.plugins) {
      info.context = new PluginContext(
        SolutionSchemas[solution],
        inputData.locale,
      );
      info.context.inputContext.prepare(inputData);
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

  async handleForged(
    solution: Solution | 'custom',
    basePath: string,
    inputData: Record<string, any>,
    projectPath: string,
    generatorCore: GeneratorCore,
  ) {
    this.logger.info(i18n.t(localeKeys.run_plugin));
    const { generatorPlugin, ...restData } = inputData;
    if (solution !== restData.solution) {
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
        restData,
      );
      const onForgedFunc = info.context?.lifeCycleFuncMap[
        LifeCycle.OnForged
      ] as PluginForgedFunc;
      if (onForgedFunc && isFunction(onForgedFunc)) {
        await onForgedFunc(info.context!.forgedAPI, restData);
      }
    }
    for (const info of this.plugins) {
      const afterForged = info.context?.lifeCycleFuncMap[
        LifeCycle.AfterForged
      ] as PluginAfterForgedFunc;
      if (afterForged && isFunction(afterForged)) {
        await afterForged(info.context!.afterForgedAPI, restData);
      }
    }
    if (this.event) {
      this.event.emit('handle forged success');
    }
  }
}
