import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { Schema } from '@modern-js/easy-form-core';
import { PluginFileAPI } from './file';
import { PluginGitAPI } from './git';
import { IInput, IOption, PluginInputContext } from './input';
import { PluginNpmAPI } from './npm';
import { AddFileParams, AddManyFilesParams } from '@/utils/file';

export interface IPluginContext {
  addInputBefore: (key: string, input: IInput) => void;
  addInputAfter: (key: string, input: IInput) => void;
  setInput: (key: string, field: string, value: unknown) => void;
  addOptionBefore: (key: string, optionKey: string, option: IOption) => void;
  addOptionAfter: (key: string, optionKey: string, option: IOption) => void;
  isFileExit: (fileName: string) => Promise<boolean>;
  readDir: (dir: string) => Promise<string[]>;
  setGitMessage: (gitMessage: string) => void;
  onForged: (func: PluginForgedFunc) => void;
  afterForged: (func: PluginAfterForgedFunc) => void;
}

export enum LifeCycle {
  OnForged = 'onForged',
  AfterForged = 'afterForged',
}

export type ForgedAPI = {
  addFile: (params: AddFileParams) => Promise<void>;
  addManyFiles: (params: AddManyFilesParams) => Promise<void>;
  updateJSONFile: (
    fileName: string,
    updateInfo: Record<string, unknown>,
  ) => Promise<void>;
  updateTextRawFile: (
    fileName: string,
    update: (content: string[]) => string[],
  ) => Promise<void>;
  rmFile: (fileName: string) => Promise<void>;
  rmDir: (dirName: string) => Promise<void>;
  addHelper: (name: string, fn: Handlebars.HelperDelegate) => void;
  addPartial: (name: string, str: Handlebars.Template) => void;
};

export type AfterForgedAPI = {
  isInGitRepo: () => Promise<boolean>;
  initGitRepo: () => Promise<void>;
  gitAddAndCommit: (commitMessage: string) => Promise<void>;
  install: () => Promise<void>;
};

type PluginForgedFunc = (
  api: ForgedAPI,
  inputData: Record<string, unknown>,
) => Promise<void>;

type PluginAfterForgedFunc = (
  api: AfterForgedAPI,
  inputData: Record<string, unknown>,
) => Promise<void>;

export class PluginContext {
  generator: GeneratorCore;

  generatorContext: GeneratorContext;

  inputContext: PluginInputContext;

  gitAPI: PluginGitAPI;

  fileAPI: PluginFileAPI;

  npmAPI: PluginNpmAPI;

  lifeCycleFuncMap: Record<LifeCycle, unknown> = {
    [LifeCycle.OnForged]: () => {
      /* empty */
    },
    [LifeCycle.AfterForged]: () => {
      /* empty */
    },
  };

  constructor(
    generator: GeneratorCore,
    context: GeneratorContext,
    projectPath: string,
    inputs: Schema[],
  ) {
    this.generator = generator;
    this.generatorContext = context;
    this.inputContext = new PluginInputContext(inputs);
    this.gitAPI = new PluginGitAPI(generator, context);
    this.fileAPI = new PluginFileAPI(generator, context, projectPath);
    this.npmAPI = new PluginNpmAPI(projectPath, context.config.packageManager);
  }

  get context(): IPluginContext {
    return {
      ...this.inputContext.context,
      ...this.gitAPI.context,
      ...this.fileAPI.context,
      onForged: this.onForged.bind(this),
      afterForged: this.afterForged.bind(this),
    };
  }

  get forgedAPI(): ForgedAPI {
    return {
      ...this.fileAPI.method,
    };
  }

  get afterForgedAPI(): AfterForgedAPI {
    return {
      ...this.gitAPI.method,
      ...this.npmAPI.method,
    };
  }

  onForged(func: PluginForgedFunc) {
    this.lifeCycleFuncMap[LifeCycle.OnForged] = func;
  }

  afterForged(func: PluginAfterForgedFunc) {
    this.lifeCycleFuncMap[LifeCycle.AfterForged] = func;
  }
}
